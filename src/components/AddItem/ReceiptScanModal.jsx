// src/components/AddItem/ReceiptScanModal.jsx
import { useState, useEffect, useRef } from 'react';
import {
  X,
  ScanLine,
  Upload,
  Camera,
  Check,
  Loader2,
  Trash2,
  Plus,
  AlertCircle,
  FileText,
  ShoppingCart,
  Sparkles,
  RefreshCw,
  Key,
} from 'lucide-react';
import { scanReceipt } from '../../services/api';
import { detectFoodDetails } from '../../utils/foodDetection';
import { addDays, todayKey } from '../../utils/dates';
import { getSettings, useSettings, formatCurrency, MEASUREMENT_UNITS } from '../../store/useSettings';
import { playConfirmationChime } from '../../utils/sound';

const STORAGE_OPTIONS = [
  { val: 'fridge',  emoji: '❄️', label: 'Fridge',  mult: 1.0  },
  { val: 'counter', emoji: '🍽️', label: 'Counter', mult: 0.5  },
  { val: 'pantry',  emoji: '🗄️', label: 'Pantry',  mult: 0.75 },
  { val: 'freezer', emoji: '🧊', label: 'Freezer', mult: 3.0  },
];

const CATEGORIES = [
  { val: 'Vegetables', label: 'Vegetables', emoji: '🥬' },
  { val: 'Meat',       label: 'Meat',       emoji: '🥩' },
  { val: 'Dairy',      label: 'Dairy',      emoji: '🥛' },
  { val: 'Fruit',      label: 'Fruit',      emoji: '🍓' },
  { val: 'Bakery',     label: 'Bakery',     emoji: '🍞' },
  { val: 'Pantry',     label: 'Pantry',     emoji: '🥫' },
  { val: 'Other',      label: 'Other',      emoji: '🛒' },
];

