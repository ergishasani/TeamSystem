from tests.conftest import PASSWORD


def test_register_returns_user(client, company):
    res = client.post("/api/v1/auth/register", json={
        "full_name": "New Hire",
        "email": "new@tiranatech.al",
        "password": "secret123",
        "role": "employee",
        "company_id": company.id,
    })
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["email"] == "new@tiranatech.al"
    assert body["role"] == "employee"
    assert "hashed_password" not in body


def test_register_duplicate_email_fails(client, employee):
    res = client.post("/api/v1/auth/register", json={
        "full_name": "Imposter",
        "email": employee.email,
        "password": "secret123",
    })
    assert res.status_code == 400


def test_login_success(client, employee):
    res = client.post("/api/v1/auth/login", json={"email": employee.email, "password": PASSWORD})
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_login_wrong_password_fails(client, employee):
    res = client.post("/api/v1/auth/login", json={"email": employee.email, "password": "wrong"})
    assert res.status_code == 401


def test_me_requires_token(client):
    assert client.get("/api/v1/auth/me").status_code == 403  # missing bearer credentials


def test_me_returns_current_user(client, employee, auth):
    res = client.get("/api/v1/auth/me", headers=auth(employee.email))
    assert res.status_code == 200
    assert res.json()["email"] == employee.email
