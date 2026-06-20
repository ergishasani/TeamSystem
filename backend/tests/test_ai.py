from app.services.ai_service import rule_based_concierge


def test_concierge_relax_suggests_wellness_and_food():
    res = rule_based_concierge("I need to relax after a long week", interests=[], budget=10000)
    assert "wellness" in res.suggested_categories
    assert "food" in res.suggested_categories
    assert res.suggested_package_title == "After Work Reset"


def test_concierge_weekend_suggests_travel():
    res = rule_based_concierge("plan me a weekend trip", interests=[], budget=None)
    assert "travel" in res.suggested_categories
    # "weekend" maps to travel+food, "trip" maps to travel → categories=["travel","food"] → "Weekend Escape"
    assert res.suggested_package_title == "Weekend Escape"


def test_concierge_learning_suggests_learning():
    res = rule_based_concierge("I want to learn a new skill", interests=[], budget=None)
    assert "learning" in res.suggested_categories
    assert res.suggested_package_title == "Skill Boost Bundle"


def test_concierge_endpoint(client, employee, auth):
    res = client.post("/api/v1/ai/concierge", headers=auth(employee.email),
                      json={"message": "I want to relax"})
    assert res.status_code == 200, res.text
    body = res.json()
    assert "reply" in body
    assert isinstance(body["suggested_categories"], list)


def test_recommendations_endpoint(client, employee, offer, auth):
    res = client.get("/api/v1/ai/recommendations/me", headers=auth(employee.email))
    assert res.status_code == 200, res.text
    recs = res.json()["recommendations"]
    # employee interests include "wellness"; the seeded offer is wellness within budget
    assert any(r["category"] == "wellness" for r in recs)
