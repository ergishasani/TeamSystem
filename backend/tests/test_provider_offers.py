"""Provider offer creation (validated) and editing."""


def test_create_offer_validates_price(client, provider_admin, auth):
    res = client.post("/api/v1/provider/offers", headers=auth(provider_admin.email),
                      json={"title": "Bad", "category": "food", "price": -5})
    assert res.status_code == 422


def test_create_and_update_offer(client, provider_admin, auth):
    headers = auth(provider_admin.email)
    created = client.post("/api/v1/provider/offers", headers=headers, json={
        "title": "Yoga Pass", "category": "wellness", "price": 2000,
    })
    assert created.status_code == 201, created.text
    offer_id = created.json()["id"]

    updated = client.patch(f"/api/v1/provider/offers/{offer_id}", headers=headers,
                           json={"price": 2500, "status": "inactive"})
    assert updated.status_code == 200, updated.text
    assert updated.json()["price"] == 2500.0
    assert updated.json()["status"] == "inactive"
    assert updated.json()["title"] == "Yoga Pass"  # untouched


def test_update_missing_offer(client, provider_admin, auth):
    res = client.patch("/api/v1/provider/offers/9999", headers=auth(provider_admin.email),
                       json={"price": 100})
    assert res.status_code == 404


def test_cannot_edit_other_providers_offer(client, db, provider_admin, offer, auth):
    from app.models.provider import Provider
    from app.models.offer import Offer
    other = Provider(name="Rival", category="food", city="Tirana", country="AL", status="active")
    db.add(other)
    db.commit()
    rival_offer = Offer(provider_id=other.id, title="Burger", category="food",
                        price=900, currency="ALL", city="Tirana", country="AL", status="active")
    db.add(rival_offer)
    db.commit()

    res = client.patch(f"/api/v1/provider/offers/{rival_offer.id}",
                       headers=auth(provider_admin.email), json={"price": 1})
    assert res.status_code == 404
