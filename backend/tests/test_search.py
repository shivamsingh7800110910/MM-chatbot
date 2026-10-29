def test_search_endpoint(client):
    resp = client.post("/api/search", json={"query": "fastapi python web framework", "max_results": 3})
    assert resp.status_code == 200
    data = resp.json()
    assert data["query"] == "fastapi python web framework"
    assert "results" in data
    assert len(data["results"]) > 0
    assert "title" in data["results"][0]
    assert "url" in data["results"][0]
