from tests.conftest import auth_headers


def test_health_is_public(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_login_success_and_failure(client):
    bad = client.post("/auth/login", json={"password": "wrong"})
    assert bad.status_code == 401
    assert bad.json()["error"]["code"] == "unauthorized"

    good = client.post("/auth/login", json={"password": "admin"})
    assert good.status_code == 200
    body = good.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_protected_endpoints_require_token(client):
    assert client.get("/wedding").status_code == 401
    assert client.get("/expenses").status_code == 401
    assert client.get("/expenses", headers=auth_headers("bad.token")).status_code == 401
