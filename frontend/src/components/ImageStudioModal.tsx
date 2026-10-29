import React, { useState } from 'react';
import {
  Sparkles,
  Palette,
  Download,
  MessageSquare,
  Copy,
  Check,
  X,
  Compass,
} from 'lucide-react';
import { GeneratedImageResult } from '../types';
import { api } from '../services/api';

interface ImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat: (imageResult: GeneratedImageResult) => void;
}

const PRESET_PROMPTS = [
  'A cyberpunk neon rainy alleyway with reflective wet asphalt and hovering drones',
  'A whimsical hillside cottage surrounded by glowing wildflowers in Studio Ghibli anime style',
  'An ultra-detailed macro photography of a jewel-like hummingbird drinking nectar from a vibrant flower',
  'A surreal floating crystal island with cascading waterfalls in space, cinematic 8k',
  'A cozy warmly-lit coffee shop in Paris on a rainy autumn evening, highly detailed watercolor',
  'A majestic golden dragon perched on an icy mountain peak under aurora borealis',
];

const STYLE_OPTIONS = [
  { id: 'realistic', label: 'Photorealistic', icon: '📸' },
  { id: 'anime', label: 'Anime / Ghibli', icon: '🌸' },
  { id: 'digital_art', label: 'Digital Art', icon: '🎨' },
  { id: 'cinematic', label: 'Cinematic Still', icon: '🎬' },
  { id: '3d_render', label: '3D Octane Render', icon: '🧊' },
  { id: 'watercolor', label: 'Watercolor', icon: '🖌️' },
  { id: 'cyberpunk', label: 'Cyberpunk Neon', icon: '⚡' },
];

const ASPECT_RATIOS = [
  { id: '1:1', label: 'Square (1:1)' },
  { id: '16:9', label: 'Landscape (16:9)' },
  { id: '9:16', label: 'Portrait (9:16)' },
  { id: '4:3', label: 'Classic (4:3)' },
];

export const ImageStudioModal: React.FC<ImageStudioModalProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImageResult | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const res = await api.generateImage({
        prompt: prompt.trim(),
        aspect_ratio: selectedRatio,
        style: selectedStyle,
      });
      setCurrentImage(res);
    } catch (err: any) {
      alert(`Image generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyPrompt = () => {
    if (currentImage) {
      navigator.clipboard.writeText(currentImage.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
        maxWidth: '960px',
        maxHeight: '92vh',
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
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(236, 72, 153, 0.4)',
            }}>
              <Palette size={18} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 600 }}>Multimodal AI Image Studio</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                State-of-the-art text-to-image synthesis with styles, custom aspect ratios, and instant chat integration.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Studio Body: Split View */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'row', gap: '24px', padding: '24px' }}>
          
          {/* Left Column: Controls & Prompt */}
          <form onSubmit={handleGenerate} style={{ flex: '1 1 50%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Prompt input */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Image Description / Creative Prompt
              </label>
              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your imagination in detail (e.g. subject, environment, lighting, mood)..."
                required
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  color: '#fff',
                  fontSize: '14px',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                  resize: 'none',
                  lineHeight: 1.5,
                }}
              />
            </div>

            {/* Quick Inspiration Presets */}
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                <Compass size={13} /> INSPIRATION PRESETS:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {PRESET_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(p)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-full)',
                      padding: '4px 10px',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    }}
                  >
                    {p.length > 42 ? `${p.substring(0, 42)}...` : p}
                  </button>
                ))}
              </div>
            </div>

            {/* Style Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                Visual Artistic Style
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                {STYLE_OPTIONS.map((style) => {
                  const isSelected = selectedStyle === style.id;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setSelectedStyle(style.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        background: isSelected ? 'rgba(236, 72, 153, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? '1px solid rgba(236, 72, 153, 0.6)' : '1px solid var(--border-subtle)',
                        color: isSelected ? '#f472b6' : 'var(--text-muted)',
                        fontSize: '12px',
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{style.icon}</span>
                      <span>{style.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                Aspect Ratio
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {ASPECT_RATIOS.map((ratio) => {
                  const isSelected = selectedRatio === ratio.id;
                  return (
                    <button
                      key={ratio.id}
                      type="button"
                      onClick={() => setSelectedRatio(ratio.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-full)',
                        background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? '1px solid rgba(99, 102, 241, 0.6)' : '1px solid var(--border-subtle)',
                        color: isSelected ? '#a5b4fc' : 'var(--text-muted)',
                        fontSize: '12px',
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                      }}
                    >
                      {ratio.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="btn btn-primary"
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #6366f1 100%)',
                marginTop: 'auto',
              }}
            >
              <Sparkles size={16} />
              <span>{isGenerating ? 'Rendering Artwork with AI...' : 'Generate AI Image'}</span>
            </button>
          </form>

          {/* Right Column: Preview & Gallery */}
          <div style={{
            flex: '1 1 50%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '12px',
            padding: '16px',
            minHeight: '380px',
            position: 'relative',
          }}>
            {isGenerating ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', textAlign: 'center' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  border: '3px solid transparent',
                  borderTopColor: '#ec4899',
                  borderRightColor: '#8b5cf6',
                  animation: 'spin 1s linear infinite',
                }} />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>Synthesizing Visual Art</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                    Applying diffusion model, volumetric lighting & aesthetic shaders...
                  </div>
                </div>
              </div>
            ) : currentImage ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  borderRadius: '8px',
                  background: '#05070a',
                }}>
                  <img
                    src={currentImage.data_url || currentImage.image_url}
                    alt={currentImage.prompt}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '360px',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                    }}
                  />
                </div>

                {/* Metadata & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                    Style: <strong style={{ color: '#fff' }}>{currentImage.style}</strong> • Ratio: <strong style={{ color: '#fff' }}>{currentImage.aspect_ratio}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={copyPrompt}
                      className="btn btn-ghost"
                      style={{ padding: '6px 10px', fontSize: '12px' }}
                      title="Copy prompt"
                    >
                      {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    </button>

                    <a
                      href={currentImage.data_url || currentImage.image_url}
                      download={`AI_Art_${currentImage.image_id.substring(0, 8)}.png`}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px', textDecoration: 'none' }}
                    >
                      <Download size={14} /> Download
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        onSendToChat(currentImage);
                        onClose();
                      }}
                      className="btn btn-primary"
                      style={{ padding: '6px 14px', fontSize: '12px', background: 'var(--gradient-brand)' }}
                    >
                      <MessageSquare size={14} /> Send to Chat
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '30px 20px' }}>
                <Palette size={42} style={{ opacity: 0.3, marginBottom: '12px' }} />
                <h4 style={{ fontSize: '15px', color: '#fff', fontWeight: 600 }}>Your Canvas Awaits</h4>
                <p style={{ fontSize: '13px', maxWidth: '320px', margin: '4px auto 0', lineHeight: 1.5 }}>
                  Enter a prompt on the left, pick a style and aspect ratio, and create vivid images with AI.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
