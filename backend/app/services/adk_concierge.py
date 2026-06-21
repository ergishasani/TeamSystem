"""
Google ADK (Agent Development Kit) benefits concierge, powered by Gemini.

This is the preferred AI engine. An `LlmAgent` is given a set of read-only tools
(search offers, check wallet, get recommendations, build a package) and decides
which to call to answer the employee. Every tool is scoped to the authenticated
user via closures over the request's DB session — the model can never see or
touch another user's data, and no tool mutates the database.

If anything goes wrong (no key, network error, bad response) the caller falls
back to the OpenAI or rule-based concierge, so the API never fails because of the
LLM. Enable by setting GOOGLE_API_KEY (from https://aistudio.google.com).
"""
import asyncio
import os
from typing import List, Optional

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User
from app.models.offer import Offer
from app.models.employee_profile import EmployeeProfile
from app.schemas.ai import ConciergeResponse
from app.services.ai_service import get_recommendations as _rule_recommendations

APP_NAME = "perka_concierge"
MAX_OFFERS = 8

INSTRUCTION = (
    "You are Perka's AI benefits concierge for employees in Albania. "
    "Your job is to understand how the employee is feeling or what they want, then recommend the best matching benefit offers from the Perka catalogue — always using real data from the tools, never invented offers or prices. "
    "Tone: warm, direct, and personal — like a knowledgeable friend who happens to know every perk in the city. No corporate speak. "
    "Workflow: (1) call get_wallet_balance first to know their remaining budget, (2) use search_offers or recommend_offers to find real options, (3) call build_package when proposing 2+ offers together. "
    "Replies should be 2-4 sentences max. Lead with empathy, then concrete suggestions with real offer names and prices. "
    "End with one specific next action, e.g. 'Want me to submit this as a request?' "
    "Currency is ALL (Albanian Lek). Providers are real businesses in Tirana and Albania."
)


def _configure_genai_env() -> None:
    """ADK's Gemini client reads credentials from the environment."""
    if settings.GOOGLE_API_KEY:
        os.environ.setdefault("GOOGLE_API_KEY", settings.GOOGLE_API_KEY)
        os.environ.setdefault("GEMINI_API_KEY", settings.GOOGLE_API_KEY)
    # Use Google AI Studio (API key), not Vertex AI.
    os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "FALSE")


def _offer_dict(o: Offer) -> dict:
    return {
        "offer_id": o.id,
        "title": o.title,
        "category": o.category,
        "price": float(o.price),
        "currency": o.currency,
    }


def _build_tools(db: Session, user: User, state: dict) -> list:
    """Create user-scoped tool callables. ADK introspects their type hints and
    docstrings to expose them to Gemini, so keep signatures explicit."""
    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == user.id).first()

    def search_offers(category: str = "", max_price: float = 0.0, query: str = "") -> dict:
        """Search active Perka benefit offers available to the employee.

        Args:
            category: Offer category to filter by, e.g. wellness, fitness, food, travel, learning, health. Empty for any.
            max_price: Maximum price in ALL. 0 means no limit.
            query: Free-text keyword matched in the offer title or description. Empty for none.
        """
        q = db.query(Offer).filter(Offer.status == "active")
        if category:
            q = q.filter(Offer.category == category)
            state["categories"].append(category)
        if max_price and max_price > 0:
            q = q.filter(Offer.price <= max_price)
        if query:
            like = f"%{query}%"
            q = q.filter(Offer.title.ilike(like) | Offer.description.ilike(like))
        offers = q.order_by(Offer.price.asc()).limit(MAX_OFFERS).all()
        return {"offers": [_offer_dict(o) for o in offers]}

    def get_wallet_balance() -> dict:
        """Get the employee's benefit budget: remaining, used, pending and monthly total in ALL."""
        if not profile:
            return {"error": "No wallet for this user"}
        return {
            "remaining": float(profile.remaining_amount),
            "used": float(profile.used_amount),
            "pending": float(profile.pending_amount),
            "monthly_budget": float(profile.monthly_budget),
            "currency": user.currency or "ALL",
        }

    def recommend_offers() -> dict:
        """Get personalized offers based on the employee's saved interests and budget."""
        recs = _rule_recommendations(db, user.id).recommendations
        for r in recs:
            state["categories"].append(r.category)
        return {"recommendations": [r.model_dump() for r in recs]}

    def build_package(offer_ids: List[int], title: str = "") -> dict:
        """Combine specific offers into a package suggestion and total their price.

        Args:
            offer_ids: Offer ids returned from search_offers or recommend_offers.
            title: A short, catchy package name. Empty to auto-name.
        """
        offers = db.query(Offer).filter(Offer.id.in_(offer_ids or [])).all()
        if not offers:
            return {"error": "No matching offers"}
        total = sum(float(o.price) for o in offers)
        state["package_title"] = title or "Your Perka Package"
        for o in offers:
            state["categories"].append(o.category)
        return {
            "title": state["package_title"],
            "total_price": total,
            "currency": offers[0].currency,
            "items": [_offer_dict(o) for o in offers],
        }

    return [search_offers, get_wallet_balance, recommend_offers, build_package]


async def _run_agent(agent, session_service, user_id: str, content) -> str:
    from google.adk.runners import Runner

    session = await session_service.create_session(app_name=APP_NAME, user_id=user_id)
    runner = Runner(app_name=APP_NAME, agent=agent, session_service=session_service)
    final_text = ""
    async for event in runner.run_async(
        user_id=user_id, session_id=session.id, new_message=content
    ):
        if event.is_final_response() and event.content and event.content.parts:
            final_text = "".join(p.text or "" for p in event.content.parts if getattr(p, "text", None))
    return final_text


def run_adk_concierge(db: Session, user: User, message: str, budget: Optional[float]) -> ConciergeResponse:
    """Run the Google ADK agent. Raises on any failure (the caller falls back)."""
    from google.adk.agents import LlmAgent
    from google.adk.sessions import InMemorySessionService
    from google.genai import types

    _configure_genai_env()

    state = {"categories": [], "package_title": None}
    tools = _build_tools(db, user, state)

    agent = LlmAgent(
        model=settings.GEMINI_MODEL,
        name=APP_NAME,
        description="Perka employee benefits concierge.",
        instruction=INSTRUCTION,
        tools=tools,
    )

    user_content = message
    if budget is not None:
        user_content += f"\n\n(My remaining budget is about {budget:,.0f} ALL.)"
    content = types.Content(role="user", parts=[types.Part.from_text(text=user_content)])

    session_service = InMemorySessionService()
    # FastAPI runs sync endpoints in a worker thread with no active event loop,
    # so a fresh asyncio loop here is safe.
    final_text = asyncio.run(_run_agent(agent, session_service, str(user.id), content))

    categories = list(dict.fromkeys(state["categories"]))[:3]
    return ConciergeResponse(
        reply=final_text or "Here are some benefit ideas for you.",
        suggested_categories=categories,
        suggested_package_title=state["package_title"],
    )
