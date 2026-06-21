def test_list_offers(client, employee, offer, auth):
    res = client.get("/api/v1/offers", headers=auth(employee.email))
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["total"] == 1
    assert body["items"][0]["title"] == "Spa Access Pass"


def test_filter_offers_by_category(client, employee, offer, auth):
    headers = auth(employee.email)
    assert client.get("/api/v1/offers", params={"category": "wellness"}, headers=headers).json()["total"] == 1
    assert client.get("/api/v1/offers", params={"category": "food"}, headers=headers).json()["total"] == 0


def test_filter_offers_by_max_price(client, employee, offer, auth):
    headers = auth(employee.email)
    assert client.get("/api/v1/offers", params={"max_price": 1000}, headers=headers).json()["total"] == 0
    assert client.get("/api/v1/offers", params={"max_price": 5000}, headers=headers).json()["total"] == 1


def test_get_offer_by_id(client, employee, offer, auth):
    res = client.get(f"/api/v1/offers/{offer.id}", headers=auth(employee.email))
    assert res.status_code == 200
    assert res.json()["id"] == offer.id


def test_get_missing_offer_404(client, employee, auth):
    res = client.get("/api/v1/offers/9999", headers=auth(employee.email))
    assert res.status_code == 404


def test_offers_require_auth(client, offer):
    assert client.get("/api/v1/offers").status_code == 401
