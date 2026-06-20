"""
AI concierge service.

`concierge()` uses the OpenAI tool-calling engine when OPENAI_API_KEY is set,
and transparently falls back to the rule-based engine otherwise (or on any LLM
error). The rule-based functions are kept as that fallback and for offline use.
"""
import logging
from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User
from app.models.offer import Offer
from app.models.employee_profile import EmployeeProfile
from app.schemas.ai import ConciergeResponse, RecommendedOffer, RecommendationsResponse

logger = logging.getLogger(__name__)


KEYWORD_MAP = {
    # Burnout / stress / recovery
    "burnt out": ["wellness", "health"],
    "burn out": ["wellness", "health"],
    "burnout": ["wellness", "health"],
    "tired": ["wellness", "health"],
    "exhausted": ["wellness", "health"],
    "stress": ["wellness", "fitness"],
    "anxious": ["wellness", "health"],
    "overwhelmed": ["wellness", "health"],
    "recover": ["wellness", "health"],
    "relax": ["wellness", "food"],
    "rest": ["wellness"],
    "unwind": ["wellness"],
    "recharge": ["wellness", "fitness"],
    "massage": ["wellness"],
    "spa": ["wellness"],
    "mindful": ["wellness", "health"],
    "meditation": ["wellness"],
    # Fitness / active
    "fit": ["fitness"],
    "gym": ["fitness"],
    "workout": ["fitness"],
    "exercise": ["fitness"],
    "run": ["fitness"],
    "pilates": ["fitness"],
    "yoga": ["wellness", "fitness"],
    "active": ["fitness"],
    "sport": ["fitness"],
    "train": ["fitness"],
    "muscle": ["fitness"],
    # Food / social
    "food": ["food"],
    "eat": ["food"],
    "lunch": ["food"],
    "dinner": ["food"],
    "restaurant": ["food"],
    "hungry": ["food"],
    "brunch": ["food"],
    "coffee": ["food"],
    "chef": ["food"],
    "taste": ["food"],
    "team lunch": ["food"],
    # Travel / weekend
    "travel": ["travel"],
    "trip": ["travel"],
    "weekend": ["travel", "food"],
    "escape": ["travel"],
    "adventure": ["travel"],
    "explore": ["travel"],
    "hike": ["travel", "fitness"],
    "mountains": ["travel"],
    "getaway": ["travel"],
    # Learning / growth
    "learn": ["learning"],
    "skill": ["learning"],
    "course": ["learning"],
    "workshop": ["learning"],
    "book": ["learning"],
    "read": ["learning"],
    "study": ["learning"],
    "grow": ["learning"],
    "career": ["learning"],
    "develop": ["learning"],
    # Health
    "health": ["health", "wellness"],
    "dental": ["health"],
    "medical": ["health"],
    "doctor": ["health"],
    "checkup": ["health"],
    "sleep": ["wellness", "health"],
}

STYLE_NAMES = {
    "wellness": "Wellness Seeker",
    "fitness": "Active Achiever",
    "food": "Foodie",
    "travel": "Explorer",
    "learning": "Lifelong Learner",
    "health": "Health Champion",
}


def _detect_categories(message: str) -> List[str]:
    message_lower = message.lower()
    matched = []
    for keyword, cats in KEYWORD_MAP.items():
        if keyword in message_lower:
            matched.extend(cats)
    return list(dict.fromkeys(matched)) or ["wellness", "food"]


