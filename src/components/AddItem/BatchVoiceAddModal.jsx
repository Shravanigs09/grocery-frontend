// src/components/AddItem/BatchVoiceAddModal.jsx
// High-efficiency zero-friction multi-item voice & list parser modal
import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  X,
  Check,
  Trash2,
  FileText,
} from 'lucide-react';
import { parseMultiItemSpeechOrText } from '../../utils/foodDetection';
import { getSettings } from '../../store/useSettings';
import { playConfirmationChime } from '../../utils/sound';

const FOOD_EMOJIS = {
  Vegetables: '🥬',
  Dairy: '🥛',
  Fruit: '🍌',
  Meat: '🥩',
  Bakery: '🍞',
  Pantry: '🌾',
  Produce: '🥑',
};

export default function BatchVoiceAddModal({ isOpen, onClose, onAddItems }) {
  const [activeTab, setActiveTab] = useState('voice'); // 'voice' | 'paste'
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [parsedItems, setParsedItems] = useState([]);
  const [speechError, setSpeechError] = useState('');

  const recognitionRef = useRef(null);

  // Parse multi-item speech or text whenever transcript or paste changes
  useEffect(() => {
    const textToParse = activeTab === 'voice' ? transcript : pasteText;
    if (textToParse.trim()) {
      const items = parseMultiItemSpeechOrText(textToParse);
      setParsedItems(items);
    }
  }, [transcript, pasteText, activeTab]);

  // Clean up speech recognition on unmount or close
  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort?.();
      } catch {}
      recognitionRef.current = null;
    };
  }, []);

  if (!isOpen) return null;

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setSpeechError('Web Speech API is not supported in this browser. Please use the Paste tab.');
      return;
    }

    setSpeechError('');
    const settings = getSettings();
    const language = settings?.voiceInput?.speechLanguage || 'en-IN';

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }

      const recognition = new SR();
      recognition.lang = language;
      recognition.interimResults = true;
      recognition.continuous = true;
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let fullText = '';
        for (let i = 0; i < event.results.length; i++) {
          fullText += event.results[i][0].transcript + ' ';
        }
        setTranscript(fullText.trim());
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
        if (e.error === 'not-allowed') {
          setSpeechError('Microphone permission denied. Please allow microphone access.');
        } else if (e.error !== 'no-speech') {
          setSpeechError(`Voice error: ${e.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Recognition start error:', err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop?.();
    } catch {}
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const handleRemoveItem = (id) => {
    setParsedItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleQuantityChange = (id, delta) => {
    setParsedItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextQty = Math.max(0.5, (item.quantity || 1) + delta);
          return { ...item, quantity: nextQty };
        }
        return item;
      })
    );
  };

  const handleConfirmAddAll = () => {
    if (parsedItems.length === 0) return;
    playConfirmationChime();
    if (onAddItems) {
      onAddItems(parsedItems);
    }
    stopListening();
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          background: '#ffffff',
          borderRadius: 20,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', margin: 0 }}>
                Zero-Friction Batch Entry
              </h2>
              <p style={{ fontSize: 12.5, color: '#64748b', margin: '2px 0 0' }}>
                Speak or paste multiple groceries at once with automatic detection
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: 'none',
              background: '#f8fafc',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode Selector Tabs (Voice vs Paste) */}
        <div
          style={{
            display: 'flex',
            padding: '12px 24px 0',
            gap: 12,
            borderBottom: '1px solid #f1f5f9',
            background: '#fafbfc',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('voice')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'voice' ? '#16a34a' : '#64748b',
              fontSize: 13,
              fontWeight: activeTab === 'voice' ? 700 : 500,
              borderBottom: activeTab === 'voice' ? '2.5px solid #16a34a' : '2.5px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Mic size={15} />
            <span>Multi-Item Voice</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: 'transparent',
              color: activeTab === 'paste' ? '#16a34a' : '#64748b',
              fontSize: 13,
              fontWeight: activeTab === 'paste' ? 700 : 500,
              borderBottom: activeTab === 'paste' ? '2.5px solid #16a34a' : '2.5px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <FileText size={15} />
            <span>Paste Grocery List</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'voice' ? (
            /* ── VOICE RECORDER TAB ────────────────────────────────────────── */
            <div style={{ textAlign: 'center' }}>
              {/* Big Mic Button with Pulsing Wave */}
              <div style={{ position: 'relative', display: 'inline-block', margin: '14px 0' }}>
                {isListening && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: -10,
                      borderRadius: '50%',
                      background: 'rgba(22, 163, 74, 0.2)',
                      animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={toggleListening}
                  style={{
                    position: 'relative',
                    width: 76,
                    height: 76,
                    borderRadius: '50%',
                    background: isListening
                      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                      : 'linear-gradient(135deg, #16a34a, #15803d)',
                    color: '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: isListening
                      ? '0 8px 24px rgba(239, 68, 68, 0.35)'
                      : '0 8px 24px rgba(22, 163, 74, 0.35)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isListening ? <MicOff size={32} /> : <Mic size={32} />}
                </button>
              </div>

              <div style={{ fontSize: 14, fontWeight: 700, color: isListening ? '#dc2626' : '#1e293b' }}>
                {isListening ? 'Listening… speak multiple items naturally' : 'Tap microphone to start speaking'}
              </div>

              <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                Example: <em>"I bought two liters of milk, 1 kilo tomatoes, and a loaf of bread"</em>
              </p>

              {speechError && (
                <div style={{ marginTop: 10, padding: '8px 12px', background: '#fee2e2', borderRadius: 8, color: '#dc2626', fontSize: 12 }}>
                  {speechError}
                </div>
              )}

              {/* Real-time transcript box */}
              {transcript && (
                <div
                  style={{
                    marginTop: 14,
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    fontSize: 13,
                    color: '#334155',
                    textAlign: 'left',
                    maxHeight: 60,
                    overflowY: 'auto',
                  }}
                >
                  <strong style={{ color: '#16a34a' }}>Transcript: </strong> {transcript}
                </div>
              )}
            </div>
          ) : (
            /* ── PASTE GROCERY LIST TAB ────────────────────────────────────── */
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', display: 'block', marginBottom: 6 }}>
                Paste or type your grocery list (from WhatsApp, Notes, etc.):
              </label>
              <textarea
                rows={4}
                placeholder={`2 kg tomatoes\n1 liter whole milk\nsourdough bread\n250g strawberries\nbasmati rice 5kg`}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  fontSize: 13.5,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>
          )}

          {/* ── LIVE PARSED ITEMS PREVIEW ────────────────────────────────────── */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                Detected Items ({parsedItems.length})
              </span>
              {parsedItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setParsedItems([])}
                  style={{ fontSize: 12, color: '#94a3b8', cursor: 'pointer', border: 'none', background: 'none' }}
                >
                  Clear all
                </button>
              )}
            </div>

            {parsedItems.length === 0 ? (
              <div
                style={{
                  padding: '24px',
                  borderRadius: 12,
                  border: '1.5px dashed #cbd5e1',
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: 13,
                }}
              >
                No items detected yet. Speak into the microphone or paste a list above!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {parsedItems.map((item) => {
                  const emoji = FOOD_EMOJIS[item.category] || '🥬';
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 12,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      {/* Name & Emoji */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 18 }}>{emoji}</span>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>
                            {item.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{item.category}</span>
                            <span>•</span>
                            <span style={{ textTransform: 'capitalize' }}>{item.storageLocation}</span>
                            <span>•</span>
                            <span>{item.shelfLifeDays} days shelf-life</span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Stepper & Remove Button */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: 8,
                            padding: '2px 4px',
                            gap: 6,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.id, -0.5)}
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 4,
                              border: 'none',
                              background: '#f1f5f9',
                              color: '#1e293b',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            -
                          </button>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', minWidth: 44, textAlign: 'center' }}>
                            {item.quantity} {item.unit}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.id, 0.5)}
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 4,
                              border: 'none',
                              background: '#f1f5f9',
                              color: '#1e293b',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            border: 'none',
                            background: 'transparent',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#ef4444';
                            e.currentTarget.style.background = '#fee2e2';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#94a3b8';
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer / Primary Action */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#ffffff',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 18px',
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#64748b',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={parsedItems.length === 0}
            onClick={handleConfirmAddAll}
            style={{
              padding: '10px 22px',
              borderRadius: 10,
              border: 'none',
              background: parsedItems.length === 0 ? '#cbd5e1' : '#16a34a',
              color: '#ffffff',
              fontSize: 13.5,
              fontWeight: 700,
              cursor: parsedItems.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: parsedItems.length === 0 ? 'none' : '0 2px 8px rgba(22, 163, 74, 0.3)',
              transition: 'all 0.15s ease',
            }}
          >
            <Check size={16} />
            <span>Add All ({parsedItems.length} Items) to Kitchen</span>
          </button>
        </div>
      </div>
    </div>
  );
}
