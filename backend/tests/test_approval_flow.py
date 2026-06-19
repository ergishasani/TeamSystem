"""
End-to-end test of the core demo flow:
employee submits a request → budget reserved → employer approves →
budget deducted + simulated payment + QR redemption created.
"""


def _submit_single_offer_request(client, headers, offer_id):
    return client.post("/api/v1/benefit-requests", headers=headers, json={
        "offer_id": offer_id,
        "request_type": "single_offer",
    })


def test_submit_reserves_pending_budget(client, employee, offer, auth):
    headers = auth(employee.email)

    res = _submit_single_offer_request(client, headers, offer.id)
    assert res.status_code == 201, res.text
    assert res.json()["status"] == "pending"
    assert res.json()["total_amount"] == 3500.0

    wallet = client.get("/api/v1/wallet/me", headers=headers).json()
    assert wallet["pending_amount"] == 3500.0
    assert wallet["remaining_amount"] == 11500.0


def test_submit_insufficient_budget_fails(client, employee, db, provider, auth):
    from app.models.offer import Offer
    pricey = Offer(provider_id=provider.id, title="Luxury Retreat", category="wellness",
                   price=99999, currency="ALL", city="Tirana", country="AL", status="active")
    db.add(pricey)
    db.commit()

    res = _submit_single_offer_request(client, auth(employee.email), pricey.id)
    assert res.status_code == 400


def test_full_approval_creates_payment_and_redemption(client, employee, employer, offer, auth):
    emp_headers = auth(employee.email)
    boss_headers = auth(employer.email)

    request_id = _submit_single_offer_request(client, emp_headers, offer.id).json()["id"]

    # Employer sees it in the approval queue
    approvals = client.get("/api/v1/employer/approvals", headers=boss_headers).json()
    assert any(a["id"] == request_id for a in approvals)

    # Approve
    approved = client.post(f"/api/v1/employer/approvals/{request_id}/approve", headers=boss_headers)
    assert approved.status_code == 200, approved.text
    assert approved.json()["status"] == "approved"

    # Budget moved from pending → used
    wallet = client.get("/api/v1/wallet/me", headers=emp_headers).json()
    assert wallet["used_amount"] == 3500.0
    assert wallet["pending_amount"] == 0.0
    assert wallet["remaining_amount"] == 11500.0

    # A simulated payment exists
    payments = client.get("/api/v1/employer/payments", headers=boss_headers).json()
    assert len(payments) == 1
    assert payments[0]["status"] == "simulated_paid"
    assert payments[0]["amount"] == 3500.0

    # A redemption with a QR code exists for the employee
    redemptions = client.get("/api/v1/redemptions/me", headers=emp_headers).json()
    assert len(redemptions) == 1
    assert redemptions[0]["qr_code"].startswith("PERKA-")
    assert redemptions[0]["status"] == "active"


def test_reject_releases_pending_budget(client, employee, employer, offer, auth):
    emp_headers = auth(employee.email)
    boss_headers = auth(employer.email)

    request_id = _submit_single_offer_request(client, emp_headers, offer.id).json()["id"]

    res = client.post(f"/api/v1/employer/approvals/{request_id}/reject", headers=boss_headers,
                      json={"rejection_reason": "Over budget this month"})
    assert res.status_code == 200, res.text
    assert res.json()["status"] == "rejected"

    wallet = client.get("/api/v1/wallet/me", headers=emp_headers).json()
    assert wallet["pending_amount"] == 0.0
    assert wallet["remaining_amount"] == 15000.0


def test_cancel_pending_request(client, employee, offer, auth):
    headers = auth(employee.email)
    request_id = _submit_single_offer_request(client, headers, offer.id).json()["id"]

    res = client.patch(f"/api/v1/benefit-requests/{request_id}/cancel", headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "cancelled"

    wallet = client.get("/api/v1/wallet/me", headers=headers).json()
    assert wallet["remaining_amount"] == 15000.0


def test_employee_cannot_access_approvals(client, employee, auth):
    res = client.get("/api/v1/employer/approvals", headers=auth(employee.email))
    assert res.status_code == 403


def test_auto_approval_below_threshold(client, db, company, employee, offer, auth):
    # Company auto-approves anything at or below 10,000 ALL; the offer is 3,500.
    company.approval_required_above = 10000
    db.add(company)
    db.commit()

    headers = auth(employee.email)
    res = _submit_single_offer_request(client, headers, offer.id)
    assert res.status_code == 201, res.text
    # No employer step needed — it is approved immediately.
    assert res.json()["status"] == "approved"

    wallet = client.get("/api/v1/wallet/me", headers=headers).json()
    assert wallet["used_amount"] == 3500.0
    assert wallet["pending_amount"] == 0.0

    redemptions = client.get("/api/v1/redemptions/me", headers=headers).json()
    assert len(redemptions) == 1
    assert redemptions[0]["qr_code"].startswith("PERKA-")
