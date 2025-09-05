import json

async def test_get_history_no_courseid(jp_fetch):
    # When
    response = await jp_fetch("nbexchange-jlab", "history", raise_error=False)

    # Then
    assert response.code == 400

async def test_get_history(jp_fetch):
    # When
    response = await jp_fetch("nbexchange-jlab", "history", params={"course_id": "my course"}, raise_error=False)

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {
        "success": False,
        "value": f"Could not connect to NbExchange service.",
    }