import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Wind,
  Compass,
  BookOpen,
  X,
  PhoneCall,
  Play,
  Square,
  Sparkles,
} from 'lucide-react';
import { EmotionalResources } from '../types';
import { api } from '../services/api';

interface EmotionalSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUsePrompt: (promptText: string) => void;
}

export const EmotionalSupportModal: React.FC<EmotionalSupportModalProps> = ({
  isOpen,
  onClose,
  onUsePrompt,
}) => {
  const [resources, setResources] = useState<EmotionalResources | null>(null);
  const [activeTab, setActiveTab] = useState<'breathing' | 'grounding' | 'prompts'>('breathing');

  // Breathing pacer state
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [breathSeconds, setBreathSeconds] = useState(4);

  useEffect(() => {
    if (isOpen && !resources) {
      api.getEmotionalResources().then(setResources).catch(console.error);
    }
  }, [isOpen, resources]);

  // Breathing cycle timer (4-4-4-4)
  useEffect(() => {
    if (!isBreathingActive) return;

    const interval = setInterval(() => {
      setBreathSeconds((prev) => {
        if (prev > 1) return prev - 1;

        // Switch phase
        setBreathPhase((current) => {
          if (current === 'Inhale') return 'Hold';
          if (current === 'Hold') return 'Exhale';
          if (current === 'Exhale') return 'Rest';
          return 'Inhale';
        });
        return 4;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isBreathingActive]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '20px',
    }}>
      <div className="glass-panel-elevated" style={{
        width: '100%',
        maxWidth: '780px',
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
              background: 'rgba(244, 63, 94, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <HeartHandshake size={18} color="#f43f5e" />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 600 }}>Emotional Reflection & Care</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                Mindful regulation, calming coping exercises, and compassionate journaling.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 24px',
          background: 'rgba(255, 255, 255, 0.02)',
        }}>
          <button
            onClick={() => setActiveTab('breathing')}
            style={{
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'breathing' ? '2px solid #f43f5e' : '2px solid transparent',
              color: activeTab === 'breathing' ? '#f43f5e' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Wind size={15} /> Box Breathing Pacer
          </button>
          <button
            onClick={() => setActiveTab('grounding')}
            style={{
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'grounding' ? '2px solid #f43f5e' : '2px solid transparent',
              color: activeTab === 'grounding' ? '#f43f5e' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Compass size={15} /> Sensory Grounding
          </button>
          <button
            onClick={() => setActiveTab('prompts')}
            style={{
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'prompts' ? '2px solid #f43f5e' : '2px solid transparent',
              color: activeTab === 'prompts' ? '#f43f5e' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <BookOpen size={15} /> Reflection Prompts
          </button>
        </div>

        {/* Tab Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          
          {/* TAB 1: BOX BREATHING PACER */}
          {activeTab === 'breathing' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '24px' }}>
              <div>
                <h4 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>4-4-4-4 Box Breathing</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '480px', margin: '4px auto 0' }}>
                  A nervous system regulation technique to slow heart rate, relieve tension, and quiet anxiety.
                </p>
              </div>

              {/* Animated Pacer Visual Circle */}
              <div style={{
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                border: `3px solid ${isBreathingActive ? '#f43f5e' : 'rgba(255,255,255,0.1)'}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle, rgba(244,63,94,0.15) 0%, transparent 70%)',
                boxShadow: isBreathingActive ? '0 0 35px rgba(244, 63, 94, 0.4)' : 'none',
                transform: isBreathingActive && (breathPhase === 'Inhale' || breathPhase === 'Hold') ? 'scale(1.2)' : 'scale(1)',
                transition: 'transform 4s ease-in-out, border-color 0.4s ease',
              }}>
                <span style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
                  {isBreathingActive ? breathPhase : 'Ready'}
                </span>
                <span style={{ fontSize: '32px', fontWeight: 800, color: '#f43f5e', marginTop: '4px' }}>
                  {isBreathingActive ? breathSeconds : '4'}
                </span>
              </div>

              {/* Controls */}
              <button
                onClick={() => {
                  setIsBreathingActive(!isBreathingActive);
                  setBreathPhase('Inhale');
                  setBreathSeconds(4);
                }}
                className="btn btn-primary"
                style={{
                  background: isBreathingActive ? 'rgba(244, 63, 94, 0.8)' : 'var(--gradient-brand)',
                  padding: '10px 24px',
                  fontSize: '14px',
                }}
              >
                {isBreathingActive ? (
                  <>
                    <Square size={16} /> Stop Pacer
                  </>
                ) : (
                  <>
                    <Play size={16} /> Start Guided Breathing
                  </>
                )}
              </button>

              {/* Step Explanations */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '10px',
                width: '100%',
                marginTop: '10px',
              }}>
                {[
                  { step: '1', title: 'Inhale', desc: 'Slowly through nose (4s)' },
                  { step: '2', title: 'Hold', desc: 'Gently retain air (4s)' },
                  { step: '3', title: 'Exhale', desc: 'Smoothly through mouth (4s)' },
                  { step: '4', title: 'Rest', desc: 'Empty lungs pause (4s)' },
                ].map((s) => (
                  <div
                    key={s.step}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '12px',
                    }}
                  >
                    <div style={{ fontSize: '11px', color: '#f43f5e', fontWeight: 700 }}>STEP {s.step}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginTop: '2px' }}>{s.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: GROUNDING & COPING */}
          {activeTab === 'grounding' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '18px',
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
                  5-4-3-2-1 Sensory Grounding Technique
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  Anchor your mind back into the physical present moment by engaging each sense:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div>👀 <strong>5 things you can SEE</strong> (a light, an object on your desk, texture of the wall)</div>
                  <div>✋ <strong>4 things you can TOUCH</strong> (your shirt fabric, the desk surface, your hands)</div>
                  <div>👂 <strong>3 things you can HEAR</strong> (ambient hum, birds outside, your own breath)</div>
                  <div>👃 <strong>2 things you can SMELL</strong> (tea, fresh air, wood)</div>
                  <div>👅 <strong>1 thing you can TASTE</strong> (a sip of water, gum, or mint)</div>
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '18px',
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
                  Thought Defusion & Reframing
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  When self-critical thoughts appear, replace <em>"I am a failure"</em> with <em>"I am having the thought that this feels difficult today."</em>
                </p>
                <button
                  onClick={() => {
                    onUsePrompt("Can you help me gently reframe a negative thought I've been having about myself today?");
                    onClose();
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px' }}
                >
                  <Sparkles size={14} color="#f43f5e" />
                  <span>Start Thought Reframing Chat</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PROMPTS */}
          {activeTab === 'prompts' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Select any prompt to send directly into the chat for supportive AI reflection:
              </p>
              {resources?.reflection_prompts.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: '#f43f5e', fontWeight: 700, textTransform: 'uppercase' }}>
                      {p.category}
                    </span>
                    <h5 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', margin: '2px 0' }}>{p.title}</h5>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>"{p.prompt}"</p>
                  </div>
                  <button
                    onClick={() => {
                      onUsePrompt(p.prompt);
                      onClose();
                    }}
                    className="btn btn-primary"
                    style={{ padding: '6px 12px', fontSize: '12px', flexShrink: 0 }}
                  >
                    Use in Chat
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Emergency Safety Resources Banner */}
          <div style={{
            marginTop: '24px',
            background: 'rgba(244, 63, 94, 0.08)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}>
            <PhoneCall size={20} color="#f43f5e" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '12px', color: '#fecdd3', lineHeight: 1.5 }}>
              <strong>24/7 Crisis & Immediate Support:</strong> If you or someone you know is in distress or experiencing thoughts of suicide, call or text <strong>988</strong> (US & Canada), or text <strong>HOME</strong> to <strong>741741</strong> for the Crisis Text Line.
              <div style={{ color: 'var(--text-dim)', marginTop: '4px' }}>
                *This AI tool provides compassionate conversation and reflection exercises, but does not provide clinical therapy or medical diagnosis.*
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
