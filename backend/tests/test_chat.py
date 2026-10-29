def test_chat_message_flow(client):
    # 1. Send chat message without conversation_id (should auto-create)
    resp = client.post(
        "/api/chat",
        json={
            "message": "Hello AI! Can you explain machine learning?",
            "mode": "standard",
            "attachments": [],
            "enable_search": False,
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "conversation_id" in data
    assert "message_id" in data
    assert data["role"] == "assistant"
    assert len(data["content"]) > 0

    conv_id = data["conversation_id"]

    # 2. Send follow-up in same conversation
    resp2 = client.post(
        "/api/chat",
        json={
            "conversation_id": conv_id,
            "message": "What is deep learning?",
            "mode": "standard",
        },
    )
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["conversation_id"] == conv_id

    # 3. Test emotional mode and crisis card safety
    resp_emotional = client.post(
        "/api/chat",
        json={
            "conversation_id": conv_id,
            "message": "I'm having a really stressful day and feel overwhelmed.",
            "mode": "emotional",
        },
    )
    assert resp_emotional.status_code == 200
    data_em = resp_emotional.json()
    assert "courage" in data_em["content"].lower() or "coping" in data_em["content"].lower() or "support" in data_em["content"].lower()

    # 4. Verify conversation messages count
    conv_get = client.get(f"/api/conversations/{conv_id}")
    assert conv_get.status_code == 200
    # 3 user messages + 3 assistant responses = 6 messages
    assert len(conv_get.json()["messages"]) == 6
