import React, { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  User,
  Volume2,
  VolumeX,
  Copy,
  Check,
  FileText,
  Globe,
  HeartHandshake,
  ExternalLink,
  Languages,
  Download,
  Maximize2,
  X,
  Palette,
} from 'lucide-react';
import { Message, AppMode } from '../types';
import { api } from '../services/api';

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  activeMode: AppMode;
  onSendPresetMessage: (text: string) => void;
  onOpenImageStudio?: () => void;
  onOpenLanguageHub?: () => void;
}

const QUICK_LANGS = [
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
];

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isLoading,
  activeMode,
  onSendPresetMessage,
  onOpenImageStudio,
  onOpenLanguageHub,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Inline translation state
  const [activeTranslateMsgId, setActiveTranslateMsgId] = useState<string | null>(null);
  const [selectedLangs, setSelectedLangs] = useState<Record<string, string>>({});
  const [translations, setTranslations] = useState<Record<string, { text: string; langName: string; pronunciation?: string; loading?: boolean }>>({});

  // Lightbox preview for full images
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePlayAudio = async (msg: Message) => {
    // If currently playing, stop it
    if (playingAudioId === msg.id && audioElement) {
      audioElement.pause();
      setPlayingAudioId(null);
      return;
    }

    try {
      let audioSrc = msg.audio_base64;
      if (!audioSrc) {
        // Request synthesis from backend
        audioSrc = await api.synthesizeAudio(msg.content);
      }

      if (audioSrc) {
        if (audioElement) {
          audioElement.pause();
        }
        const audio = new Audio(audioSrc);
        audio.onended = () => setPlayingAudioId(null);
        audio.play();
        setAudioElement(audio);
        setPlayingAudioId(msg.id);
      }
    } catch (e) {
      console.warn('Audio synthesis fallback to browser Web Speech API:', e);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(msg.content);
        utterance.onend = () => setPlayingAudioId(null);
        window.speechSynthesis.speak(utterance);
        setPlayingAudioId(msg.id);
      }
    }
  };

  const handleTranslateMessage = async (msgId: string, content: string, targetLang: string) => {
    setTranslations((prev) => ({
      ...prev,
      [msgId]: { text: '', langName: '', loading: true },
    }));

    try {
      const res = await api.translateText(content, targetLang);
      setTranslations((prev) => ({
        ...prev,
        [msgId]: {
          text: res.translated_text,
          langName: res.target_language,
          pronunciation: res.pronunciation || undefined,
          loading: false,
        },
      }));
    } catch (err: any) {
      alert(`Translation error: ${err.message}`);
      setTranslations((prev) => {
        const copy = { ...prev };
        delete copy[msgId];
        return copy;
      });
    }
  };

  const renderEmptyState = () => {
    const presetsByMode: Record<AppMode, { title: string; desc: string; prompts: string[] }> = {
      standard: {
        title: 'Multimodal AI Workspace',
        desc: 'Explore text, visual understanding, text-to-image synthesis, and multilingual translation in one place.',
        prompts: [
          'Create a vivid image of a cyberpunk neon city in the rain with flying cars',
          'Translate "Good morning! Wishing you an inspired and productive day" into Spanish, French, and Japanese',
          'Analyze this uploaded architectural diagram or screenshot',
          'Explain the grammar structure of "C\'est la vie qui veut ça" for intermediate French learners',
        ],
      },
      emotional: {
        title: 'Supportive Emotional Companion',
        desc: 'A gentle, empathetic space for active listening, reflection, and mindful coping.',
        prompts: [
          'I am feeling stressed and overwhelmed with my deadlines today.',
          'Can you guide me through a 2-minute calming breathing exercise?',
          'Help me reframe self-doubt about my recent project presentation.',
        ],
      },
      rag: {
        title: 'Document Knowledge & RAG',
        desc: 'Ask questions grounded strictly in your uploaded PDF, DOCX, and Markdown files.',
        prompts: [
          'Summarize the core methodology from my uploaded research paper',
          'What are the main system requirements listed in the specs document?',
          'Extract all key dates, milestones, and deliverables',
        ],
      },
      search: {
        title: 'Web-Grounded Search',
        desc: 'Access live external sources and receive answers backed by real citations.',
        prompts: [
          'What are the latest developments in multimodal AI models this year?',
          'Compare the benefits of PostgreSQL pgvector vs standalone vector databases',
          'Find recent documentation on FastAPI dependency injection best practices',
        ],
      },
    };

    const currentPreset = presetsByMode[activeMode] || presetsByMode.standard;

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '32px 16px',
        textAlign: 'center',
        maxWidth: '680px',
        margin: '0 auto',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'var(--gradient-brand)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          boxShadow: 'var(--shadow-glow)',
        }}>
          {activeMode === 'emotional' ? (
            <HeartHandshake size={28} color="#fff" />
          ) : activeMode === 'rag' ? (
            <FileText size={28} color="#fff" />
          ) : activeMode === 'search' ? (
            <Globe size={28} color="#fff" />
          ) : (
            <Sparkles size={28} color="#fff" />
          )}
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
          {currentPreset.title}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.5, marginBottom: '20px' }}>
          {currentPreset.desc}
        </p>

        {activeMode === 'standard' && (
          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {onOpenImageStudio && (
              <button
                onClick={onOpenImageStudio}
                className="btn btn-secondary"
                style={{
                  background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
                  borderColor: 'rgba(236, 72, 153, 0.4)',
                  color: '#f472b6',
                  padding: '8px 16px',
                  fontSize: '13px',
                }}
              >
                <Palette size={15} />
                <span>Open Image Studio</span>
              </button>
            )}
            {onOpenLanguageHub && (
              <button
                onClick={onOpenLanguageHub}
                className="btn btn-secondary"
                style={{
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
                  borderColor: 'rgba(6, 182, 212, 0.4)',
                  color: '#67e8f9',
                  padding: '8px 16px',
                  fontSize: '13px',
                }}
              >
                <Languages size={15} />
                <span>Open Language Hub</span>
              </button>
            )}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '10px',
          width: '100%',
        }}>
          {currentPreset.prompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => onSendPresetMessage(p)}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 18px',
                textAlign: 'left',
                color: 'var(--text-main)',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              <span>{p}</span>
              <Sparkles size={14} color="#818cf8" />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={scrollRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {messages.length === 0 ? (
        renderEmptyState()
      ) : (
        messages.map((m) => {
          const isUser = m.role === 'user';

          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                gap: '14px',
                maxWidth: '820px',
                margin: '0 auto',
                width: '100%',
                alignSelf: 'center',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: isUser ? 'rgba(255, 255, 255, 0.1)' : 'var(--gradient-brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '4px',
                boxShadow: isUser ? 'none' : '0 2px 10px rgba(99, 102, 241, 0.3)',
              }}>
                {isUser ? <User size={18} color="#e2e8f0" /> : <Sparkles size={18} color="#ffffff" />}
              </div>

              {/* Message Body */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Header row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: isUser ? '#cbd5e1' : '#a5b4fc' }}>
                    {isUser ? 'You' : 'Assistant'}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {!isUser && (
                      <>
                        <button
                          onClick={() => setActiveTranslateMsgId(activeTranslateMsgId === m.id ? null : m.id)}
                          className="btn btn-ghost"
                          style={{
                            padding: '3px 7px',
                            fontSize: '12px',
                            color: activeTranslateMsgId === m.id ? '#67e8f9' : undefined,
                          }}
                          title="Translate this response into another language"
                        >
                          <Languages size={14} /> Translate
                        </button>

                        <button
                          onClick={() => handlePlayAudio(m)}
                          className="btn btn-ghost"
                          style={{ padding: '3px 7px', fontSize: '12px' }}
                          title={playingAudioId === m.id ? 'Stop audio' : 'Listen with TTS'}
                        >
                          {playingAudioId === m.id ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f43f5e' }}>
                              <VolumeX size={14} /> Stop
                            </span>
                          ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Volume2 size={14} /> Speak
                            </span>
                          )}
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => copyToClipboard(m.content, m.id)}
                      className="btn btn-ghost"
                      style={{ padding: '3px 7px', fontSize: '12px' }}
                      title="Copy text"
                    >
                      {copiedId === m.id ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* Attachments rendering */}
                {m.attachments && m.attachments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                    {m.attachments.map((att, aIdx) => (
                      <div
                        key={aIdx}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '12px',
                        }}
                      >
                        {att.type === 'image' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {att.url && (
                              <img
                                src={att.url}
                                alt={att.name}
                                onClick={() => setLightboxImage({ url: att.url, title: att.name })}
                                style={{
                                  width: '48px',
                                  height: '48px',
                                  objectFit: 'cover',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  border: '1px solid rgba(255,255,255,0.2)',
                                }}
                                title="Click to view full image"
                              />
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 500 }}>{att.name}</span>
                              <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                                <button
                                  type="button"
                                  onClick={() => setLightboxImage({ url: att.url, title: att.name })}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#67e8f9',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    padding: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                  }}
                                >
                                  <Maximize2 size={11} /> View
                                </button>
                                <a
                                  href={att.url}
                                  download={att.name || 'image.png'}
                                  style={{
                                    color: '#94a3b8',
                                    fontSize: '11px',
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                  }}
                                >
                                  <Download size={11} /> Save
                                </a>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FileText size={16} color="#10b981" />
                            <span>{att.name}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Content Bubble */}
                <div
                  className="prose"
                  style={{
                    background: isUser ? 'rgba(30, 41, 59, 0.5)' : 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px 20px',
                    color: '#f8fafc',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {m.content}
                </div>

                {/* Inline Translation Selector Bar */}
                {activeTranslateMsgId === m.id && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px 14px',
                    background: 'rgba(6, 182, 212, 0.08)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '12px',
                  }}>
                    <span style={{ fontWeight: 600, color: '#67e8f9', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Languages size={14} /> Translate into:
                    </span>
                    <select
                      value={selectedLangs[m.id] || 'es'}
                      onChange={(e) => setSelectedLangs({ ...selectedLangs, [m.id]: e.target.value })}
                      style={{
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(6, 182, 212, 0.4)',
                        borderRadius: '6px',
                        color: '#fff',
                        padding: '4px 8px',
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    >
                      {QUICK_LANGS.map((ql) => (
                        <option key={ql.code} value={ql.code}>
                          {ql.flag} {ql.name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => handleTranslateMessage(m.id, m.content, selectedLangs[m.id] || 'es')}
                      disabled={translations[m.id]?.loading}
                      className="btn btn-primary"
                      style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                      }}
                    >
                      {translations[m.id]?.loading ? 'Translating...' : 'Translate'}
                    </button>

                    <button
                      onClick={() => setActiveTranslateMsgId(null)}
                      className="btn btn-ghost"
                      style={{ padding: '4px 8px', fontSize: '11px' }}
                    >
                      Close
                    </button>
                  </div>
                )}

                {/* Translated Content Card */}
                {translations[m.id] && !translations[m.id].loading && (
                  <div style={{
                    marginTop: '10px',
                    padding: '14px 18px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(6, 182, 212, 0.4)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#67e8f9', textTransform: 'uppercase' }}>
                        🌐 TRANSLATED TO {translations[m.id].langName}:
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={async () => {
                            try {
                              const b64 = await api.synthesizeAudio(translations[m.id].text, selectedLangs[m.id] || 'es');
                              if (b64) new Audio(b64).play();
                            } catch (e) {
                              console.warn('TTS error:', e);
                            }
                          }}
                          className="btn btn-ghost"
                          style={{ padding: '2px 6px', fontSize: '11px', color: '#67e8f9' }}
                          title="Listen in translated language"
                        >
                          <Volume2 size={13} /> Speak
                        </button>
                        <button
                          onClick={() => copyToClipboard(translations[m.id].text, `${m.id}-trans`)}
                          className="btn btn-ghost"
                          style={{ padding: '2px 6px', fontSize: '11px' }}
                          title="Copy translated text"
                        >
                          {copiedId === `${m.id}-trans` ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: '14px', color: '#f1f5f9', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {translations[m.id].text}
                    </div>

                    {translations[m.id].pronunciation && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                        Pronunciation: <span style={{ color: '#a5b4fc' }}>{translations[m.id].pronunciation}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Citations / Sources Grounding Badges */}
                {m.citations && m.citations.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '6px', fontWeight: 600 }}>
                      SOURCES & GROUNDING:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {m.citations.map((c, cIdx) => (
                        <a
                          key={cIdx}
                          href={c.url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: c.source_type === 'document' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(6, 182, 212, 0.1)',
                            border: `1px solid ${c.source_type === 'document' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(6, 182, 212, 0.3)'}`,
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '12px',
                            color: c.source_type === 'document' ? '#6ee7b7' : '#67e8f9',
                            textDecoration: 'none',
                            maxWidth: '360px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={c.snippet}
                        >
                          {c.source_type === 'document' ? <FileText size={12} /> : <Globe size={12} />}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</span>
                          <ExternalLink size={11} style={{ flexShrink: 0 }} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Loading Shimmer Indicator */}
      {isLoading && (
        <div style={{
          display: 'flex',
          gap: '14px',
          maxWidth: '820px',
          margin: '0 auto',
          width: '100%',
          alignSelf: 'center',
        }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'var(--gradient-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: 'var(--shadow-glow)',
          }}>
            <Sparkles size={18} color="#ffffff" />
          </div>
          <div style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366f1', animation: 'recordingPulse 1s infinite' }} />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a855f7', animation: 'recordingPulse 1s infinite 0.2s' }} />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ec4899', animation: 'recordingPulse 1s infinite 0.4s' }} />
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '6px' }}>Thinking & formulating response...</span>
          </div>
        </div>
      )}

      {/* Full Image Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(12px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="btn btn-ghost"
              style={{
                position: 'absolute',
                top: '-44px',
                right: '0',
                color: '#fff',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                padding: '8px',
              }}
            >
              <X size={20} />
            </button>

            <img
              src={lightboxImage.url}
              alt={lightboxImage.title}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                borderRadius: '12px',
                objectFit: 'contain',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
              }}
            />

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              marginTop: '12px',
              padding: '8px 14px',
              background: 'rgba(15, 23, 42, 0.9)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
            }}>
              <span style={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>{lightboxImage.title}</span>
              <a
                href={lightboxImage.url}
                download={lightboxImage.title || 'image.png'}
                className="btn btn-primary"
                style={{ padding: '6px 14px', fontSize: '12px', textDecoration: 'none' }}
              >
                <Download size={14} /> Download Image
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
