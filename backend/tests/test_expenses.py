from tests.conftest import auth_headers

PAYLOAD = {"date": "2026-11-22", "name": "shared cab", "side": "both", "amount": 1000}


def test_expense_crud_and_filters(client, token):
    created = client.post("/expenses", json=PAYLOAD, headers=auth_headers(token))
    assert created.status_code == 201
    assert created.json()["name"] == "SHARED CAB"
    expense_id = created.json()["id"]

    listed = client.get("/expenses", headers=auth_headers(token))
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    groom = client.get("/expenses?side=groom", headers=auth_headers(token))
    assert [item["id"] for item in groom.json()] == [expense_id]

    updated = client.put(
        f"/expenses/{expense_id}",
        json={**PAYLOAD, "name": "cab", "amount": 1200, "side": "groom"},
        headers=auth_headers(token),
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "CAB"
    assert updated.json()["amount"] == 1200

    deleted = client.delete(f"/expenses/{expense_id}", headers=auth_headers(token))
    assert deleted.status_code == 204
    assert client.get("/expenses", headers=auth_headers(token)).json() == []


def test_expense_not_found(client, token):
    response = client.delete("/expenses/EXP999", headers=auth_headers(token))
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_invalid_expense_payload(client, token):
    invalid = client.post(
        "/expenses",
        json={**PAYLOAD, "amount": -5},
        headers=auth_headers(token),
    )
    assert invalid.status_code == 422
    assert invalid.json()["error"]["code"] == "validation_error"

    bad_side = client.post(
        "/expenses",
        json={**PAYLOAD, "side": "alien"},
        headers=auth_headers(token),
    )
    assert bad_side.status_code == 422


def test_invalid_date_range(client, token):
    response = client.get(
        "/expenses?from_date=2026-11-22&to_date=2026-11-01",
        headers=auth_headers(token),
    )
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "bad_request"
