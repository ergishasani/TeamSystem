"""
OpenAI-powered benefits concierge with tool calling.

The LLM is given a set of read-only tools (search offers, check wallet, get
recommendations, build a package suggestion) and decides which to call to answer
the employee. All tools are scoped to the authenticated user — the model can
never see or touch another user's data. No tool mutates the database.

If anything goes wrong (no key, network error, bad response) the caller falls
back to the rule-based concierge, so the API never fails because of the LLM.
"""
import json
from typing import List, Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User
from app.models.offer import Offer
from app.models.employee_profile import EmployeeProfile
from app.schemas.ai import ConciergeResponse
from app.services.ai_service import get_recommendations

MAX_TOOL_ROUNDS = 5

SYSTEM_PROMPT = (
    "You are Perka's AI benefits concierge for employees in Albania. "
    "Your job is to understand how the employee is feeling or what they want, then recommend the best matching benefit offers from the Perka catalogue — always using real data from the tools, never invented offers or prices. "
    "Tone: warm, direct, and personal — like a knowledgeable friend who happens to know every perk in the city. No corporate speak. "
    "Always: (1) call get_wallet_balance first to know their remaining budget, (2) search_offers or get_recommendations to find real options, (3) build_package when proposing 2+ offers together. "
    "Replies should be 2-4 sentences max. Lead with empathy, then concrete suggestions with real offer names and prices. "
    "End with one specific next action: 'Want me to submit this as a request?' or 'Shall I add this to your wallet?' "
    "Currency is ALL (Albanian Lek). Providers are real businesses in Tirana and Albania."
)

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_offers",
            "description": "Search active benefit offers available to the employee.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {
                        "type": "string",
                        "description": "Offer category, e.g. wellness, fitness, food, travel, learning, health",
                    },
                    "max_price": {"type": "number", "description": "Maximum price in ALL"},
                    "query": {"type": "string", "description": "Free-text keyword to match in the title/description"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_wallet_balance",
            "description": "Get the employee's benefit budget: remaining, used, pending and monthly total.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_recommendations",
            "description": "Get personalized offers based on the employee's interests and budget.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "build_package",
            "description": "Combine specific offers into a package suggestion and total their price. "
                           "Pass offer_ids returned from search_offers or get_recommendations.",
            "parameters": {
                "type": "object",
                "properties": {
                    "offer_ids": {"type": "array", "items": {"type": "integer"}},
                    "title": {"type": "string", "description": "A short, catchy package name"},
                },
                "required": ["offer_ids"],
            },
        },
    },
]


class _ConciergeTools:
    """Executes tool calls against the DB, scoped to one employee."""

    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user
        self.profile = (
            db.query(EmployeeProfile).filter(EmployeeProfile.user_id == user.id).first()
        )
        # Side-channel state we surface back through ConciergeResponse.
        self.seen_categories: list[str] = []
        self.package_title: Optional[str] = None

    def search_offers(self, category=None, max_price=None, query=None) -> dict:
        q = self.db.query(Offer).filter(Offer.status == "active")
        if category:
            q = q.filter(Offer.category == category)
            self.seen_categories.append(category)
        if max_price is not None:
            q = q.filter(Offer.price <= max_price)
        if query:
            like = f"%{query}%"
            q = q.filter(Offer.title.ilike(like) | Offer.description.ilike(like))
        offers = q.order_by(Offer.price.asc()).limit(8).all()
        return {"offers": [self._offer_dict(o) for o in offers]}

    def get_wallet_balance(self) -> dict:
        if not self.profile:
            return {"error": "No wallet for this user"}
        return {
            "remaining": float(self.profile.remaining_amount),
            "used": float(self.profile.used_amount),
            "pending": float(self.profile.pending_amount),
            "monthly_budget": float(self.profile.monthly_budget),
            "currency": self.user.currency or "ALL",
        }

    def get_recommendations(self) -> dict:
        recs = get_recommendations(self.db, self.user.id).recommendations
        for r in recs:
            self.seen_categories.append(r.category)
        return {"recommendations": [r.model_dump() for r in recs]}

    def build_package(self, offer_ids: List[int], title: Optional[str] = None) -> dict:
        offers = self.db.query(Offer).filter(Offer.id.in_(offer_ids or [])).all()
        if not offers:
            return {"error": "No matching offers"}
        total = sum(float(o.price) for o in offers)
        self.package_title = title or "Your Perka Package"
        for o in offers:
            self.seen_categories.append(o.category)
        return {
            "title": self.package_title,
            "total_price": total,
            "currency": offers[0].currency,
            "items": [self._offer_dict(o) for o in offers],
        }

    @staticmethod
    def _offer_dict(o: Offer) -> dict:
        return {
            "offer_id": o.id,
            "title": o.title,
            "category": o.category,
            "price": float(o.price),
            "currency": o.currency,
        }

    def dispatch(self, name: str, arguments: dict) -> dict:
        handler = getattr(self, name, None)
        if handler is None:
            return {"error": f"Unknown tool: {name}"}
        try:
            return handler(**arguments)
        except TypeError as exc:
            return {"error": f"Bad arguments for {name}: {exc}"}


def run_concierge(db: Session, user: User, message: str, budget: Optional[float]) -> ConciergeResponse:
    """Run the OpenAI tool-calling loop. Raises on any failure (caller falls back)."""
    from openai import OpenAI

    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    tools = _ConciergeTools(db, user)

    user_content = message
    if budget is not None:
        user_content += f"\n\n(My remaining budget is about {budget:,.0f} ALL.)"

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]

    final_text = ""
    for _ in range(MAX_TOOL_ROUNDS):
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
        )
        choice = response.choices[0].message
        messages.append(choice)

        if not choice.tool_calls:
            final_text = choice.content or ""
            break

        for call in choice.tool_calls:
            try:
                args = json.loads(call.function.arguments or "{}")
            except json.JSONDecodeError:
                args = {}
            result = tools.dispatch(call.function.name, args)
            messages.append({
                "role": "tool",
                "tool_call_id": call.id,
                "content": json.dumps(result),
            })
    else:
        # Ran out of rounds — ask for a plain answer with no more tools.
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL, messages=messages,
        )
        final_text = response.choices[0].message.content or ""

    categories = list(dict.fromkeys(tools.seen_categories))[:3]
    return ConciergeResponse(
        reply=final_text or "Here are some benefit ideas for you.",
        suggested_categories=categories,
        suggested_package_title=tools.package_title,
    )
