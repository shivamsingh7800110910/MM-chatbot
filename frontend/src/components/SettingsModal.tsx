import React from 'react';
import { Settings as SettingsIcon, X, Database, Cpu, Globe, Key } from 'lucide-react';
import { HealthStatus } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  health: HealthStatus | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  health,
}) => {
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
        maxWidth: '560px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SettingsIcon size={18} color="#818cf8" />
            <h3 style={{ fontSize: '16px', fontWeight: 600 }}>System Configuration & Settings</h3>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Status summary */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              System Diagnostics
            </h4>

            {/* Database */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                <Database size={15} /> Database Engine:
              </span>
              <span style={{ fontWeight: 600, color: '#34d399' }}>
                {health?.database.engine === 'sqlite' ? 'SQLite (Zero-Config)' : 'PostgreSQL + pgvector'}
              </span>
            </div>

            {/* Primary LLM */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                <Cpu size={15} /> Primary AI Provider:
              </span>
              <span style={{ fontWeight: 600, color: '#818cf8' }}>
                {health?.providers.gemini_configured
                  ? 'Gemini 3.8 Flash (Active)'
                  : health?.providers.openai_configured
                  ? 'OpenAI GPT-4o (Active)'
                  : 'Smart Intelligent Fallback (Zero-Cost Mode)'}
              </span>
            </div>

            {/* Web Search */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                <Globe size={15} /> Web Search Engine:
              </span>
              <span style={{ fontWeight: 600, color: '#06b6d4' }}>
                {health?.providers.tavily_configured ? 'Tavily Search API' : 'DuckDuckGo Instant Engine'}
              </span>
            </div>
          </div>

          {/* Guide to add keys */}
          <div style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            fontSize: '13px',
            lineHeight: 1.5,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a5b4fc', fontWeight: 600, marginBottom: '6px' }}>
              <Key size={15} /> Setting Up API Keys:
            </div>
            <p style={{ color: 'var(--text-muted)' }}>
              To activate Google Gemini 3.8 Flash live generative responses, open your local <code>.env</code> file in the project root:
            </p>
            <pre style={{
              background: '#07090e',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#34d399',
              marginTop: '6px',
              fontFamily: 'var(--font-mono)',
            }}>
              GEMINI_API_KEY="AIzaSy..."
            </pre>
            <p style={{ color: 'var(--text-dim)', fontSize: '12px', marginTop: '6px' }}>
              Get your free API key at <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" style={{ color: '#818cf8' }}>aistudio.google.com</a>.
            </p>
          </div>

          {/* Docker tip */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            fontSize: '13px',
          }}>
            <div style={{ fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
              PostgreSQL + pgvector Docker Setup:
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              Run <code>docker compose up -d</code> to start the dedicated pgvector database container. The backend will automatically connect!
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
