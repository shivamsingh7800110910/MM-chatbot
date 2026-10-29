import {
  Conversation,
  Message,
  DocumentItem,
  HealthStatus,
  EmotionalResources,
  AppMode,
  Attachment,
} from '../types';

const API_BASE = '/api';

export const api = {
  // Health
  async getHealth(): Promise<HealthStatus> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to fetch health status');
    return res.json();
  },

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    const res = await fetch(`${API_BASE}/conversations`);
    if (!res.ok) throw new Error('Failed to fetch conversations');
    return res.json();
  },

  async createConversation(title = 'New Conversation', mode: AppMode = 'standard'): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, mode }),
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    return res.json();
  },

  async getConversation(id: string): Promise<Conversation & { messages: Message[] }> {
    const res = await fetch(`${API_BASE}/conversations/${id}`);
    if (!res.ok) throw new Error('Failed to fetch conversation');
    return res.json();
  },

  async updateConversation(id: string, updates: { title?: string; mode?: AppMode }): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update conversation');
    return res.json();
  },

  async deleteConversation(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/conversations/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete conversation');
  },

  // Chat
  async sendMessage(params: {
    conversation_id?: string;
    message: string;
    mode?: AppMode;
    attachments?: Attachment[];
    enable_search?: boolean;
    enable_rag?: boolean;
    document_id?: string;
    synthesize_speech?: boolean;
  }): Promise<{
    conversation_id: string;
    message_id: string;
    role: string;
    content: string;
    attachments: Attachment[];
    citations: any[];
    audio_base64?: string;
  }> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to send message' }));
      throw new Error(err.detail || 'Failed to send message');
    }
    return res.json();
  },

  // Documents
  async getDocuments(): Promise<DocumentItem[]> {
    const res = await fetch(`${API_BASE}/documents`);
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  async getDocument(id: string): Promise<DocumentItem> {
    const res = await fetch(`${API_BASE}/documents/${id}`);
    if (!res.ok) throw new Error('Failed to fetch document');
    return res.json();
  },

  async uploadDocument(file: File, title?: string): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload document');
    return res.json();
  },

  async askDocument(id: string, question: string): Promise<{ answer: string; citations: any[] }> {
    const res = await fetch(`${API_BASE}/documents/${id}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    if (!res.ok) throw new Error('Failed to ask document');
    return res.json();
  },

  async createDocument(title: string, content_or_prompt: string, file_type = 'md'): Promise<DocumentItem> {
    const res = await fetch(`${API_BASE}/documents/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content_or_prompt, file_type }),
    });
    if (!res.ok) throw new Error('Failed to create document');
    return res.json();
  },

  async reviseDocument(id: string, instructions: string): Promise<DocumentItem> {
    const res = await fetch(`${API_BASE}/documents/${id}/revise`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instructions }),
    });
    if (!res.ok) throw new Error('Failed to revise document');
    return res.json();
  },

  getDocumentDownloadUrl(id: string): string {
    return `${API_BASE}/documents/${id}/download`;
  },

  // Search
  async searchWeb(query: string, max_results = 5): Promise<any> {
    const res = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, max_results }),
    });
    if (!res.ok) throw new Error('Failed to search');
    return res.json();
  },

  // Audio
  async transcribeAudio(audioBlob: Blob, filename = 'recording.webm'): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioBlob, filename);

    const res = await fetch(`${API_BASE}/audio/transcribe`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to transcribe audio');
    const data = await res.json();
    return data.text;
  },

  async synthesizeAudio(text: string, language = 'en'): Promise<string> {
    const res = await fetch(`${API_BASE}/audio/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
    });
    if (!res.ok) throw new Error('Failed to synthesize audio');
    const data = await res.json();
    return data.audio_base64;
  },

  // Emotional Assistance
  async getEmotionalResources(): Promise<EmotionalResources> {
    const res = await fetch(`${API_BASE}/emotional/resources`);
    if (!res.ok) throw new Error('Failed to fetch emotional resources');
    return res.json();
  },

  // AI Image Generation
  async generateImage(params: {
    prompt: string;
    aspect_ratio?: string;
    style?: string;
    conversation_id?: string;
  }): Promise<{
    image_id: string;
    image_url: string;
    data_url?: string;
    prompt: string;
    aspect_ratio: string;
    style: string;
  }> {
    const res = await fetch(`${API_BASE}/image/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to generate image' }));
      throw new Error(err.detail || 'Failed to generate image');
    }
    return res.json();
  },

  // Language Intelligence
  async getSupportedLanguages(): Promise<Array<{ code: string; name: string; native: string; flag: string; speech_code: string }>> {
    const res = await fetch(`${API_BASE}/language/supported`);
    if (!res.ok) throw new Error('Failed to fetch supported languages');
    return res.json();
  },

  async translateText(text: string, targetLanguage: string): Promise<{
    original_text: string;
    translated_text: string;
    target_language: string;
    target_code: string;
    source_language: string;
    pronunciation?: string | null;
  }> {
    const res = await fetch(`${API_BASE}/language/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, target_language: targetLanguage }),
    });
    if (!res.ok) throw new Error('Translation failed');
    return res.json();
  },

  async explainLanguage(phrase: string, targetLanguage = 'en', learnerLevel = 'intermediate'): Promise<{
    phrase: string;
    detected_language: string;
    target_language: string;
    learner_level: string;
    explanation: string;
  }> {
    const res = await fetch(`${API_BASE}/language/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phrase, target_language: targetLanguage, learner_level: learnerLevel }),
    });
    if (!res.ok) throw new Error('Language explanation failed');
    return res.json();
  },

  async analyzeTone(text: string): Promise<{
    text: string;
    language: string;
    analysis: string;
  }> {
    const res = await fetch(`${API_BASE}/language/tone`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error('Tone analysis failed');
    return res.json();
  },
};
