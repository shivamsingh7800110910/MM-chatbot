import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Plus,
  RefreshCw,
  Download,
  HelpCircle,
  X,
  CheckCircle2,
  FileCode,
  Layers,
} from 'lucide-react';
import { DocumentItem } from '../types';
import { api } from '../services/api';

interface DocumentHubProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentItem[];
  onRefreshDocuments: () => void;
}

export const DocumentHub: React.FC<DocumentHubProps> = ({
  isOpen,
  onClose,
  documents,
  onRefreshDocuments,
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'create' | 'revise' | 'ask'>('library');

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Create state
  const [createTitle, setCreateTitle] = useState('');
  const [createPrompt, setCreatePrompt] = useState('');
  const [createFormat, setCreateFormat] = useState('md');
  const [isCreating, setIsCreating] = useState(false);

  // Revise state
  const [reviseDocId, setReviseDocId] = useState<string>('');
  const [reviseInstructions, setReviseInstructions] = useState('');
  const [isRevising, setIsRevising] = useState(false);

  // Ask state
  const [askDocId, setAskDocId] = useState<string>('');
  const [askQuestion, setAskQuestion] = useState('');
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  if (!isOpen) return null;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    setIsUploading(true);
    try {
      await api.uploadDocument(uploadFile, uploadTitle.trim() || undefined);
      setUploadFile(null);
      setUploadTitle('');
      onRefreshDocuments();
      setActiveTab('library');
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim() || !createPrompt.trim()) return;

    setIsCreating(true);
    try {
      await api.createDocument(createTitle.trim(), createPrompt.trim(), createFormat);
      setCreateTitle('');
      setCreatePrompt('');
      onRefreshDocuments();
      setActiveTab('library');
    } catch (err: any) {
      alert(`Document creation error: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviseDocId || !reviseInstructions.trim()) return;

    setIsRevising(true);
    try {
      await api.reviseDocument(reviseDocId, reviseInstructions.trim());
      setReviseInstructions('');
      onRefreshDocuments();
      setActiveTab('library');
    } catch (err: any) {
      alert(`Document revision error: ${err.message}`);
    } finally {
      setIsRevising(false);
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!askDocId || !askQuestion.trim()) return;

    setIsAsking(true);
    setAskAnswer(null);
    try {
      const res = await api.askDocument(askDocId, askQuestion.trim());
      setAskAnswer(res.answer);
    } catch (err: any) {
      setAskAnswer(`Error: ${err.message}`);
    } finally {
      setIsAsking(false);
    }
  };

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
              background: 'rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <FileText size={18} color="#10b981" />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 600 }}>Document & Knowledge Hub</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                Upload files, perform vector RAG search, generate content, and manage revisions.
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
            onClick={() => setActiveTab('library')}
            style={{
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'library' ? '2px solid #10b981' : '2px solid transparent',
              color: activeTab === 'library' ? '#10b981' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Library ({documents.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            style={{
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'create' ? '2px solid #10b981' : '2px solid transparent',
              color: activeTab === 'create' ? '#10b981' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Create from Prompt
          </button>
          <button
            onClick={() => setActiveTab('revise')}
            style={{
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'revise' ? '2px solid #10b981' : '2px solid transparent',
              color: activeTab === 'revise' ? '#10b981' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Revise (Versioning)
          </button>
          <button
            onClick={() => setActiveTab('ask')}
            style={{
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'ask' ? '2px solid #10b981' : '2px solid transparent',
              color: activeTab === 'ask' ? '#10b981' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Direct RAG Q&A
          </button>
        </div>

        {/* Tab Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          
          {/* TAB 1: LIBRARY */}
          {activeTab === 'library' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Upload Card */}
              <form onSubmit={handleUpload} style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px dashed var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                    Upload New Document (PDF, DOCX, TXT, MD, CSV)
                  </span>
                  <label className="btn btn-secondary" style={{ cursor: 'pointer', fontSize: '12px' }}>
                    <Upload size={14} />
                    <span>{uploadFile ? uploadFile.name : 'Choose File'}</span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.txt,.md,.csv,.json"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                {uploadFile && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="Custom Title (Optional)"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      style={{
                        flex: 1,
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="btn btn-primary"
                      style={{ fontSize: '13px' }}
                    >
                      {isUploading ? 'Chunking & Indexing...' : 'Upload & Index'}
                    </button>
                  </div>
                )}
              </form>

              {/* Documents List */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600 }}>Indexed Documents</h4>
                  <button onClick={onRefreshDocuments} className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '12px' }}>
                    <RefreshCw size={13} /> Refresh
                  </button>
                </div>

                {documents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)', fontSize: '14px' }}>
                    No documents uploaded yet. Upload a PDF, Word document, or text file above!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          padding: '12px 16px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                          <FileCode size={20} color="#10b981" />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{doc.title}</span>
                              <span style={{
                                fontSize: '11px',
                                background: 'rgba(99, 102, 241, 0.15)',
                                color: '#a5b4fc',
                                padding: '1px 6px',
                                borderRadius: '4px',
                              }}>
                                v{doc.version}
                              </span>
                              {doc.is_generated && (
                                <span style={{
                                  fontSize: '10px',
                                  background: 'rgba(236, 72, 153, 0.15)',
                                  color: '#f472b6',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                }}>
                                  AI Generated
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                              {doc.file_type.toUpperCase()} • {(doc.file_size / 1024).toFixed(1)} KB • {doc.chunk_count || 0} chunks indexed
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setAskDocId(doc.id);
                              setActiveTab('ask');
                            }}
                            className="btn btn-ghost"
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            title="Ask grounded question"
                          >
                            <HelpCircle size={14} /> Ask
                          </button>

                          <button
                            onClick={() => {
                              setReviseDocId(doc.id);
                              setActiveTab('revise');
                            }}
                            className="btn btn-ghost"
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            title="Propose versioned revision"
                          >
                            <Layers size={14} /> Revise
                          </button>

                          <a
                            href={api.getDocumentDownloadUrl(doc.id)}
                            download={doc.filename}
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '12px', textDecoration: 'none' }}
                            title="Download file"
                          >
                            <Download size={14} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CREATE FROM PROMPT */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Document Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cloud Architecture Specification"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Natural Language Generation Instructions
                </label>
                <textarea
                  rows={6}
                  placeholder="Describe the sections, topics, architecture, or requirements you want the AI to draft..."
                  value={createPrompt}
                  onChange={(e) => setCreatePrompt(e.target.value)}
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
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Format:</span>
                  <select
                    value={createFormat}
                    onChange={(e) => setCreateFormat(e.target.value)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '6px',
                      color: '#fff',
                      padding: '6px 10px',
                      outline: 'none',
                    }}
                  >
                    <option value="md">Markdown (.md)</option>
                    <option value="txt">Plain Text (.txt)</option>
                    <option value="docx">Word (.docx)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="btn btn-primary"
                  style={{ padding: '10px 20px' }}
                >
                  <Plus size={16} />
                  <span>{isCreating ? 'Generating Document...' : 'Generate & Save Document'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: REVISE DOCUMENT */}
          {activeTab === 'revise' && (
            <form onSubmit={handleRevise} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Select Document to Revise
                </label>
                <select
                  value={reviseDocId}
                  onChange={(e) => setReviseDocId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                >
                  <option value="">-- Choose a document --</option>
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} (Current: v{d.version})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Revision Instructions (Original is preserved; this creates a new version)
                </label>
                <textarea
                  rows={6}
                  placeholder="e.g. Summarize the introduction into 3 key takeaways and add a new section on testing strategy..."
                  value={reviseInstructions}
                  onChange={(e) => setReviseInstructions(e.target.value)}
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
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={isRevising || !reviseDocId}
                  className="btn btn-primary"
                  style={{ padding: '10px 20px' }}
                >
                  <Layers size={16} />
                  <span>{isRevising ? 'Drafting Revision...' : 'Generate New Version (v+1)'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: DIRECT RAG Q&A */}
          {activeTab === 'ask' && (
            <form onSubmit={handleAsk} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Select Target Knowledge Document
                </label>
                <select
                  value={askDocId}
                  onChange={(e) => setAskDocId(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                >
                  <option value="">-- Choose a document --</option>
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} (v{d.version})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                  Question for Document
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="e.g. What are the key deliverables listed in the schedule?"
                    value={askQuestion}
                    onChange={(e) => setAskQuestion(e.target.value)}
                    required
                    style={{
                      flex: 1,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: '#fff',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isAsking || !askDocId}
                    className="btn btn-primary"
                    style={{ padding: '10px 18px' }}
                  >
                    {isAsking ? 'Searching...' : 'Ask RAG'}
                  </button>
                </div>
              </div>

              {askAnswer && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.06)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  marginTop: '10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                    <CheckCircle2 size={16} /> Grounded Document Answer:
                  </div>
                  <div className="prose" style={{ color: '#f8fafc', whiteSpace: 'pre-wrap' }}>
                    {askAnswer}
                  </div>
                </div>
              )}
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
