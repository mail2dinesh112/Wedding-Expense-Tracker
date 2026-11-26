from tests.conftest import auth_headers


def test_wedding_read_and_update_budget(client, token):
    current = client.get("/wedding", headers=auth_headers(token))
    assert current.status_code == 200
    assert current.json()["total_budget"] == 100000.0

    updated = client.put(
        "/wedding",
        json={"total_budget": 150000},
        headers=auth_headers(token),
    )
    assert updated.status_code == 200
    assert updated.json()["total_budget"] == 150000.0

    invalid = client.put(
        "/wedding",
        json={"total_budget": -1},
        headers=auth_headers(token),
    )
    assert invalid.status_code == 422
