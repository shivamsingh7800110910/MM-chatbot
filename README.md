# 🌟 Multimodal AI Chatbot

A beginner-friendly, state-of-the-art Multimodal AI Chatbot built with **React 18**, **FastAPI (Python)**, and **SQLAlchemy** (supporting both **PostgreSQL + pgvector** and automatic zero-configuration **SQLite fallback**). 

The platform seamlessly combines multimodal conversations, visual comprehension, text-to-image synthesis, multilingual language intelligence, document Retrieval-Augmented Generation (RAG), live web search with citations, document drafting/revision, and supportive emotional assistance.

---

## 🚀 Key Features

### 1. 🎨 Multimodal AI Image Generation Studio *(New)*
- **Universal Text-to-Image Synthesis**: Generate high-definition artwork directly from natural language prompts.
- **Multiple Artistic Styles**: Photorealistic (`📸`), Anime / Ghibli (`🌸`), Digital Art (`🎨`), Cinematic Still (`🎬`), 3D Octane Render (`🧊`), Watercolor (`🖌️`), Cyberpunk Neon (`⚡`).
- **Flexible Aspect Ratios**: Square (`1:1`), Landscape (`16:9`), Portrait (`9:16`), Classic (`4:3`).
- **Zero-Friction Free Tier**: Integrated universal high-resolution diffusion generation (Flux / SDXL via Pollinations) with zero API keys required, while automatically utilizing Google Gemini (`gemini-3.1-flash-image`) or OpenAI (`dall-e-3`) when credentials are provided.
- **Seamless Chat Integration**: Send any generated artwork directly into the conversation stream with one click for collaborative review and discussion.
- **Interactive Lightbox**: Fullscreen zoom and instant PNG download.

### 2. 🌐 Multilingual Language Intelligence & Coaching *(New)*
- **Polyglot Translator Across 22+ Languages**:
  - English, Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese, Korean, Hindi, Bengali, Arabic, Turkish, Dutch, Polish, Swedish, Indonesian, Vietnamese, Thai, Greek, Hebrew.
- **Inline Message Translation**: Any assistant message in the chat can be translated in-place into any chosen language with one click.
- **Phonetic Pronunciation Guide**: Includes romanized pronunciation aids for non-Latin scripts (Japanese Hiragana/Katakana, Hindi, Chinese Pinyin, Cyrillic, Arabic).
- **Multilingual Speech Synthesis (TTS)**: Listen to native audio pronunciation powered by `gTTS` and Web Speech synthesis.
- **Grammar & Vocabulary Coach**: Deconstruct idioms, complex sentence structures, and nuances tailored to CEFR levels (Beginner A1-A2, Intermediate B1-B2, Advanced C1-C2).
- **Tone & Sentiment Analysis**: Evaluate draft emails, messages, or dialogues for emotional tone, formality, empathy, and constructive communication suggestions.

### 3. 💬 Multimodal Conversations (Vision & Voice)
- **Visual Understanding**: Attach photos, charts, diagrams, or screenshots for visual analysis, OCR, and reasoning.
- **Microphone Voice Input (Speech-to-Text)**: Record audio in-browser and transcribe it using Google Gemini audio intelligence.
- **Text-to-Speech (TTS) Voice Replies**: Toggle spoken replies or click **Speak** on any message for audio playback.

### 4. 📚 Document Knowledge & RAG
- **Multi-Format Ingestion**: Upload PDF, DOCX, TXT, and Markdown files.
- **Smart Chunking & Indexing**: Semantic chunking with overlap and vector embeddings.
- **Vector Search**: PostgreSQL `pgvector` for scalable cosine similarity search, with automatic graceful in-memory cosine fallback for SQLite.
- **Document Hub**: Manage uploaded files, track version revisions (v1 -> v2), preview extracted chunks, and test RAG query relevance in real-time.

### 5. 🔍 Web-Grounded Search
- **Live Information Access**: Toggle web search to fetch recent news, documentation, and real-time facts.
- **Verifiable Citations**: Grounded answers with interactive source badges linking to authoritative URLs.
- **Providers**: DuckDuckGo (zero config required) or Tavily Search API.

### 6. 💖 Empathetic Emotional Assistance
- **Non-Judgmental Persona**: Empathetic, supportive active listening mode.
- **Mindful Coping Tools**:
  - **Animated Box Breathing Pacer** (4s Inhale, 4s Hold, 4s Exhale, 4s Hold).
  - **5-4-3-2-1 Sensory Grounding Technique**.
  - **Cognitive Reframing Prompts**.
- **Crisis Safety Net**: Immediate prominent access to helpline resources (e.g., 988 Suicide & Crisis Lifeline).

---

## 🛠️ Tech Stack & Architecture

