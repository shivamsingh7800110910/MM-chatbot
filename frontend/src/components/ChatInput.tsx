import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Image as ImageIcon,
  Mic,
  MicOff,
  Globe,
  FileText,
  X,
  Volume2,
  Palette,
  Languages,
} from 'lucide-react';
import { Attachment, AppMode, DocumentItem } from '../types';
import { api } from '../services/api';

interface ChatInputProps {
  onSendMessage: (params: {
    message: string;
    attachments: Attachment[];
    enableSearch: boolean;
    enableRAG: boolean;
    documentId?: string;
    synthesizeSpeech: boolean;
  }) => void;
  isLoading: boolean;
  currentMode: AppMode;
  documents: DocumentItem[];
  onOpenImageStudio?: () => void;
  onOpenLanguageHub?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  currentMode,
  documents,
  onOpenImageStudio,
  onOpenLanguageHub,
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [enableSearch, setEnableSearch] = useState(currentMode === 'search');
  const [enableRAG, setEnableRAG] = useState(currentMode === 'rag');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [synthesizeSpeech, setSynthesizeSpeech] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync with mode changes
  useEffect(() => {
    if (currentMode === 'search') setEnableSearch(true);
    if (currentMode === 'rag') setEnableRAG(true);
  }, [currentMode]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordingSeconds(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        try {
          // Transcribe via backend
          const transcribedText = await api.transcribeAudio(audioBlob, 'recording.webm');
          if (transcribedText) {
            setText((prev) => (prev ? `${prev} ${transcribedText}` : transcribedText));
          }
        } catch (err) {
          console.error('Failed to transcribe audio:', err);
          alert('Could not transcribe audio. Check that your microphone and backend are connected.');
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Microphone permission denied or not supported by browser.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: 'image',
            url: reader.result as string,
            size: file.size,
          },
        ]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;

    onSendMessage({
      message: trimmed || 'Analyze attachment',
      attachments,
      enableSearch,
      enableRAG: enableRAG || Boolean(selectedDocId),
      documentId: selectedDocId || undefined,
      synthesizeSpeech,
    });

    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      padding: '16px 20px',
      background: 'rgba(7, 9, 14, 0.95)',
      borderTop: '1px solid var(--border-subtle)',
      backdropFilter: 'blur(16px)',
    }}>
      <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* Attachment preview pills */}
        {attachments.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {attachments.map((att, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '4px 8px',
                  fontSize: '12px',
                }}
              >
                {att.type === 'image' && (
                  <img
                    src={att.url}
                    alt={att.name}
                    style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px' }}
                  />
                )}
                <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {att.name}
                </span>
                <button
                  onClick={() => removeAttachment(idx)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Recording active banner */}
        {isRecording && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 14px',
            fontSize: '13px',
            color: '#fda4af',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="recording-indicator" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f43f5e' }} />
              <span>Recording audio... 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}</span>
            </div>
            <button
              onClick={handleStopRecording}
              className="btn btn-primary"
              style={{ padding: '4px 10px', fontSize: '12px', background: '#f43f5e' }}
            >
              Stop & Transcribe
            </button>
          </div>
        )}

        {/* Input box */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '10px',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '10px 14px',
          transition: 'border-color 0.2s ease',
        }}>
          {/* Text Area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              currentMode === 'emotional'
                ? "Share what's on your mind or how you're feeling today..."
                : currentMode === 'rag'
                ? 'Ask a question grounded in your uploaded documents...'
                : 'Message multimodal assistant (text, attach images, or speak)...'
            }
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-main)',
              fontSize: '14px',
              fontFamily: 'var(--font-sans)',
              resize: 'none',
              lineHeight: 1.5,
              maxHeight: '180px',
            }}
          />

          {/* Action buttons inside input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Image Studio generator trigger */}
            {onOpenImageStudio && (
              <button
                type="button"
                onClick={onOpenImageStudio}
                className="btn btn-ghost"
                style={{ padding: '6px', borderRadius: 'var(--radius-md)', color: '#f472b6' }}
                title="Open AI Image Studio (Text-to-Image synthesis)"
              >
                <Palette size={18} />
              </button>
            )}

            {/* Language Hub trigger */}
            {onOpenLanguageHub && (
              <button
                type="button"
                onClick={onOpenLanguageHub}
                className="btn btn-ghost"
                style={{ padding: '6px', borderRadius: 'var(--radius-md)', color: '#67e8f9' }}
                title="Open Language Intelligence & Translation Hub"
              >
                <Languages size={18} />
              </button>
            )}

            {/* Image Upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              multiple
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-ghost"
              style={{ padding: '6px', borderRadius: 'var(--radius-md)' }}
              title="Attach image for visual understanding"
            >
              <ImageIcon size={18} />
            </button>

            {/* Microphone STT */}
            <button
              type="button"
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className="btn btn-ghost"
              style={{
                padding: '6px',
                borderRadius: 'var(--radius-md)',
                color: isRecording ? '#f43f5e' : undefined,
              }}
              title={isRecording ? 'Stop recording' : 'Record voice (Speech-to-Text)'}
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Send button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={isLoading || (!text.trim() && attachments.length === 0)}
              className="btn btn-primary"
              style={{ padding: '8px 14px', borderRadius: 'var(--radius-md)' }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>

        {/* Feature toggles row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Web Search toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: enableSearch ? '#06b6d4' : 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={enableSearch}
                onChange={(e) => setEnableSearch(e.target.checked)}
                style={{ accentColor: '#06b6d4' }}
              />
              <Globe size={13} />
              <span>Web Search</span>
            </label>

            {/* Document RAG toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: enableRAG ? '#10b981' : 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={enableRAG}
                onChange={(e) => setEnableRAG(e.target.checked)}
                style={{ accentColor: '#10b981' }}
              />
              <FileText size={13} />
              <span>RAG Knowledge</span>
            </label>

            {/* Document selector dropdown */}
            {documents.length > 0 && (
              <select
                value={selectedDocId}
                onChange={(e) => {
                  setSelectedDocId(e.target.value);
                  if (e.target.value) setEnableRAG(true);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                  color: 'var(--text-main)',
                  fontSize: '11px',
                  padding: '2px 8px',
                  outline: 'none',
                }}
              >
                <option value="">All Uploaded Documents</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    📄 {d.title} (v{d.version})
                  </option>
                ))}
              </select>
            )}

            {/* TTS Audio reply toggle */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: synthesizeSpeech ? '#ec4899' : 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={synthesizeSpeech}
                onChange={(e) => setSynthesizeSpeech(e.target.checked)}
                style={{ accentColor: '#ec4899' }}
              />
              <Volume2 size={13} />
              <span>Spoken Reply</span>
            </label>
          </div>

          <div style={{ color: 'var(--text-dim)', fontSize: '11px' }}>
            Press <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 5px', borderRadius: '3px' }}>Enter</kbd> to send, <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 5px', borderRadius: '3px' }}>Shift + Enter</kbd> for newline
          </div>
        </div>

      </div>
    </div>
  );
};