GREETING_RESPONSES: list[tuple[list[str], str]] = [
    (["hi", "hello", "hey", "hej", "salut", "alo"],
     "Hey! Great to have you here. I'm your Perka benefits concierge — I can help you find wellness offers, plan a weekend, book a meal, or build a personalised package from your monthly budget.\n\nWhat's on your mind today?"),
    (["how are you", "how r u", "what's up", "whats up", "sup"],
     "I'm always on and ready to help! More importantly — how are *you* doing? Tell me how you're feeling and I'll find the right perk to match."),
    (["thanks", "thank you", "thx", "ty", "cheers", "faleminderit"],
     "Happy to help! If you ever want to explore more options or submit a request, just say the word. I'm here whenever you need me."),
    (["yes", "sure", "ok", "okay", "sounds good", "great", "perfect", "let's do it", "do it"],
     "Let's go! To get started, tell me a bit more — what category interests you most right now? Wellness, fitness, food, travel, or something else?"),
    (["no", "nope", "not really", "nah"],
     "No worries at all! Just come back whenever you're ready. I'm here to help you make the most of your Perka benefits whenever you need it."),
    (["help", "what can you do", "what do you do", "how does this work", "explain"],
     "I'm your AI benefits concierge, powered by Perka. Here's what I can do:\n\n• Find the best offers matching how you feel\n• Build curated packages within your budget\n• Recommend wellness, fitness, food, travel & learning perks\n• Help you submit a benefit request\n\nJust tell me how you're feeling or what you're looking for — I'll take care of the rest."),
    (["bored", "boring"],
     "Boredom is a sign you need something new! Try a cooking class, a day trip to the coast, or a skill workshop — all available through your Perka wallet. Which direction sounds most interesting?"),
    (["budget", "how much", "how many all", "wallet", "balance", "remaining"],
     "Great question! Your remaining monthly budget is shown on the Wallet tab. I always factor it in when suggesting offers — so you'll never see something you can't afford. Want me to suggest options that fit your current balance?"),
    (["who are you", "what are you", "are you ai", "are you a bot", "are you human"],
     "I'm Perka's AI concierge — trained to help you get the most out of your employee benefits. I know the full catalogue of offers, your budget, and your preferences. Think of me as a knowledgeable friend who always knows the best perk for the moment."),
]


def _check_greeting(message: str) -> Optional[str]:
    msg = message.lower().strip().rstrip("!?.").strip()
    for triggers, response in GREETING_RESPONSES:
        if any(t in msg for t in triggers):
            return response
    return None


RESPONSE_TEMPLATES: dict[str, str] = {
    "burnt out":   "Sounds like you need a proper reset. I'd start with a deep-tissue massage or a guided meditation session — both are available in Tirana and fit comfortably within a typical monthly budget. Pair it with a quiet dinner for two and you've got a full recovery evening.",
    "burn out":    "Sounds like you need a proper reset. I'd start with a deep-tissue massage or a guided meditation session — both are available in Tirana and fit comfortably within a typical monthly budget. Pair it with a quiet dinner for two and you've got a full recovery evening.",
    "stress":      "When stress builds up, the fastest fix is movement plus stillness — a fitness class to burn off tension, followed by something calming like a spa treatment or a nourishing meal. I'll look for a package that stacks these together.",
    "tired":       "Rest and recovery are real benefits — not luxuries. A wellness session or a nutritious meal out can do a lot. Let me find you something that actually recharges you rather than just keeping you going.",
    "fit":         "Let's find you something that actually challenges you. Pilates, boxing, a climbing session — Tirana has solid fitness providers. Want a single session to try, or a monthly plan bundled into your benefits?",
    "weekend":     "Perfect timing for a proper break. I'm thinking a short day-trip, a long brunch at one of the top spots, or even a cooking class if you want something different. What sounds most like you right now?",
    "food":        "Tirana's food scene is genuinely good right now. I can find you a chef's tasting, a team lunch spot, or a casual favourite — all payable through your benefits wallet. Any preference on neighbourhood or cuisine?",
    "travel":      "A weekend outside the city does wonders. I can suggest curated day-trips or overnight packages in the Valbona Valley, Ksamil, or the Riviera — all available as benefit offers. How many days are you thinking?",
    "learn":       "Investing a perk in a skill pays back tenfold. Whether it's a language, a design tool, or a business course — I can find structured workshops or online programmes that fit your budget. What area do you want to grow in?",
    "skill":       "Investing a perk in a skill pays back tenfold. Whether it's a language, a design tool, or a business course — I can find structured workshops or online programmes that fit your budget. What area do you want to grow in?",
    "health":      "Preventive care is one of the smartest things you can spend benefits on. I can find you a full check-up, a dental clean, or a specialist consultation — often at a significant discount through Perka providers.",
    "dental":      "A dental check-up is worth it before problems start. Perka has partnered clinics in Tirana with priority booking for benefit members. Want me to find the closest one to your office?",
    "gym":         "A good gym membership can be fully covered by your monthly benefits. I know a few options in Tirana that offer group classes included. Do you prefer morning slots or evening?",
    "yoga":        "Yoga is a fantastic all-rounder — stress, strength, and flexibility in one. There are great studios in Tirana available through your benefits. Want a trial class first or a monthly pass?",
}

