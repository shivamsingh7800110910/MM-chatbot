import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Search, Sparkles, HeartHandshake, FileText, Globe } from 'lucide-react';
import { Conversation, AppMode } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startEditing = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const saveEditing = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const getModeIcon = (mode: AppMode) => {
    switch (mode) {
      case 'emotional':
        return <HeartHandshake size={14} color="#f43f5e" />;
      case 'rag':
        return <FileText size={14} color="#10b981" />;
      case 'search':
        return <Globe size={14} color="#06b6d4" />;
      default:
        return <Sparkles size={14} color="#818cf8" />;
    }
  };

  return (
    <aside style={{
      width: '280px',
      minWidth: '280px',
      height: 'calc(100vh - 61px)',
      background: 'rgba(11, 15, 25, 0.95)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      gap: '14px',
    }}>
      {/* New Chat Button */}
      <button
        className="btn btn-primary"
        style={{ width: '100%', padding: '10px 16px', fontSize: '14px', borderRadius: 'var(--radius-md)' }}
        onClick={onNewConversation}
      >
        <Plus size={16} />
        <span>New Conversation</span>
      </button>

      {/* Search Input */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '7px 12px',
        background: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
      }}>
        <Search size={14} color="var(--text-dim)" />
        <input
          type="text"
          placeholder="Filter conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-main)',
            fontSize: '13px',
            width: '100%',
          }}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Conversation List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-dim)', fontSize: '13px' }}>
            {searchTerm ? 'No matching conversations' : 'No conversations yet.\nClick "New Conversation" to begin!'}
          </div>
        ) : (
          filtered.map((c) => {
            const isActive = c.id === activeId;
            const isEditing = c.id === editingId;

            return (
              <div
                key={c.id}
                onClick={() => onSelectConversation(c.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0, flex: 1 }}>
                  {getModeIcon(c.mode)}
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditing(c.id, e as any);
                        if (e.key === 'Escape') cancelEditing(e as any);
                      }}
                      autoFocus
                      style={{
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid var(--accent-primary)',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '13px',
                        padding: '2px 6px',
                        width: '100%',
                        outline: 'none',
                      }}
                    />
                  ) : (
                    <span style={{
                      fontSize: '13px',
                      color: isActive ? '#ffffff' : 'var(--text-muted)',
                      fontWeight: isActive ? 600 : 400,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {c.title}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {isEditing ? (
                    <>
                      <button
                        onClick={(e) => saveEditing(c.id, e)}
                        style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', padding: '2px' }}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={cancelEditing}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => startEditing(c, e)}
                        title="Rename"
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '3px' }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete conversation "${c.title}"?`)) {
                            onDeleteConversation(c.id);
                          }
                        }}
                        title="Delete"
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '3px' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div style={{
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: '12px',
        fontSize: '11px',
        color: 'var(--text-dim)',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>{conversations.length} conversation{conversations.length === 1 ? '' : 's'}</span>
        <span style={{ color: '#818cf8' }}>v1.0.0</span>
      </div>
    </aside>
  );
};
