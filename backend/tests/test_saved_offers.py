"""Saved offers are now persisted in the saved_offers table (not in-memory)."""


def test_save_and_list_offer(client, employee, offer, auth):
    headers = auth(employee.email)

    assert client.post(f"/api/v1/offers/{offer.id}/save", headers=headers).status_code == 200

    saved = client.get("/api/v1/offers/users/me/saved-offers", headers=headers).json()
    assert len(saved) == 1
    assert saved[0]["id"] == offer.id


def test_save_is_idempotent(client, employee, offer, auth):
    headers = auth(employee.email)
    client.post(f"/api/v1/offers/{offer.id}/save", headers=headers)
    client.post(f"/api/v1/offers/{offer.id}/save", headers=headers)

    saved = client.get("/api/v1/offers/users/me/saved-offers", headers=headers).json()
    assert len(saved) == 1  # no duplicate row


def test_unsave_offer(client, employee, offer, auth):
    headers = auth(employee.email)
    client.post(f"/api/v1/offers/{offer.id}/save", headers=headers)

    assert client.delete(f"/api/v1/offers/{offer.id}/save", headers=headers).status_code == 200
    saved = client.get("/api/v1/offers/users/me/saved-offers", headers=headers).json()
    assert saved == []


def test_save_missing_offer_404(client, employee, auth):
    res = client.post("/api/v1/offers/9999/save", headers=auth(employee.email))
    assert res.status_code == 404
