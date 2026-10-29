import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ChatInput } from './components/ChatInput';
import { DocumentHub } from './components/DocumentHub';
import { EmotionalSupportModal } from './components/EmotionalSupportModal';
import { SettingsModal } from './components/SettingsModal';
import { ImageStudioModal } from './components/ImageStudioModal';
import { LanguageHubModal } from './components/LanguageHubModal';
import { Conversation, Message, AppMode, DocumentItem, HealthStatus, Attachment, GeneratedImageResult } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMode, setCurrentMode] = useState<AppMode>('standard');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [isDocHubOpen, setIsDocHubOpen] = useState(false);
  const [isEmotionalOpen, setIsEmotionalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImageStudioOpen, setIsImageStudioOpen] = useState(false);
  const [isLanguageHubOpen, setIsLanguageHubOpen] = useState(false);

  // Initial load
  useEffect(() => {
    loadHealth();
    loadDocuments();
    loadConversations();
  }, []);

  const loadHealth = async () => {
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch (e) {
      console.warn('Backend offline or health check failed:', e);
    }
  };

  const loadDocuments = async () => {
    try {
      const docs = await api.getDocuments();
      setDocuments(docs);
    } catch (e) {
      console.warn('Failed to load documents:', e);
    }
  };

  const loadConversations = async () => {
    try {
      const list = await api.getConversations();
      setConversations(list);
      if (list.length > 0 && !activeConversationId) {
        selectConversation(list[0].id);
      } else if (list.length === 0) {
        handleNewConversation();
      }
    } catch (e) {
      console.warn('Failed to load conversations:', e);
    }
  };

  const selectConversation = async (id: string) => {
    setActiveConversationId(id);
    try {
      const conv = await api.getConversation(id);
      setMessages(conv.messages || []);
      setCurrentMode(conv.mode || 'standard');
    } catch (e) {
      console.error('Failed to load conversation details:', e);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await api.createConversation('New Conversation', currentMode);
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setMessages([]);
    } catch (e) {
      console.error('Failed to create new conversation:', e);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await api.deleteConversation(id);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);
      if (activeConversationId === id) {
        if (remaining.length > 0) {
          selectConversation(remaining[0].id);
        } else {
          setActiveConversationId(null);
          setMessages([]);
          handleNewConversation();
        }
      }
    } catch (e) {
      console.error('Failed to delete conversation:', e);
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      const updated = await api.updateConversation(id, { title: newTitle });
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: updated.title } : c)));
    } catch (e) {
      console.error('Failed to rename conversation:', e);
    }
  };

  const handleSendMessage = async (params: {
    message: string;
    attachments: Attachment[];
    enableSearch: boolean;
    enableRAG: boolean;
    documentId?: string;
    synthesizeSpeech: boolean;
  }) => {
    setIsLoading(true);

    // Optimistic user message insertion
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConversationId || '',
      role: 'user',
      content: params.message,
      attachments: params.attachments,
      citations: [],
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const response = await api.sendMessage({
        conversation_id: activeConversationId || undefined,
        message: params.message,
        mode: currentMode,
        attachments: params.attachments,
        enable_search: params.enableSearch,
        enable_rag: params.enableRAG,
        document_id: params.documentId,
        synthesize_speech: params.synthesizeSpeech,
      });

      // Update active conversation id if it was newly created
      if (!activeConversationId || activeConversationId !== response.conversation_id) {
        setActiveConversationId(response.conversation_id);
      }

      const asstMsg: Message = {
        id: response.message_id,
        conversation_id: response.conversation_id,
        role: 'assistant',
        content: response.content,
        attachments: response.attachments,
        citations: response.citations,
        created_at: new Date().toISOString(),
        audio_base64: response.audio_base64,
      };

      setMessages((prev) => [...prev, asstMsg]);

      // If speech synthesis audio returned and requested, play immediately
      if (params.synthesizeSpeech && response.audio_base64) {
        try {
          const audio = new Audio(response.audio_base64);
          audio.play();
        } catch (audioErr) {
          console.warn('Autoplay error:', audioErr);
        }
      }

      // Refresh conversations list to update titles/timestamps
      api.getConversations().then(setConversations).catch(console.error);
    } catch (err: any) {
      console.error('Error sending message:', err);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        conversation_id: activeConversationId || '',
        role: 'assistant',
        content: `⚠️ Error processing request: ${err.message || 'Please check your connection and try again.'}`,
        attachments: [],
        citations: [],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendImageToChat = (imageResult: GeneratedImageResult) => {
    const newAttachment: Attachment = {
      name: `AI Art (${imageResult.style})`,
      type: 'image',
      url: imageResult.data_url || imageResult.image_url,
    };
    handleSendMessage({
      message: `🎨 Generated AI Image: "${imageResult.prompt}" (Style: ${imageResult.style}, Aspect Ratio: ${imageResult.aspect_ratio}). What are your thoughts or suggestions?`,
      attachments: [newAttachment],
      enableSearch: false,
      enableRAG: false,
      synthesizeSpeech: false,
    });
  };

  const handleSendLanguageToChat = (text: string) => {
    handleSendMessage({
      message: text,
      attachments: [],
      enableSearch: false,
      enableRAG: false,
      synthesizeSpeech: false,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Header */}
      <Header
        currentMode={currentMode}
        onSelectMode={(mode) => {
          setCurrentMode(mode);
          if (activeConversationId) {
            api.updateConversation(activeConversationId, { mode }).catch(console.error);
          }
        }}
        onOpenDocuments={() => setIsDocHubOpen(true)}
        onOpenEmotional={() => setIsEmotionalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenImageStudio={() => setIsImageStudioOpen(true)}
        onOpenLanguageHub={() => setIsLanguageHubOpen(true)}
        health={health}
      />

      {/* Main Layout Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelectConversation={selectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
        />

        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 61px)',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(30, 41, 59, 0.4) 0%, rgba(7, 9, 14, 0.95) 75%)',
        }}>
          <ChatArea
            messages={messages}
            isLoading={isLoading}
            activeMode={currentMode}
            onOpenImageStudio={() => setIsImageStudioOpen(true)}
            onOpenLanguageHub={() => setIsLanguageHubOpen(true)}
            onSendPresetMessage={(preset) => {
              handleSendMessage({
                message: preset,
                attachments: [],
                enableSearch: currentMode === 'search',
                enableRAG: currentMode === 'rag',
                synthesizeSpeech: false,
              });
            }}
          />

          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            currentMode={currentMode}
            documents={documents}
            onOpenImageStudio={() => setIsImageStudioOpen(true)}
            onOpenLanguageHub={() => setIsLanguageHubOpen(true)}
          />
        </main>
      </div>

      {/* Modals */}
      <ImageStudioModal
        isOpen={isImageStudioOpen}
        onClose={() => setIsImageStudioOpen(false)}
        onSendToChat={handleSendImageToChat}
      />

      <LanguageHubModal
        isOpen={isLanguageHubOpen}
        onClose={() => setIsLanguageHubOpen(false)}
        onSendToChat={handleSendLanguageToChat}
      />

      <DocumentHub
        isOpen={isDocHubOpen}
        onClose={() => setIsDocHubOpen(false)}
        documents={documents}
        onRefreshDocuments={loadDocuments}
      />

      <EmotionalSupportModal
        isOpen={isEmotionalOpen}
        onClose={() => setIsEmotionalOpen(false)}
        onUsePrompt={(prompt) => {
          setCurrentMode('emotional');
          handleSendMessage({
            message: prompt,
            attachments: [],
            enableSearch: false,
            enableRAG: false,
            synthesizeSpeech: false,
          });
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        health={health}
      />
    </div>
  );
};

export default App;
