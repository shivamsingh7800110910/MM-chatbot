def test_conversation_crud(client):
    # 1. Create conversation
    create_resp = client.post("/api/conversations", json={"title": "Test Chat", "mode": "standard"})
    assert create_resp.status_code == 201
    conv = create_resp.json()
    conv_id = conv["id"]
    assert conv["title"] == "Test Chat"
    assert conv["mode"] == "standard"

    # 2. List conversations
    list_resp = client.get("/api/conversations")
    assert list_resp.status_code == 200
    conv_list = list_resp.json()
    assert any(c["id"] == conv_id for c in conv_list)

    # 3. Get single conversation
    get_resp = client.get(f"/api/conversations/{conv_id}")
    assert get_resp.status_code == 200
    conv_detail = get_resp.json()
    assert conv_detail["id"] == conv_id
    assert "messages" in conv_detail

    # 4. Patch conversation
    patch_resp = client.patch(f"/api/conversations/{conv_id}", json={"title": "Updated Title", "mode": "emotional"})
    assert patch_resp.status_code == 200
    updated = patch_resp.json()
    assert updated["title"] == "Updated Title"
    assert updated["mode"] == "emotional"

    # 5. Delete conversation
    del_resp = client.delete(f"/api/conversations/{conv_id}")
    assert del_resp.status_code == 204

    # Verify not found
    get_after_del = client.get(f"/api/conversations/{conv_id}")
    assert get_after_del.status_code == 404
