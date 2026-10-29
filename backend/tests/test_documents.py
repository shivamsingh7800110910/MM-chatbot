import io

def test_document_lifecycle(client):
    # 1. Upload a text document
    file_content = b"# Antigravity Project Guide\n\nThis guide explains how to build scalable AI chatbots using FastAPI and React.\n\nKey Section: Retrieval Augmented Generation allows querying private knowledge bases."
    files = {"file": ("guide.md", io.BytesIO(file_content), "text/markdown")}
    upload_resp = client.post("/api/documents/upload", files=files, data={"title": "Antigravity Guide"})
    assert upload_resp.status_code == 201
    doc = upload_resp.json()
    doc_id = doc["id"]
    assert doc["title"] == "Antigravity Guide"
    assert doc["version"] == 1
    assert doc["chunk_count"] > 0

    # 2. List documents
    list_resp = client.get("/api/documents")
    assert list_resp.status_code == 200
    assert any(d["id"] == doc_id for d in list_resp.json())

    # 3. Ask document using RAG
    ask_resp = client.post(
        f"/api/documents/{doc_id}/ask",
        json={"question": "What does Retrieval Augmented Generation allow?"},
    )
    assert ask_resp.status_code == 200
    ask_data = ask_resp.json()
    assert "answer" in ask_data

    # 4. Create document from prompt
    create_doc_resp = client.post(
        "/api/documents/create",
        json={"title": "Project Roadmap", "content_or_prompt": "Draft an MVP milestones roadmap for an AI application."},
    )
    assert create_doc_resp.status_code == 201
    created_doc = create_doc_resp.json()
    assert created_doc["is_generated"] is True
    assert created_doc["version"] == 1

    # 5. Revise document (versioning)
    revise_resp = client.post(
        f"/api/documents/{created_doc['id']}/revise",
        json={"instructions": "Add a dedicated section for security considerations and unit testing."},
    )
    assert revise_resp.status_code == 201
    revised_doc = revise_resp.json()
    assert revised_doc["version"] == 2
    assert revised_doc["parent_id"] == created_doc["id"]

    # 6. Download document
    down_resp = client.get(f"/api/documents/{doc_id}/download")
    assert down_resp.status_code == 200
    assert b"Antigravity Project Guide" in down_resp.content
