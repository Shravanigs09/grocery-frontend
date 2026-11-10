// src/components/AddItem/VoiceInputButton.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, X, Check } from 'lucide-react';
import { getSettings } from '../../store/useSettings';
import { playConfirmationChime } from '../../utils/sound';

export default function VoiceInputButton({ onResult, onTranscript, label = 'Voice' }) {
  const [state, setState] = useState('idle'); // idle | listening | error | denied
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [manualVoiceText, setManualVoiceText] = useState('');
  const [listeningTranscript, setListeningTranscript] = useState('');
  const recRef = useRef(null);
  const errorTimer = useRef(null);
  const lastTranscriptRef = useRef('');

  const handleResult = onResult || onTranscript;

  useEffect(() => {
    return () => {
      if (errorTimer.current) clearTimeout(errorTimer.current);
      try {
        recRef.current?.abort?.();
      } catch {
        /* ignore */
      }
      recRef.current = null;
    };
  }, []);

  const flashError = (next = 'error') => {
    setState(next);
    if (errorTimer.current) clearTimeout(errorTimer.current);
    errorTimer.current = setTimeout(() => setState('idle'), 3000);
  };

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

    // If browser lacks Web Speech API, gracefully offer quick voice assistant input dialog
    if (!SR) {
      setShowFallbackModal(true);
      return;
    }

    const settings = getSettings();
    const language = settings?.voiceInput?.speechLanguage || 'en-IN';

    try {
      if (recRef.current) {
        try { recRef.current.abort(); } catch {}
      }

      const recognition = new SR();
      recognition.lang = language;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;
      recRef.current = recognition;
      lastTranscriptRef.current = '';

      recognition.onstart = () => {
        setState('listening');
        setListeningTranscript('');
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalTranscript += res[0].transcript;
          } else {
            interimTranscript += res[0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        setListeningTranscript(currentText);
        lastTranscriptRef.current = currentText;

        // Final result delivered from speech engine
        if (finalTranscript.trim()) {
          const finalClean = finalTranscript.trim();
          lastTranscriptRef.current = '';
          if (settings?.voiceInput?.audioFeedback !== false) {
            playConfirmationChime();
          }
          if (handleResult) {
            handleResult(finalClean);
          }
          setState('idle');
          setListeningTranscript('');
          try { recognition.stop(); } catch {}
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          flashError('denied');
          setShowFallbackModal(true);
        } else if (event.error === 'no-speech') {
          setState('idle');
        } else {
          flashError('error');
          // If network error (common when offline), offer assistant
          if (event.error === 'network') {
            setShowFallbackModal(true);
          }
        }
      };

      recognition.onend = () => {
        // If speech ended and we captured words that were not marked isFinal yet
        if (lastTranscriptRef.current && lastTranscriptRef.current.trim()) {
          const captured = lastTranscriptRef.current.trim();
          lastTranscriptRef.current = '';
          if (settings?.voiceInput?.audioFeedback !== false) {
            playConfirmationChime();
          }
          if (handleResult) {
            handleResult(captured);
          }
        }
        setState('idle');
        setListeningTranscript('');
      };

      recognition.start();
    } catch (e) {
      console.warn('Failed to start speech recognition:', e);
      setShowFallbackModal(true);
    }
  };

  const stopListening = () => {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    setState('idle');
    setListeningTranscript('');
  };

  const submitFallbackText = (phrase) => {
    const textToSubmit = phrase || manualVoiceText;
    if (!textToSubmit?.trim()) return;

    const settings = getSettings();
    if (settings?.voiceInput?.audioFeedback !== false) {
      playConfirmationChime();
    }
    if (handleResult) {
      handleResult(textToSubmit.trim());
    }
    setManualVoiceText('');
    setShowFallbackModal(false);
  };

  const isError = state === 'error' || state === 'denied';
  const isListening = state === 'listening';

  return (
    <>
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <button
          type="button"
          id="voice-input-btn"
          onClick={isListening ? stopListening : startListening}
          title={
            state === 'denied'
              ? 'Microphone permission blocked — click for voice assistant'
              : state === 'error'
              ? 'Voice recognition unavailable — click for assistant'
              : isListening
              ? 'Listening... Click to stop'
              : 'Voice recognition (say e.g. 2 kg tomatoes, 1 liter milk)'
          }
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 13px',
            borderRadius: 10,
            background: isListening
              ? 'rgba(16, 185, 129, 0.2)'
              : isError
              ? 'var(--amber-soft)'
              : 'var(--surface-2)',
            border: `1px solid ${
              isListening ? 'var(--green)' : isError ? 'var(--amber)' : 'var(--border)'
            }`,
            color: isListening
              ? 'var(--green-light)'
              : isError
              ? 'var(--amber)'
              : 'var(--text)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: isListening ? '0 0 12px rgba(16, 185, 129, 0.35)' : 'none',
          }}
        >
          {isListening ? (
            <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
          ) : isError ? (
            <MicOff size={15} color="var(--amber)" />
          ) : (
            <Mic size={15} color="var(--green-light)" />
          )}
          <span>
            {isListening ? 'Listening...' : state === 'denied' ? 'Mic Denied' : label}
          </span>
        </button>

        {/* Live Listening Popup Pill */}
        {isListening && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 6,
              zIndex: 50,
              background: 'var(--surface)',
              border: '1px solid var(--green)',
              borderRadius: 12,
              padding: '8px 12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minWidth: 200,
              fontSize: 12,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--coral)',
                animation: 'pulse 1s infinite',
              }}
            />
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>
              {listeningTranscript ? `"${listeningTranscript}"` : 'Say e.g. "2 kg apples"'}
            </span>
          </div>
        )}
      </div>

      {/* Voice Assistant / Fallback Dialog */}
      {showFallbackModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowFallbackModal(false)}
        >
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: 24,
              maxWidth: 440,
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'var(--green-glow)',
                    color: 'var(--green-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Mic size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text)' }}>
                    Voice Input Assistant
                  </h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>
                    Speak or pick sample phrase with quantity &amp; unit
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFallbackModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className="field-label" style={{ fontSize: 12 }}>
                Voice Transcription Phrase
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  className="field"
                  placeholder="e.g. 2 kg fresh tomatoes, 1 liter milk..."
                  value={manualVoiceText}
                  onChange={(e) => setManualVoiceText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      submitFallbackText();
                    }
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => submitFallbackText()}
                  className="btn btn-primary"
                  style={{ padding: '0 16px', fontSize: 13 }}
                >
                  <Check size={16} />
                </button>
              </div>
            </div>

            {/* Quick 1-Click Voice Presets */}
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Quick Preset Phrases
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                {[
                  '2 kg fresh tomatoes',
                  '1 liter whole milk',
                  '0.5 gallon orange juice',
                  '500 g greek yogurt',
                  '1 bunch fresh coriander',
                  '5 kg basmati rice',
                ].map((phrase) => (
                  <button
                    key={phrase}
                    type="button"
                    onClick={() => submitFallbackText(phrase)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--text)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--green)';
                      e.currentTarget.style.background = 'var(--green-glow)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.background = 'var(--surface-2)';
                    }}
                  >
                    "{phrase}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
