def test_image_generation_endpoint(client):
    resp = client.post(
        "/api/image/generate",
        json={
            "prompt": "A futuristic glowing neon city skyline at twilight",
            "aspect_ratio": "1:1",
            "style": "cyberpunk",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "image_id" in data
    assert "image_url" in data
    assert data["aspect_ratio"] == "1:1"
    assert data["style"] == "cyberpunk"

    # Test downloading the image
    img_resp = client.get(data["image_url"])
    assert img_resp.status_code == 200
    assert len(img_resp.content) > 0
