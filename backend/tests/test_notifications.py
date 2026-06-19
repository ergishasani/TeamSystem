"""Approval and rejection create in-app notifications for the employee."""


def _submit(client, headers, offer_id):
    return client.post("/api/v1/benefit-requests", headers=headers,
                       json={"offer_id": offer_id, "request_type": "single_offer"}).json()["id"]


def test_no_notifications_initially(client, employee, auth):
    res = client.get("/api/v1/notifications/me", headers=auth(employee.email))
    assert res.status_code == 200
    assert res.json() == []


def test_approval_creates_notification(client, employee, employer, offer, auth):
    emp_headers = auth(employee.email)
    request_id = _submit(client, emp_headers, offer.id)
    client.post(f"/api/v1/employer/approvals/{request_id}/approve", headers=auth(employer.email))

    notifications = client.get("/api/v1/notifications/me", headers=emp_headers).json()
    assert len(notifications) == 1
    assert notifications[0]["type"] == "request_approved"
    assert notifications[0]["read"] is False


def test_rejection_creates_notification(client, employee, employer, offer, auth):
    emp_headers = auth(employee.email)
    request_id = _submit(client, emp_headers, offer.id)
    client.post(f"/api/v1/employer/approvals/{request_id}/reject", headers=auth(employer.email),
                json={"rejection_reason": "Budget"})

    notifications = client.get("/api/v1/notifications/me", headers=emp_headers).json()
    assert len(notifications) == 1
    assert notifications[0]["type"] == "request_rejected"
    assert "Budget" in notifications[0]["message"]


def test_mark_notification_read(client, employee, employer, offer, auth):
    emp_headers = auth(employee.email)
    request_id = _submit(client, emp_headers, offer.id)
    client.post(f"/api/v1/employer/approvals/{request_id}/approve", headers=auth(employer.email))

    note_id = client.get("/api/v1/notifications/me", headers=emp_headers).json()[0]["id"]
    res = client.patch(f"/api/v1/notifications/{note_id}/read", headers=emp_headers)
    assert res.status_code == 200
    assert res.json()["read"] is True