PACKAGE_MAP: dict[tuple, tuple] = {
    ("wellness", "food"):     ("After Work Reset", "Combines a relaxing treatment with a top-rated dinner — the perfect way to end a hard week."),
    ("wellness", "fitness"):  ("Reset & Recover", "A workout to release tension followed by recovery treatment — built for high performers."),
    ("fitness", "food"):      ("Active & Fuelled", "Push your limits in the gym, then refuel at one of Tirana's best restaurants."),
    ("travel", "food"):       ("Weekend Escape", "A curated day-trip plus a memorable meal — exactly what a proper weekend should feel like."),
    ("learning", "health"):   ("Growth & Wellness", "Develop a new skill while keeping your health in check — the sustainable way to grow."),
    ("wellness",):            ("Wellness Reset", "Dedicated recovery time — because rest is part of performance."),
    ("fitness",):             ("Active Month", "Push your limits with the best fitness options in Tirana."),
    ("food",):                ("Culinary Discovery", "Explore Tirana's best restaurants and food experiences."),
    ("travel",):              ("Weekend Explorer", "Curated day-trips and getaways within reach of Tirana."),
    ("learning",):            ("Skill Boost Bundle", "Level up with workshops and courses that fit your goals."),
}


def _best_package(cats: List[str]) -> tuple[Optional[str], Optional[str]]:
    for pair in [(cats[0], cats[1]) if len(cats) >= 2 else ()]:
        if pair in PACKAGE_MAP:
            return PACKAGE_MAP[pair]
    for cat in cats:
        if (cat,) in PACKAGE_MAP:
            return PACKAGE_MAP[(cat,)]
    return None, None


def rule_based_concierge(message: str, interests: List[str], budget: Optional[float]) -> ConciergeResponse:
    msg_lower = message.lower()

    # 1. Greetings and conversational messages — no categories needed
    greeting_reply = _check_greeting(message)
    if greeting_reply:
        return ConciergeResponse(
            reply=greeting_reply,
            suggested_categories=[],
            suggested_package_title=None,
        )

    categories = _detect_categories(message)
    all_cats = list(dict.fromkeys(categories + interests))[:3]

    # 2. Pick the best matching reply template
    reply = None
    for trigger, template in RESPONSE_TEMPLATES.items():
        if trigger in msg_lower:
            reply = template
            break

    # 3. Generic fallback — still helpful, not robotic
    if not reply:
        cat_labels = " and ".join(all_cats[:2]) if all_cats else "wellness and food"
        budget_note = f" Your {budget:,.0f} ALL budget gives you plenty of options to work with." if budget and budget > 0 else ""
        reply = (
            f"Interesting — I'm picking up {cat_labels} vibes from that.{budget_note} "
            f"Let me find you the best matching offers in Tirana right now. "
            f"Do you want a single experience or should I put together a full package for you?"
        )

    # 4. Append budget awareness when relevant
    if budget is not None and budget < 3000:
        reply += f"\n\nHeads up: you have {budget:,.0f} ALL left this month — I'll keep suggestions in that range."
    elif budget is not None and budget > 10000:
        reply += f"\n\nYou've got {budget:,.0f} ALL available this month — plenty of room for a solid package."

    package_title, _ = _best_package(all_cats)

    return ConciergeResponse(
        reply=reply,
        suggested_categories=all_cats,
        suggested_package_title=package_title,
    )


def concierge(db: Session, user: User, message: str, budget: Optional[float]) -> ConciergeResponse:
    """Primary entry point. Uses OpenAI when configured, else rule-based."""
    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == user.id).first()
    interests = profile.interests if profile and profile.interests else []

    if settings.OPENAI_API_KEY:
        try:
            # Imported lazily so the app (and tests) run without the openai package.
            from app.services.llm_concierge import run_concierge
            return run_concierge(db, user, message, budget)
        except Exception:  # noqa: BLE001 — never let the AI break the endpoint
            logger.exception("OpenAI concierge failed; falling back to rule-based")

    return rule_based_concierge(message, interests, budget)


def get_recommendations(db: Session, user_id: int) -> RecommendationsResponse:
    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == user_id).first()
    interests = profile.interests if profile and profile.interests else ["wellness", "food"]
    budget = float(profile.remaining_amount) if profile else 15000

    offers = (
        db.query(Offer)
        .filter(Offer.status == "active", Offer.category.in_(interests), Offer.price <= budget)
        .order_by(Offer.created_at.desc())
        .limit(6)
        .all()
    )

    result = []
    for offer in offers:
        style = STYLE_NAMES.get(offer.category, "great match")
        reason = f"Matches your {offer.category} interest and fits your budget."
        result.append(
            RecommendedOffer(
                offer_id=offer.id,
                title=offer.title,
                category=offer.category,
                price=float(offer.price),
                currency=offer.currency,
                reason=reason,
            )
        )

    return RecommendationsResponse(recommendations=result)
