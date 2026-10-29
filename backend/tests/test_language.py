def test_supported_languages(client):
    resp = client.get("/api/language/supported")
    assert resp.status_code == 200
    languages = resp.json()
    assert len(languages) >= 15
    codes = [l["code"] for l in languages]
    assert "es" in codes
    assert "fr" in codes
    assert "hi" in codes
    assert "ja" in codes

def test_language_translation(client):
    resp = client.post(
        "/api/language/translate",
        json={
            "text": "Hello, how are you today?",
            "target_language": "es",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "translated_text" in data
    assert len(data["translated_text"]) > 0

def test_language_explain(client):
    resp = client.post(
        "/api/language/explain",
        json={
            "phrase": "Komorebi",
            "target_language": "ja",
            "learner_level": "intermediate",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "explanation" in data
    assert len(data["explanation"]) > 0

def test_tone_analysis(client):
    resp = client.post(
        "/api/language/tone",
        json={
            "text": "I am absolutely thrilled with the incredible results we achieved this quarter!",
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "analysis" in data
    assert len(data["analysis"]) > 0
