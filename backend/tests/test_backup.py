from tests.conftest import auth_headers


def test_backup_requires_auth(client):
    assert client.get("/backup").status_code == 401


def test_backup_exports_json(client, token):
    response = client.get("/backup", headers=auth_headers(token))
    assert response.status_code == 200
    assert response.headers["content-disposition"].endswith('filename="wedding.json"')
    body = response.json()
    assert body["wedding"]["groom"] == "Dinesh"
    assert body["expenses"] == []
