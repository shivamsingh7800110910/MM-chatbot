export type AppMode = 'standard' | 'emotional' | 'rag' | 'search';

export interface Attachment {
  name: string;
  type: 'image' | 'document' | 'audio';
  url: string;
  size?: number;
}

export interface Citation {
  title: string;
  url?: string;
  snippet: string;
  source_type: 'web' | 'document';
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
  citations?: Citation[];
  created_at: string;
  audio_base64?: string;
}

export interface Conversation {
  id: string;
  title: string;
  mode: AppMode;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface DocumentItem {
  id: string;
  title: string;
  filename: string;
  file_type: string;
  file_size: number;
  version: number;
  parent_id?: string | null;
  is_generated: boolean;
  created_at: string;
  updated_at: string;
  chunk_count?: number;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface HealthStatus {
  status: string;
  service: string;
  environment: string;
  database: {
    status: string;
    engine: string;
  };
  providers: {
    default_llm: string;
    gemini_configured: boolean;
    openai_configured: boolean;
    search_provider: string;
    tavily_configured: boolean;
  };
}

export interface ReflectionPrompt {
  category: string;
  title: string;
  prompt: string;
}

export interface CopingExercise {
  id: string;
  title: string;
  description: string;
  steps: string[];
}

export interface EmotionalResources {
  reflection_prompts: ReflectionPrompt[];
  coping_exercises: CopingExercise[];
  disclaimer: string;
}

// Image Generation
export interface GeneratedImageResult {
  image_id: string;
  image_url: string;
  data_url?: string;
  prompt: string;
  aspect_ratio: string;
  style: string;
}

// Language Intelligence
export interface SupportedLanguage {
  code: string;
  name: string;
  native: string;
  flag: string;
  speech_code: string;
}

export interface TranslationResult {
  original_text: string;
  translated_text: string;
  target_language: string;
  target_code: string;
  source_language: string;
  pronunciation?: string | null;
}

export interface LanguageExplainResult {
  phrase: string;
  detected_language: string;
  target_language: string;
  learner_level: string;
  explanation: string;
}

export interface ToneAnalysisResult {
  text: string;
  language: string;
  analysis: string;
}
