import React from 'react';
import { Sparkles, FileText, HeartHandshake, Settings as SettingsIcon, Globe, Palette, Languages } from 'lucide-react';
import { AppMode, HealthStatus } from '../types';

interface HeaderProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  onOpenDocuments: () => void;
  onOpenEmotional: () => void;
  onOpenSettings: () => void;
  onOpenImageStudio: () => void;
  onOpenLanguageHub: () => void;
  health: HealthStatus | null;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  onOpenDocuments,
  onOpenEmotional,
  onOpenSettings,
  onOpenImageStudio,
  onOpenLanguageHub,
  health,
}) => {
  const getModeBadge = (mode: AppMode) => {
    switch (mode) {
      case 'emotional':
        return <span className="badge badge-emotional"><HeartHandshake size={14} /> Emotional Mode</span>;
      case 'rag':
        return <span className="badge badge-rag"><FileText size={14} /> Document RAG</span>;
      case 'search':
        return <span className="badge badge-search"><Globe size={14} /> Web Grounded</span>;
      default:
        return <span className="badge badge-standard"><Sparkles size={14} /> Multimodal AI</span>;
    }
  };

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 24px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(7, 9, 14, 0.85)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 20,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'var(--gradient-brand)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-glow)',
        }}>
          <Sparkles size={20} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{
              fontSize: '17px',
              fontWeight: '700',
              background: 'linear-gradient(90deg, #ffffff 0%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}>
              Multimodal AI
            </h1>
            {getModeBadge(currentMode)}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '1px' }}>
            Vision • Audio • Documents • RAG • Web Search
          </p>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.04)',
        padding: '3px',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--border-subtle)',
      }}>
        <button
          className={`btn ${currentMode === 'standard' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '13px' }}
          onClick={() => onSelectMode('standard')}
        >
          <Sparkles size={14} /> Standard
        </button>
        <button
          className={`btn ${currentMode === 'rag' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '13px' }}
          onClick={() => onSelectMode('rag')}
        >
          <FileText size={14} /> RAG Knowledge
        </button>
        <button
          className={`btn ${currentMode === 'search' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '13px' }}
          onClick={() => onSelectMode('search')}
        >
          <Globe size={14} /> Web Search
        </button>
        <button
          className={`btn ${currentMode === 'emotional' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '13px' }}
          onClick={() => onSelectMode('emotional')}
        >
          <HeartHandshake size={14} /> Emotional
        </button>
      </div>

      {/* Controls & Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Health status pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          fontSize: '12px',
          color: '#34d399',
        }}>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 8px #10b981',
          }} />
          <span>{health?.database.engine === 'sqlite' ? 'SQLite Ready' : 'PostgreSQL + pgvector'}</span>
        </div>

        {/* Action Hub buttons */}
        <button
          className="btn btn-secondary"
          onClick={onOpenImageStudio}
          title="Multimodal AI Image Studio (Text-to-Image synthesis)"
          style={{
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
            borderColor: 'rgba(236, 72, 153, 0.35)',
            color: '#f472b6',
          }}
        >
          <Palette size={15} />
          <span>Image Studio</span>
        </button>

        <button
          className="btn btn-secondary"
          onClick={onOpenLanguageHub}
          title="Language Hub (Polyglot Translator, Grammar Coach & Tone Analysis)"
          style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
            borderColor: 'rgba(6, 182, 212, 0.35)',
            color: '#67e8f9',
          }}
        >
          <Languages size={15} />
          <span>Languages</span>
        </button>

        <button className="btn btn-secondary" onClick={onOpenDocuments} title="Document Ingestion & Management">
          <FileText size={15} />
          <span>Documents</span>
        </button>

        <button className="btn btn-secondary" onClick={onOpenEmotional} title="Coping Exercises & Reflection">
          <HeartHandshake size={15} />
          <span>Reflections</span>
        </button>

        <button className="btn btn-ghost" onClick={onOpenSettings} title="Settings & Provider Config">
          <SettingsIcon size={16} />
        </button>
      </div>
    </header>
  );
};
