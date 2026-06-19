"""
Tests for the OpenAI concierge tool layer and the LLM/rule-based orchestration.
No real OpenAI calls are made — the tool dispatch is pure DB logic, and the
LLM path is monkeypatched.
"""
from app.services import ai_service
from app.services.ai_service import concierge
from app.services.llm_concierge import _ConciergeTools
from app.schemas.ai import ConciergeResponse


def test_tool_search_offers(db, employee, offer):
    tools = _ConciergeTools(db, employee)
    result = tools.search_offers(category="wellness")
    titles = [o["title"] for o in result["offers"]]
    assert "Spa Access Pass" in titles
    assert "wellness" in tools.seen_categories


def test_tool_search_offers_respects_max_price(db, employee, offer):
    tools = _ConciergeTools(db, employee)
    assert tools.search_offers(max_price=1000)["offers"] == []  # offer is 3500


def test_tool_wallet_balance(db, employee, offer):
    tools = _ConciergeTools(db, employee)
    wallet = tools.get_wallet_balance()
    assert wallet["remaining"] == 15000.0
    assert wallet["monthly_budget"] == 15000.0


def test_tool_build_package_totals_offers(db, employee, offer):
    tools = _ConciergeTools(db, employee)
    pkg = tools.build_package(offer_ids=[offer.id], title="Spa Day")
    assert pkg["title"] == "Spa Day"
    assert pkg["total_price"] == 3500.0
    assert tools.package_title == "Spa Day"


def test_concierge_uses_llm_when_key_set(db, employee, monkeypatch):
    monkeypatch.setattr(ai_service.settings, "OPENAI_API_KEY", "sk-test")
    sentinel = ConciergeResponse(reply="from the LLM", suggested_categories=["food"])
    monkeypatch.setattr("app.services.llm_concierge.run_concierge",
                        lambda *a, **k: sentinel)

    result = concierge(db, employee, "anything", budget=5000)
    assert result.reply == "from the LLM"


def test_concierge_falls_back_when_llm_errors(db, employee, monkeypatch):
    monkeypatch.setattr(ai_service.settings, "OPENAI_API_KEY", "sk-test")

    def boom(*a, **k):
        raise RuntimeError("OpenAI down")

    monkeypatch.setattr("app.services.llm_concierge.run_concierge", boom)

    result = concierge(db, employee, "I want to relax", budget=5000)
    # Rule-based fallback still answers.
    assert isinstance(result, ConciergeResponse)
    assert "wellness" in result.suggested_categories


def test_concierge_rule_based_without_key(db, employee):
    # No key configured in tests → rule-based path, blended with the
    # employee's seeded interests (wellness, food, travel).
    result = concierge(db, employee, "plan a weekend trip", budget=None)
    assert isinstance(result, ConciergeResponse)
    assert "travel" in result.suggested_categories
    assert result.reply