```
ml-chatbot/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI REST endpoints
│   │   │   ├── chat.py
│   │   │   ├── conversations.py
│   │   │   ├── documents.py
│   │   │   ├── image.py      # Image generation API
│   │   │   ├── language.py   # Translation & language hub API
│   │   │   ├── audio.py
│   │   │   ├── emotional.py
│   │   │   ├── search.py
│   │   │   └── health.py
│   │   ├── core/            # Configuration & settings (Pydantic BaseSettings)
│   │   ├── db/              # SQLAlchemy session & sqlite/pgvector fallback
│   │   ├── models/          # DB Models (Conversation, Message, Document, Chunk)
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic services
│   │   │   ├── llm_service.py
│   │   │   ├── image_service.py
│   │   │   ├── language_service.py
│   │   │   ├── rag_service.py
│   │   │   ├── search_service.py
│   │   │   ├── audio_service.py
│   │   │   ├── document_service.py
│   │   │   └── emotional_service.py
│   │   └── main.py          # FastAPI application entrypoint
│   ├── alembic/             # Database migrations
│   ├── tests/               # Pytest automated test suite (10 test suites)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # React components (Header, Sidebar, ChatArea, ChatInput,
│   │   │                    # ImageStudioModal, LanguageHubModal, DocumentHub, etc.)
│   │   ├── services/        # Typed API client
│   │   ├── types/           # TypeScript interfaces & types
│   │   ├── App.tsx          # Root application component
│   │   └── index.css        # Modern design system & dark glassmorphic styles
│   └── package.json
├── docker-compose.yml       # PostgreSQL 16 + pgvector container config
├── .env.example             # Documented environment variables
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- **Python**: 3.10+ (tested on Python 3.14.7)
- **Node.js**: 18+ (tested on Node v20.18.0 LTS)
- *(Optional)* Docker & Docker Compose for PostgreSQL + pgvector.

---

### Step 1: Clone and Configure Environment

```bash
git clone <repo-url>
cd "ML chatbot"

# Copy environment template
cp .env.example .env
```

Edit `.env` to supply any optional API keys:
- `GEMINI_API_KEY`: *(Recommended for best multimodal reasoning)*
- `OPENAI_API_KEY`: *(Optional alternative for GPT-4o / DALL-E 3)*
- `TAVILY_API_KEY`: *(Optional for high-speed web search)*

> **Note**: Even without any API keys, the chatbot runs completely out of the box using smart local simulated fallbacks and universal free AI image generation!

---

### Step 2: Start the Backend (FastAPI)

```bash
cd backend

# Create virtual environment (if not already created)
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations (optional, tables are auto-created on startup)
alembic upgrade head

# Start FastAPI server on port 8000
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will automatically start at **`http://localhost:8000`**.  
Interactive Swagger API docs are available at **`http://localhost:8000/docs`**.

---

### Step 3: Start the Frontend (React + Vite)

In a new terminal window:

```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server on port 5173
npm run dev -- --host 0.0.0.0 --port 5173
```

Open your browser and navigate to:
👉 **`http://localhost:5173`**

---

### Step 4: Optional Docker Compose for PostgreSQL + pgvector

If you wish to run a dedicated PostgreSQL 16 container with `pgvector`:

```bash
docker-compose up -d
```

Update your `.env`:
```env
DATABASE_URL=postgresql://chatbot_user:chatbot_pass@localhost:5432/chatbot_db
```

If PostgreSQL is not running, the application **automatically detects it and defaults seamlessly to local SQLite (`chatbot.db`)**, ensuring zero downtime or setup friction.

---

## 🧪 Running Automated Tests

Run the complete backend test suite:

```bash
source backend/.venv/bin/activate
cd backend
pytest -v
```

All 10 test suites test:
1. `test_health.py`: System diagnostics and database connection.
2. `test_conversations.py`: Full CRUD for conversations.
3. `test_chat.py`: Multimodal message flows and attachment handling.
4. `test_documents.py`: Document ingestion, versioning, and RAG retrieval.
5. `test_search.py`: Web grounding and citations.
6. `test_image.py`: Image generation, aspect ratios, and style presets.
7. `test_language.py`: Supported languages, translation, grammar coach, and tone analysis.

---

## 📖 API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System status, active database engine, and provider keys |
| `POST` | `/api/chat` | Main conversational multimodal interface |
| `GET` | `/api/conversations` | List conversation history |
| `POST` | `/api/conversations` | Create a new conversation |
| `GET` | `/api/conversations/{id}` | Fetch conversation messages |
| `PUT` | `/api/conversations/{id}` | Update conversation title or mode |
| `DELETE` | `/api/conversations/{id}` | Delete conversation |
| `POST` | `/api/image/generate` | Generate AI image from prompt, style, and ratio |
| `GET` | `/api/image/styles` | Get available image artistic styles |
| `GET` | `/api/language/supported` | List 22+ supported languages with flags & native names |
| `POST` | `/api/language/translate` | Translate text into target language with phonetic guide |
| `POST` | `/api/language/grammar-explain` | CEFR-graded linguistic deconstruction of a phrase |
| `POST` | `/api/language/analyze-tone` | Deconstruct emotional tone, formality, and communication tips |
| `POST` | `/api/documents/upload` | Upload & chunk PDF/DOCX/TXT/MD document |
| `GET` | `/api/documents` | List uploaded documents |
| `POST` | `/api/documents/draft` | Draft a new structured document with AI |
| `POST` | `/api/audio/transcribe` | Transcribe recorded audio (STT) |
| `POST` | `/api/audio/synthesize` | Synthesize speech from text (TTS) |
| `POST` | `/api/search` | Execute live web search with citations |
| `GET` | `/api/emotional/exercises` | Fetch box breathing, grounding, and helpline cards |

---

## 🤝 Pair Programming & Support
Built with pride for beginners and experts alike. For questions, feel free to open an issue or explore the `/docs` endpoint.
