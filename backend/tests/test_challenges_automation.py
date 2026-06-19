"""Confirming a redemption advances matching challenge progress and awards XP."""
from datetime import datetime, timezone, timedelta

from app.models.challenge import Challenge, ChallengeProgress
from app.models.employee_profile import EmployeeProfile


def _approved_redemption_id(client, employee, employer, offer, auth):
    emp_headers = auth(employee.email)
    request_id = client.post("/api/v1/benefit-requests", headers=emp_headers,
                             json={"offer_id": offer.id, "request_type": "single_offer"}).json()["id"]
    client.post(f"/api/v1/employer/approvals/{request_id}/approve", headers=auth(employer.email))
    return client.get("/api/v1/redemptions/me", headers=emp_headers).json()[0]["id"], emp_headers


def test_redemption_advances_matching_challenge(client, db, employee, employer, provider_admin, offer, auth):
    challenge = Challenge(title="Wellness Week", type="category", category="wellness",
                          goal=1, reward=50,
                          starts_at=datetime.now(timezone.utc) - timedelta(days=1),
                          ends_at=datetime.now(timezone.utc) + timedelta(days=10))
    db.add(challenge)
    db.commit()
    db.refresh(challenge)

    redemption_id, emp_headers = _approved_redemption_id(client, employee, employer, offer, auth)

    res = client.post(f"/api/v1/provider/redemptions/{redemption_id}/confirm",
                      headers=auth(provider_admin.email))
    assert res.status_code == 200, res.text

    progress = client.get("/api/v1/challenges/me/progress", headers=emp_headers).json()
    assert len(progress) == 1
    assert float(progress[0]["progress"]) == 1.0
    assert progress[0]["completed"] is True

    profile = db.query(EmployeeProfile).filter(EmployeeProfile.user_id == employee.id).first()
    db.refresh(profile)
    assert profile.xp == 200  # 150 seeded + 50 reward


def test_redemption_skips_non_matching_category(client, db, employee, employer, provider_admin, offer, auth):
    db.add(Challenge(title="Foodie", type="category", category="food", goal=2, reward=50))
    db.commit()

    redemption_id, emp_headers = _approved_redemption_id(client, employee, employer, offer, auth)
    client.post(f"/api/v1/provider/redemptions/{redemption_id}/confirm",
                headers=auth(provider_admin.email))

    # Wellness redemption must not touch a food-only challenge.
    progress = client.get("/api/v1/challenges/me/progress", headers=emp_headers).json()
    assert progress == []