export default function ReceiptScanModal({ onAdd, onAddMultiple, onClose }) {
  const [settings] = useSettings();
  const currentCurrency = settings.regional?.currency || 'INR';
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'text'
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState('');
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [receiptText, setReceiptText] = useState('');
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showKeyField, setShowKeyField] = useState(false);

  const [phase, setPhase] = useState('idle'); // 'idle' | 'scanning' | 'review'
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [storeName, setStoreName] = useState('Grocery Receipt');
  const [parsedItems, setParsedItems] = useState([]);
  const [selected, setSelected] = useState(new Set());

  const fileInputRef = useRef(null);

  // File handling
  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid receipt photo (PNG, JPG, WEBP).');
      return;
    }
    setErrorMsg('');
    setMimeType(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
      setImageBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  };

  // Clipboard paste support
  useEffect(() => {
    const handlePaste = (e) => {
      if (phase !== 'idle') return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const it of items) {
        if (it.type.startsWith('image/')) {
          const file = it.getAsFile();
          if (file) handleFile(file);
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [phase]);

  const handleSaveKey = (val) => {
    setGeminiKey(val);
    localStorage.setItem('gemini_api_key', val);
  };

  // Scanning with categorization into Fresh vs Dry Pantry, Food Category, Storage, and Shelf Life
  const handleScan = async () => {
    if (!imageBase64 && !receiptText.trim()) {
      setErrorMsg('Please upload a receipt photo or paste receipt text first.');
      return;
    }

    setPhase('scanning');
    setStatusMsg('Extracting items, classifying into Fresh vs Dry Pantry & detecting shelf life…');
    setErrorMsg('');

    try {
      const res = await scanReceipt(
        {
          imageBase64: imageBase64 || undefined,
          mimeType: mimeType || 'image/jpeg',
          receiptText: receiptText.trim() || undefined,
        },
        geminiKey || undefined
      );

      const rawItems = Array.isArray(res?.items) ? res.items : [];
      if (!res?.success || rawItems.length === 0) {
        throw new Error(res?.message || 'No grocery items detected on the uploaded receipt.');
      }

      setStoreName(res.storeName || 'Scanned Grocery Receipt');

      const today = todayKey();
      const enhanced = rawItems.map((item, idx) => {
        const auto = detectFoodDetails(item.name);
        const category = item.category || auto?.category || 'Vegetables';
        const track = item.track || auto?.track || (category === 'Pantry' ? 'pantry' : 'produce');
        const storageLocation = item.storageLocation || auto?.storageLocation || (track === 'pantry' ? 'pantry' : 'fridge');
        const shelfLifeDays = item.shelfLifeDays || auto?.shelfLifeDays || (track === 'pantry' ? 90 : 5);
        const expiryDate = track === 'produce' ? addDays(today, shelfLifeDays) : '';

        const qtyParsed = typeof item.quantity === 'number' ? item.quantity : (parseFloat(item.quantity) || auto?.quantity || 1);
        const unitParsed = item.unit || auto?.unit || 'kg';
        const priceParsed = typeof item.price === 'number' ? item.price : (parseFloat(item.price) || 0);

        return {
          id: `item-${Date.now()}-${idx}`,
          name: item.name || 'Grocery Item',
          quantity: qtyParsed,
          unit: unitParsed,
          price: priceParsed,
          track, // 'produce' = Fresh, 'pantry' = Dry Pantry
          category, // 'Vegetables', 'Meat', 'Dairy', 'Fruit', 'Bakery', 'Pantry'
          storageLocation, // 'fridge', 'counter', 'pantry', 'freezer'
          shelfLifeDays,
          expiryDate,
          baseDays: auto?.shelfLifeDays || shelfLifeDays,
        };
      });

      setParsedItems(enhanced);
      setSelected(new Set(enhanced.map((_, i) => i)));
      setPhase('review');

      const s = getSettings();
      if (s?.voiceInput?.audioFeedback !== false) {
        playConfirmationChime();
      }
    } catch (err) {
      console.warn('Receipt scan notice:', err.message);
      const displayError =
        err?.response?.data?.message ||
        err?.message ||
        'No grocery items detected on the receipt. Please ensure the image is clear and well-lit, or paste receipt text.';
      setErrorMsg(displayError);
      setParsedItems([]);
      setSelected(new Set());
      setPhase('idle');
    }
  };

  const toggleSelect = (idx) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === parsedItems.length) setSelected(new Set());
    else setSelected(new Set(parsedItems.map((_, i) => i)));
  };

  const updateItemField = (idx, field, val) => {
    const today = todayKey();
    setParsedItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;
        const updated = { ...item, [field]: val };

        // When name changes, auto-detect everything
        if (field === 'name') {
          const auto = detectFoodDetails(val);
          if (auto) {
            updated.category = auto.category;
            updated.track = auto.track;
            updated.storageLocation = auto.storageLocation;
            updated.baseDays = auto.shelfLifeDays;
            const mult = STORAGE_OPTIONS.find(s => s.val === auto.storageLocation)?.mult || 1;
            updated.shelfLifeDays = Math.round(auto.shelfLifeDays * mult);
            updated.expiryDate = updated.track === 'produce' ? addDays(today, updated.shelfLifeDays) : '';
          }
        }

        // When storage location changes, re-calculate shelf life with multiplier
        if (field === 'storageLocation') {
          const mult = STORAGE_OPTIONS.find(s => s.val === val)?.mult || 1;
          const base = item.baseDays || item.shelfLifeDays;
          updated.shelfLifeDays = Math.round(base * mult);
          updated.expiryDate = updated.track === 'produce' ? addDays(today, updated.shelfLifeDays) : '';
        }

        // When track changes (Fresh vs Dry Pantry)
        if (field === 'track') {
          if (val === 'pantry') {
            updated.storageLocation = 'pantry';
            updated.shelfLifeDays = 90;
            updated.expiryDate = '';
          } else {
            updated.storageLocation = 'fridge';
            updated.shelfLifeDays = item.baseDays || 5;
            updated.expiryDate = addDays(today, updated.shelfLifeDays);
          }
        }

        // When shelf life changes manually
        if (field === 'shelfLifeDays') {
          const days = parseInt(val, 10) || 1;
          updated.shelfLifeDays = days;
          updated.expiryDate = updated.track === 'produce' ? addDays(today, days) : '';
        }

        return updated;
      })
    );
  };

  const removeItem = (idx) => {
    setParsedItems((prev) => prev.filter((_, i) => i !== idx));
    setSelected((prev) => {
      const next = new Set();
      prev.forEach((i) => {
        if (i < idx) next.add(i);
        else if (i > idx) next.add(i - 1);
      });
      return next;
    });
  };

  const addNewRow = () => {
    const today = todayKey();
    const newItem = {
      id: `manual-${Date.now()}`,
      name: '',
      quantity: '1 unit',
      track: 'produce',
      category: 'Vegetables',
      storageLocation: 'fridge',
      shelfLifeDays: 5,
      expiryDate: addDays(today, 5),
      baseDays: 5,
    };
    setParsedItems((prev) => [...prev, newItem]);
    setSelected((prev) => new Set([...prev, parsedItems.length]));
  };

  const handleConfirm = () => {
    const chosen = parsedItems.filter((_, idx) => selected.has(idx));
    if (onAddMultiple) {
      onAddMultiple(chosen);
    } else if (onAdd) {
      chosen.forEach((it) => onAdd(it));
      onClose();
    }
  };

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="modal" style={{ maxWidth: 620, width: '96%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', padding: 22 }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--green-glow)', border: '1px solid rgba(45,158,95,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ScanLine size={19} color="var(--green-light)" />
            </div>
            <div>
              <h2 className="brand-serif" style={{ fontSize: 19, color: 'var(--text)', lineHeight: 1.2 }}>
                Smart Receipt Scanner
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                Detects items, classifies Fresh vs Dry Pantry, where to store &amp; shelf life
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              className="btn-icon"
              title="Google Gemini API Key"
              onClick={() => setShowKeyField(f => !f)}
              style={{ color: geminiKey ? 'var(--green-light)' : 'var(--text-dim)' }}>
              <Key size={15} />
            </button>
            <button className="btn-icon" onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        {/* Optional Gemini API Key field */}
        {showKeyField && (
          <div style={{
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '10px 12px', marginBottom: 14, fontSize: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Sparkles size={13} color="var(--green-light)" />
                Google Gemini Vision Key (Optional)
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Saved in browser</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
              Enter your key for direct multimodal AI receipt photo reading.
            </p>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={(e) => handleSaveKey(e.target.value)}
              className="field"
              style={{ padding: '6px 10px', fontSize: 12 }}
            />
          </div>
        )}

        {errorMsg && (
          <div style={{
            background: 'var(--red-soft)', border: '1px solid rgba(192,67,58,0.3)',
            borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#e07268',
            marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AlertCircle size={14} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Phase 1: IDLE */}
        {phase === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Input tabs */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4,
              background: 'var(--surface-2)', padding: 3, borderRadius: 10,
              border: '1px solid var(--border)',
            }}>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                style={{
                  padding: '7px 0', fontSize: 12.5, fontWeight: activeTab === 'upload' ? 600 : 400,
                  borderRadius: 8, background: activeTab === 'upload' ? 'var(--green)' : 'transparent',
                  color: activeTab === 'upload' ? '#fff' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                <Camera size={14} /> Upload receipt photo
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('text')}
                style={{
                  padding: '7px 0', fontSize: 12.5, fontWeight: activeTab === 'text' ? 600 : 400,
                  borderRadius: 8, background: activeTab === 'text' ? 'var(--green)' : 'transparent',
                  color: activeTab === 'text' ? '#fff' : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                <FileText size={14} /> Paste receipt text
              </button>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'rgba(45,158,95,0.08)', border: '1px solid rgba(45,158,95,0.22)',
              borderRadius: 8, padding: '7px 11px', fontSize: 11.5, color: 'var(--green-light)',
            }}>
              <Sparkles size={13} style={{ flexShrink: 0 }} />
              <span>Strict scanner: Extracts only items physically in your receipt. Auto-detects category, storage location &amp; shelf life.</span>
            </div>

            {activeTab === 'upload' ? (
              <div>
                {!imagePreview ? (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed var(--border)',
                      borderRadius: 14, padding: '34px 16px', textAlign: 'center',
                      background: 'var(--bg-raised)', cursor: 'pointer',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                    <div style={{
                      width: 52, height: 52, borderRadius: 14, margin: '0 auto 12px',
                      background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Upload size={24} color="var(--green-light)" />
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                      Click or drag receipt photo here
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Supports supermarket receipts, grocery bills, market slips (PNG, JPG, WEBP)
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--green-light)', marginTop: 8 }}>
                      Tip: You can also copy an image and press Ctrl+V
                    </p>
                  </div>
                ) : (
                  <div style={{
                    position: 'relative', borderRadius: 12, overflow: 'hidden',
                    border: '1px solid var(--border)', background: 'var(--bg-raised)',
                    maxHeight: 220, textAlign: 'center',
                  }}>
                    <img
                      src={imagePreview}
                      alt="Receipt preview"
                      style={{ maxHeight: 220, maxWidth: '100%', objectFit: 'contain', margin: '0 auto' }}
                    />
                    <button
                      type="button"
                      onClick={() => { setImagePreview(null); setImageBase64(''); }}
                      style={{
                        position: 'absolute', top: 8, right: 8,
                        background: 'rgba(0,0,0,0.7)', borderRadius: 6,
                        padding: 6, color: '#fff', display: 'flex',
                      }}>
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <textarea
                  rows={6}
                  placeholder={`Paste grocery receipt lines, e.g.:
Fresh Spinach 1 bag 45.00
Whole Milk 1L 68.00
Chicken Breast 500g 220.00
Basmati Rice 5kg 120.00
Bananas 6 pack 55.00`}
                  value={receiptText}
                  onChange={(e) => setReceiptText(e.target.value)}
                  className="field"
                  style={{ fontFamily: 'monospace', fontSize: 12.5 }}
                />
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1.8, justifyContent: 'center' }}
                disabled={!imagePreview && !receiptText.trim()}
                onClick={handleScan}>
                <ScanLine size={15} /> Scan &amp; detect items
              </button>
            </div>
          </div>
        )}

        {/* Phase 2: SCANNING */}
        {phase === 'scanning' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            {imagePreview ? (
              <div style={{
                position: 'relative', width: 180, height: 210, margin: '0 auto 16px',
                borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)',
                background: '#000',
              }}>
                <img
                  src={imagePreview}
                  alt="Scanning"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }}
                />
                <div style={{
                  position: 'absolute', left: 0, right: 0, height: 2,
                  background: 'var(--green-light)',
                  boxShadow: '0 0 12px var(--green)',
                  animation: 'receiptLaser 1.6s ease-in-out infinite alternate',
                }} />
                <style>{`
                  @keyframes receiptLaser {
                    0% { top: 6%; }
                    100% { top: 92%; }
                  }
                `}</style>
              </div>
            ) : (
              <Loader2 size={36} color="var(--green)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 14px' }} />
            )}
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
              Classifying grocery items…
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
              {statusMsg}
            </p>
          </div>
        )}

        {/* Phase 3: REVIEW & EDIT WITH FRESH/PANTRY, CATEGORY, STORAGE & SHELF LIFE */}
        {phase === 'review' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                  {storeName}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-dim)', marginLeft: 8 }}>
                  ({parsedItems.length} items detected)
                </span>
              </div>
              <button
                type="button"
                onClick={toggleSelectAll}
                style={{ fontSize: 12, color: 'var(--green-light)', fontWeight: 600 }}>
                {selected.size === parsedItems.length ? 'Deselect all' : 'Select all'}
              </button>
            </div>

            {/* Items Cards List */}
            <div
              className="scrollbar-thin"
              style={{
                display: 'flex', flexDirection: 'column', gap: 8,
                maxHeight: 330, overflowY: 'auto', paddingRight: 4,
              }}>
              {parsedItems.map((item, idx) => {
                const isChecked = selected.has(idx);
                const isProduce = item.track === 'produce';

                return (
                  <div
                    key={item.id || idx}
                    style={{
                      borderRadius: 11, padding: '10px 12px',
                      border: `1px solid ${isChecked ? (isProduce ? 'rgba(45,158,95,0.4)' : 'rgba(212,132,58,0.4)') : 'var(--border)'}`,
                      background: isChecked ? 'var(--surface-2)' : 'transparent',
                      transition: 'all 0.14s',
                      display: 'flex', flexDirection: 'column', gap: 7,
                    }}>
                    
                    {/* Top line: Select, Name, Qty, Price, Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => toggleSelect(idx)}
                        style={{
                          width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                          border: `1px solid ${isChecked ? (isProduce ? 'var(--green)' : 'var(--amber)') : 'var(--border)'}`,
                          background: isChecked ? (isProduce ? 'var(--green)' : 'var(--amber)') : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                        {isChecked && <Check size={11} color="#fff" />}
                      </button>

                      {/* Name */}
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItemField(idx, 'name', e.target.value)}
                        placeholder="Item name"
                        style={{
                          flex: 1, background: 'transparent', border: 'none',
                          color: 'var(--text)', fontSize: 13.5, fontWeight: 600, outline: 'none',
                          minWidth: 0,
                        }}
                      />

                      {/* Qty & Unit */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={item.quantity ?? 1}
                          onChange={(e) => updateItemField(idx, 'quantity', parseFloat(e.target.value) || 1)}
                          style={{
                            width: 44, background: 'var(--bg-raised)', border: '1px solid var(--border)',
                            borderRadius: 6, padding: '3px 4px', fontSize: 11.5, color: 'var(--text)',
                            textAlign: 'center', outline: 'none',
                          }}
                        />
                        <select
                          value={item.unit || 'kg'}
                          onChange={(e) => updateItemField(idx, 'unit', e.target.value)}
                          style={{
                            background: 'var(--bg-raised)', border: '1px solid var(--border)',
                            borderRadius: 6, padding: '3px 4px', fontSize: 11, color: 'var(--text-muted)',
                            outline: 'none',
                          }}
                        >
                          {MEASUREMENT_UNITS.map((u) => (
                            <option key={u.id} value={u.id}>{u.short}</option>
                          ))}
                        </select>
                      </div>

                      {/* Price */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <span style={{ fontSize: 11, color: 'var(--green-light)', fontWeight: 700 }}>
                          {formatCurrency(0, currentCurrency).replace(/\d+.*$/, '')}
                        </span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={item.price ?? 0}
                          onChange={(e) => updateItemField(idx, 'price', parseFloat(e.target.value) || 0)}
                          style={{
                            width: 46, background: 'var(--bg-raised)', border: '1px solid var(--border)',
                            borderRadius: 6, padding: '3px 4px', fontSize: 11.5, color: 'var(--green-light)',
                            textAlign: 'right', outline: 'none', fontWeight: 600,
                          }}
                        />
                      </div>

                      {/* Delete */}
                      <button
                        type="button"
                        className="btn-icon"
                        style={{ padding: 4 }}
                        onClick={() => removeItem(idx)}>
                        <Trash2 size={13} color="var(--text-dim)" />
                      </button>
                    </div>

                    {/* Bottom line: Classification, Category, Where to Store, Shelf Life */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', paddingLeft: 26, fontSize: 11.5 }}>
                      
                      {/* 1. Track: Fresh vs Dry Pantry Toggle */}
                      <button
                        type="button"
                        onClick={() => updateItemField(idx, 'track', isProduce ? 'pantry' : 'produce')}
                        title="Click to toggle Fresh Produce vs Dry Pantry"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                          background: isProduce ? 'rgba(45,158,95,0.15)' : 'rgba(212,132,58,0.15)',
                          color: isProduce ? 'var(--green-light)' : '#e09352',
                          border: `1px solid ${isProduce ? 'rgba(45,158,95,0.35)' : 'rgba(212,132,58,0.35)'}`,
                          cursor: 'pointer',
                        }}>
                        <span>{isProduce ? '🟢 Fresh' : '🗄️ Dry Pantry'}</span>
                      </button>

                      {/* 2. Specific Food Category dropdown */}
                      <select
                        value={item.category}
                        onChange={(e) => updateItemField(idx, 'category', e.target.value)}
                        style={{
                          background: 'var(--bg-raised)', border: '1px solid var(--border)',
                          borderRadius: 6, padding: '2px 6px', fontSize: 11, color: 'var(--text-muted)',
                          outline: 'none',
                        }}>
                        {CATEGORIES.map((cat) => (
                          <option key={cat.val} value={cat.val}>
                            {cat.emoji} {cat.label}
                          </option>
                        ))}
                      </select>

                      {/* 3. Storage location recommendation */}
                      <select
                        value={item.storageLocation}
                        onChange={(e) => updateItemField(idx, 'storageLocation', e.target.value)}
                        title="Where to store this item"
                        style={{
                          background: 'var(--bg-raised)', border: '1px solid var(--border)',
                          borderRadius: 6, padding: '2px 6px', fontSize: 11, color: 'var(--text-muted)',
                          outline: 'none',
                        }}>
                        {STORAGE_OPTIONS.map((st) => (
                          <option key={st.val} value={st.val}>
                            {st.emoji} {st.label}
                          </option>
                        ))}
                      </select>

                      {/* 4. Detected Shelf life */}
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--text-dim)', marginLeft: 'auto' }}>
                        <span>⏱️ Shelf life:</span>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={item.shelfLifeDays}
                          onChange={(e) => updateItemField(idx, 'shelfLifeDays', e.target.value)}
                          style={{
                            width: 38, background: 'var(--bg)', border: '1px solid var(--border)',
                            borderRadius: 5, padding: '1px 3px', fontSize: 11, color: 'var(--text)',
                            textAlign: 'center', outline: 'none', fontWeight: 600,
                          }}
                        />
                        <span>days</span>
                        {item.expiryDate && (
                          <span style={{ color: 'var(--text-muted)', marginLeft: 3 }}>
                            (Exp: {item.expiryDate.slice(5)})
                          </span>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add row manually */}
            <button
              type="button"
              onClick={addNewRow}
              style={{
                alignSelf: 'flex-start', marginTop: 8, fontSize: 12,
                color: 'var(--green-light)', display: 'flex', alignItems: 'center', gap: 4,
                fontWeight: 500,
              }}>
              <Plus size={13} /> Add another item manually
            </button>

            {/* Confirm Actions */}
            <div style={{ display: 'flex', gap: 10, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setPhase('idle')}>
                <RefreshCw size={13} /> Rescan
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1.8, justifyContent: 'center' }}
                disabled={selected.size === 0}
                onClick={handleConfirm}>
                <ShoppingCart size={14} /> Add {selected.size > 0 ? `(${selected.size})` : ''} to Kitchen
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
