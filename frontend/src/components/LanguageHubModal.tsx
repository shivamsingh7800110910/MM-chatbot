import React, { useState, useEffect } from 'react';
import {
  Globe,
  Languages,
  BookOpen,
  Sparkles,
  Volume2,
  Copy,
  Check,
  X,
  MessageSquare,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { SupportedLanguage } from '../types';
import { api } from '../services/api';

interface LanguageHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat: (text: string) => void;
}

export const LanguageHubModal: React.FC<LanguageHubModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [activeTab, setActiveTab] = useState<'translate' | 'explain' | 'tone'>('translate');
  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);

  // Translator state
  const [sourceText, setSourceText] = useState('');
  const [targetLang, setTargetLang] = useState('es');
  const [translationResult, setTranslationResult] = useState<any>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  // Explainer state
  const [explainPhrase, setExplainPhrase] = useState('');
  const [explainLang, setExplainLang] = useState('ja');
  const [learnerLevel, setLearnerLevel] = useState('intermediate');
  const [explainResult, setExplainResult] = useState<any>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  // Tone state
  const [toneText, setToneText] = useState('');
  const [toneResult, setToneResult] = useState<any>(null);
  const [isAnalyzingTone, setIsAnalyzingTone] = useState(false);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && languages.length === 0) {
      api.getSupportedLanguages().then(setLanguages).catch(console.error);
    }
  }, [isOpen, languages.length]);

  if (!isOpen) return null;

  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceText.trim()) return;

    setIsTranslating(true);
    try {
      const res = await api.translateText(sourceText.trim(), targetLang);
      setTranslationResult(res);
    } catch (err: any) {
      alert(`Translation failed: ${err.message}`);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleExplain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!explainPhrase.trim()) return;

    setIsExplaining(true);
    try {
      const res = await api.explainLanguage(explainPhrase.trim(), explainLang, learnerLevel);
      setExplainResult(res);
    } catch (err: any) {
      alert(`Explanation failed: ${err.message}`);
    } finally {
      setIsExplaining(false);
    }
  };

  const handleToneAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toneText.trim()) return;

    setIsAnalyzingTone(true);
    try {
      const res = await api.analyzeTone(toneText.trim());
      setToneResult(res);
    } catch (err: any) {
      alert(`Tone analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzingTone(false);
    }
  };

  const playSpeech = async (text: string, langCode: string) => {
    try {
      const b64 = await api.synthesizeAudio(text, langCode);
      if (b64) {
        new Audio(b64).play();
      }
    } catch (err) {
      console.warn('Backend audio failed, using browser speech synthesis:', err);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const copyText = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '20px',
    }}>
      <div className="glass-panel-elevated" style={{
        width: '100%',
        maxWidth: '860px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)',
            }}>
              <Languages size={18} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 600 }}>Language Intelligence & Translation Hub</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                Polyglot translation across 20+ languages, deep grammar explanations, and tone/sentiment intelligence.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 24px',
          background: 'rgba(255, 255, 255, 0.02)',
        }}>
          <button
            onClick={() => setActiveTab('translate')}
            style={{
              padding: '12px 18px',
              fontSize: '13px',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'translate' ? '2px solid #06b6d4' : '2px solid transparent',
              color: activeTab === 'translate' ? '#06b6d4' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Globe size={15} /> Polyglot Translator
          </button>
          <button
            onClick={() => setActiveTab('explain')}
            style={{
              padding: '12px 18px',
              fontSize: '13px',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'explain' ? '2px solid #06b6d4' : '2px solid transparent',
              color: activeTab === 'explain' ? '#06b6d4' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <BookOpen size={15} /> Grammar & Vocabulary Coach
          </button>
          <button
            onClick={() => setActiveTab('tone')}
            style={{
              padding: '12px 18px',
              fontSize: '13px',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'tone' ? '2px solid #06b6d4' : '2px solid transparent',
              color: activeTab === 'tone' ? '#06b6d4' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Activity size={15} /> Tone & Sentiment Analysis
          </button>
        </div>

        {/* Tab Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          
          {/* TAB 1: TRANSLATOR */}
          {activeTab === 'translate' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <form onSubmit={handleTranslate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600 }}>Enter Text to Translate</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Target:</span>
                    <select
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#fff',
                        padding: '6px 12px',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    >
                      {languages.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.flag} {l.name} ({l.native})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder="Type or paste any text, sentence, or paragraph in any language..."
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    color: '#fff',
                    fontSize: '14px',
                    fontFamily: 'var(--font-sans)',
                    outline: 'none',
                    resize: 'none',
                    lineHeight: 1.5,
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={isTranslating || !sourceText.trim()}
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', padding: '10px 20px' }}
                  >
                    <Globe size={15} />
                    <span>{isTranslating ? 'Translating with AI...' : 'Translate'}</span>
                  </button>
                </div>
              </form>

              {/* Translation Output Card */}
              {translationResult && (
                <div style={{
                  background: 'rgba(6, 182, 212, 0.06)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#67e8f9', textTransform: 'uppercase' }}>
                      {translationResult.source_language} <ArrowRight size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {translationResult.target_language}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => playSpeech(translationResult.translated_text, translationResult.target_code)}
                        className="btn btn-ghost"
                        style={{ padding: '4px 8px', fontSize: '12px', color: '#67e8f9' }}
                        title="Listen to pronunciation"
                      >
                        <Volume2 size={15} /> Listen
                      </button>

                      <button
                        onClick={() => copyText(translationResult.translated_text)}
                        className="btn btn-ghost"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        title="Copy translation"
                      >
                        {copied ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
                      </button>

                      <button
                        onClick={() => {
                          onSendToChat(translationResult.translated_text);
                          onClose();
                        }}
                        className="btn btn-primary"
                        style={{ padding: '4px 12px', fontSize: '12px', background: 'rgba(6, 182, 212, 0.8)' }}
                      >
                        <MessageSquare size={13} /> Send to Chat
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '16px', fontWeight: 500, color: '#fff', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {translationResult.translated_text}
                  </div>

                  {translationResult.pronunciation && (
                    <div style={{
                      fontSize: '13px',
                      color: 'var(--text-muted)',
                      fontStyle: 'italic',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                      paddingTop: '8px',
                    }}>
                      Phonetic Guide: <span style={{ color: '#a5b4fc' }}>{translationResult.pronunciation}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EXPLAIN & TUTOR */}
          {activeTab === 'explain' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <form onSubmit={handleExplain} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600 }}>Phrase or Sentence to Deconstruct</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Language:</span>
                    <select
                      value={explainLang}
                      onChange={(e) => setExplainLang(e.target.value)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#fff',
                        padding: '6px 10px',
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    >
                      <option value="">Auto-Detect</option>
                      {languages.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.flag} {l.name}
                        </option>
                      ))}
                    </select>

                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '6px' }}>Level:</span>
                    <select
                      value={learnerLevel}
                      onChange={(e) => setLearnerLevel(e.target.value)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        color: '#fff',
                        padding: '6px 10px',
                        fontSize: '12px',
                        outline: 'none',
                      }}
                    >
                      <option value="beginner">Beginner (A1-A2)</option>
                      <option value="intermediate">Intermediate (B1-B2)</option>
                      <option value="advanced">Advanced (C1-C2)</option>
                    </select>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="e.g. Ich verstehe nur Bahnhof / C'est la vie / 一期一会"
                  value={explainPhrase}
                  onChange={(e) => setExplainPhrase(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={isExplaining || !explainPhrase.trim()}
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', padding: '10px 20px' }}
                  >
                    <BookOpen size={15} />
                    <span>{isExplaining ? 'Analyzing Grammar & Nuances...' : 'Explain Grammar & Vocabulary'}</span>
                  </button>
                </div>
              </form>

              {explainResult && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8' }}>
                      Linguistic Analysis: "{explainResult.phrase}"
                    </span>
                    <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                      {explainResult.detected_language} • Level: {explainResult.learner_level}
                    </span>
                  </div>

                  <div className="prose" style={{ color: '#f8fafc', whiteSpace: 'pre-wrap' }}>
                    {explainResult.explanation}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TONE & SENTIMENT */}
          {activeTab === 'tone' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <form onSubmit={handleToneAnalysis} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600 }}>Message or Communication Text to Analyze</label>
                <textarea
                  rows={4}
                  value={toneText}
                  onChange={(e) => setToneText(e.target.value)}
                  placeholder="Paste an email draft, customer message, or dialogue to evaluate tone, empathy, formality, and emotional impact..."
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    color: '#fff',
                    fontSize: '14px',
                    fontFamily: 'var(--font-sans)',
                    outline: 'none',
                    resize: 'none',
                    lineHeight: 1.5,
                  }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={isAnalyzingTone || !toneText.trim()}
                    className="btn btn-primary"
                    style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', padding: '10px 20px' }}
                  >
                    <Sparkles size={15} />
                    <span>{isAnalyzingTone ? 'Deconstructing Sentiment...' : 'Analyze Tone & Sentiment'}</span>
                  </button>
                </div>
              </form>

              {toneResult && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8' }}>
                      Emotional & Stylistic Breakdown
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      Language: {toneResult.language}
                    </span>
                  </div>

                  <div className="prose" style={{ color: '#f8fafc', whiteSpace: 'pre-wrap' }}>
                    {toneResult.analysis}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
