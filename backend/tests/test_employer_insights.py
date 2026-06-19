"""Employer insights aggregate real benefit activity for the company."""


def test_insights_require_employer(client, employee, auth):
    res = client.post("/api/v1/ai/employer-insights", headers=auth(employee.email), json={})
    assert res.status_code == 403


def test_insights_empty_company(client, employer, auth):
    res = client.post("/api/v1/ai/employer-insights", headers=auth(employer.email), json={})
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["total_requests"] == 0
    assert body["approval_rate"] == 0
    assert body["top_categories"] == []


def test_insights_reflect_approved_spend(client, employee, employer, offer, auth):
    emp_headers = auth(employee.email)
    boss_headers = auth(employer.email)

    request_id = client.post("/api/v1/benefit-requests", headers=emp_headers,
                             json={"offer_id": offer.id, "request_type": "single_offer"}).json()["id"]
    client.post(f"/api/v1/employer/approvals/{request_id}/approve", headers=boss_headers)

    body = client.post("/api/v1/ai/employer-insights", headers=boss_headers, json={}).json()
    assert body["total_requests"] == 1
    assert body["approval_rate"] == 1.0
    assert body["approved_total"] == 3500.0
    assert body["avg_spend"] == 3500.0
    assert body["top_categories"] == ["wellness"]
    assert body["category_spend"][0] == {"category": "wellness", "total": 3500.0}
