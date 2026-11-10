// src/components/AddItem/AddItemDrawer.jsx
import React, { useState } from 'react';
import { X, Plus, Sparkles, Scale, DollarSign, Barcode } from 'lucide-react';
import VoiceInputButton from './VoiceInputButton';
import ReceiptScanModal from './ReceiptScanModal';
import BarcodeScanModal from './BarcodeScanModal';
import { addDays, todayKey } from '../../utils/dates';
import { detectFoodDetails } from '../../utils/foodDetection';
import { useSettings, formatCurrency, MEASUREMENT_UNITS } from '../../store/useSettings';

const CATEGORIES = ['Dairy', 'Vegetables', 'Fruit', 'Meat', 'Pantry', 'Bakery'];
const PANTRY_STATES = ['FULL', 'HALF', 'LOW'];

const STORAGE_OPTIONS = [
  { val: 'fridge',  emoji: '❄️',  label: 'Fridge',  sub: 'Standard (1×)'    },
  { val: 'freezer', emoji: '🧊',  label: 'Freezer', sub: 'Extended (3×)'    },
  { val: 'pantry',  emoji: '🗄️',  label: 'Pantry',  sub: 'Ambient (0.75×)' },
  { val: 'counter', emoji: '🍽️',  label: 'Counter', sub: 'Fastest (0.5×)'  },
];

const STORAGE_MULTIPLIERS = { fridge: 1, freezer: 3, pantry: 0.75, counter: 0.5 };

const today = () => todayKey();

function calcExpiry(date, days, storageLocation = 'fridge') {
  if (!date || !days) return '';
  const adjusted = Math.round(parseInt(days, 10) * (STORAGE_MULTIPLIERS[storageLocation] || 1));
  return addDays(date, adjusted);
}

const PANTRY_CHIP_STYLE = {
  FULL: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.25)' },
  HALF: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.25)' },
  LOW:  { color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)',  border: 'rgba(244, 63, 94, 0.25)'  },
};

export default function AddItemDrawer({ onAdd, onClose }) {
  const [settings] = useSettings();
  const currentCurrency = settings.regional?.currency || 'INR';

  const [showReceipt, setShowReceipt] = useState(false);
  const [showBarcode, setShowBarcode] = useState(false);
  const [detectedInfo, setDetectedInfo] = useState(null);
  const [form, setForm] = useState({
    name: '',
    track: 'produce',
    category: 'Vegetables',
    quantity: 1,
    unit: 'kg',
    price: '',
    purchaseDate: today(),
    shelfLifeDays: 7,
    pantryState: 'FULL',
    storageLocation: 'fridge',
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Intelligent auto-detection of food category, shelf life days, and quantity measurement
  const handleNameChange = (nameText) => {
    set('name', nameText);
    const detected = detectFoodDetails(nameText);
    if (detected) {
      setDetectedInfo(detected);
      setForm((prev) => {
        const mult = STORAGE_MULTIPLIERS[detected.storageLocation || prev.storageLocation] || 1;
        const adjustedDays = Math.round(detected.shelfLifeDays * mult);
        return {
          ...prev,
          name: detected.parsedCleanName || nameText,
          category: detected.category,
          shelfLifeDays: adjustedDays,
          track: detected.track,
          storageLocation: detected.storageLocation || prev.storageLocation,
          quantity: detected.quantity || prev.quantity,
          unit: detected.unit || prev.unit,
        };
      });
    } else {
      setDetectedInfo(null);
    }
  };

  const handleStorageChange = (val) => {
    set('storageLocation', val);
    if (detectedInfo && form.track === 'produce') {
      const baseDays = detectedInfo.shelfLifeDays;
      const mult = STORAGE_MULTIPLIERS[val] || 1;
      const adjusted = Math.round(baseDays * mult);
      set('shelfLifeDays', adjusted);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const item = {
      name: form.name.trim(),
      track: form.track,
      category: form.category,
      quantity: parseFloat(form.quantity) || 1,
      unit: form.unit || 'kg',
      price: parseFloat(form.price) || 0,
      storageLocation: form.storageLocation,
      purchaseDate: form.purchaseDate,
      shelfLifeDays: form.shelfLifeDays,
    };
    if (form.track === 'produce') {
      item.expiryDate = calcExpiry(form.purchaseDate, form.shelfLifeDays, form.storageLocation);
    } else {
      item.pantryState = form.pantryState;
    }
    onAdd(item);
    onClose();
  };

  const handleVoice = (text) => {
    handleNameChange(text);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="drawer-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          zIndex: 50,
          backdropFilter: 'blur(3px)',
        }}
      />

      {/* Drawer */}
      <aside
        id="add-item-drawer"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: 440,
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          zIndex: 51,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.12)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 20px 16px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>Add Item</h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Track measurements, decay timers and stock
            </p>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            style={{ borderRadius: '50%', padding: 6 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick Scan buttons row: Receipt & Barcode */}
        <div style={{ padding: '12px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <button
            type="button"
            id="open-barcode-scan-btn"
            onClick={() => setShowBarcode(true)}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px dashed #38bdf8',
              background: 'rgba(14, 165, 233, 0.12)',
              color: '#38bdf8',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            <Barcode size={15} /> Scan Barcode
          </button>
          <button
            type="button"
            id="open-receipt-scan-btn"
            onClick={() => setShowReceipt(true)}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px dashed var(--green)',
              background: 'var(--green-glow)',
              color: 'var(--green-light)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={14} /> Scan Receipt
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="scrollbar-thin"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 15,
          }}
        >
          {/* Item Type: Fresh Produce vs Dry Pantry */}
          <div>
            <label className="field-label">Inventory Track</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { val: 'produce', emoji: '🥬', label: 'Fresh Produce', desc: 'Decay countdown' },
                { val: 'pantry', emoji: '🥫', label: 'Dry Pantry', desc: 'Stock level (3-state)' },
              ].map((t) => (
                <button
                  key={t.val}
                  type="button"
                  id={`track-select-${t.val}`}
                  onClick={() => set('track', t.val)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 10,
                    textAlign: 'left',
                    border: `1px solid ${form.track === t.val ? 'var(--green)' : 'var(--border)'}`,
                    background: form.track === t.val ? 'var(--green-glow)' : 'var(--bg-raised)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{t.emoji}</div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: form.track === t.val ? 700 : 500,
                      color: form.track === t.val ? 'var(--green-light)' : 'var(--text)',
                    }}
                  >
                    {t.label}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 2 }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Name & Voice Button */}
          <div>
            <label className="field-label" htmlFor="item-name-input">
              Item Name (e.g. 2 kg Tomatoes, 1 Liter Milk, 1 Gallon Juice)
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                id="item-name-input"
                type="text"
                className="field"
                placeholder="e.g. 2 kg Tomatoes, Whole Milk..."
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                autoFocus
                required
              />
              <VoiceInputButton onTranscript={handleVoice} />
            </div>
            {detectedInfo && (
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--green-light)',
                  marginTop: 4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Sparkles size={11} /> Auto-detected: {detectedInfo.category} · {form.quantity} {form.unit} · ~{detectedInfo.shelfLifeDays} days
              </span>
            )}
          </div>

          {/* Quantity & Measurement Unit Section (kg, liter, gallon, etc.) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.6fr', gap: 10 }}>
            <div>
              <label className="field-label" htmlFor="item-qty-input" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Scale size={11} /> Quantity
              </label>
              <input
                id="item-qty-input"
                type="number"
                step="0.1"
                min="0.1"
                className="field"
                placeholder="1"
                value={form.quantity}
                onChange={(e) => set('quantity', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="field-label" htmlFor="item-unit-select">
                Measurement Unit
              </label>
              <select
                id="item-unit-select"
                className="field"
                value={form.unit}
                onChange={(e) => set('unit', e.target.value)}
              >
                <optgroup label="Mass / Weight">
                  <option value="kg">kg (Kilograms)</option>
                  <option value="g">g (Grams)</option>
                  <option value="lbs">lbs (Pounds)</option>
                  <option value="oz">oz (Ounces)</option>
                </optgroup>
                <optgroup label="Volume / Liquids">
                  <option value="L">L (Liters)</option>
                  <option value="ml">ml (Milliliters)</option>
                  <option value="gal">gal (Gallons)</option>
                </optgroup>
                <optgroup label="Count / Packs">
                  <option value="pcs">pcs (Pieces)</option>
                  <option value="pack">pack (Packs)</option>
                  <option value="bunch">bunch (Bunches)</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Category & Price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr', gap: 10 }}>
            <div>
              <label className="field-label" htmlFor="item-category-select">
                Category
              </label>
              <select
                id="item-category-select"
                className="field"
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="item-price-input" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <DollarSign size={11} /> Price ({formatCurrency(0, currentCurrency).replace(/\d+.*$/, '')})
              </label>
              <input
                id="item-price-input"
                type="number"
                step="0.1"
                min="0"
                className="field"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
              />
            </div>
          </div>

          {/* Storage Location */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <label className="field-label" style={{ margin: 0 }}>
                Storage Location
              </label>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Scales decay shelf-life</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {STORAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  id={`storage-${opt.val}-btn`}
                  onClick={() => handleStorageChange(opt.val)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: 9,
                    textAlign: 'center',
                    border: `1px solid ${form.storageLocation === opt.val ? 'var(--green)' : 'var(--border)'}`,
                    background: form.storageLocation === opt.val ? 'var(--green-glow)' : 'var(--bg-raised)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: 16, marginBottom: 2 }}>{opt.emoji}</div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: form.storageLocation === opt.val ? 700 : 500,
                      color: form.storageLocation === opt.val ? 'var(--green-light)' : 'var(--text)',
                    }}
                  >
                    {opt.label}
                  </div>
                  <div style={{ fontSize: 9.5, color: 'var(--text-dim)' }}>{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Produce Specific: Shelf Life & Purchase Date */}
          {form.track === 'produce' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="field-label" htmlFor="shelf-life-input">
                  Shelf Life (days)
                </label>
                <input
                  id="shelf-life-input"
                  type="number"
                  min="1"
                  max="180"
                  className="field"
                  value={form.shelfLifeDays}
                  onChange={(e) => set('shelfLifeDays', e.target.value)}
                />
                {form.shelfLifeDays && (
                  <span style={{ fontSize: 10.5, color: 'var(--text-dim)', display: 'block', marginTop: 3 }}>
                    Est. expiry: {calcExpiry(form.purchaseDate, form.shelfLifeDays, form.storageLocation)}
                  </span>
                )}
              </div>
              <div>
                <label className="field-label" htmlFor="purchase-date-input">
                  Purchase Date
                </label>
                <input
                  id="purchase-date-input"
                  type="date"
                  className="field"
                  value={form.purchaseDate}
                  onChange={(e) => set('purchaseDate', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Pantry Specific: Starting Stock Level */}
          {form.track === 'pantry' && (
            <div>
              <label className="field-label">Initial Stock Level</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {PANTRY_STATES.map((s) => {
                  const style = PANTRY_CHIP_STYLE[s];
                  const sel = form.pantryState === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      id={`pantry-init-${s.toLowerCase()}`}
                      onClick={() => set('pantryState', s)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 9,
                        textAlign: 'center',
                        fontSize: 13,
                        fontWeight: sel ? 700 : 500,
                        border: `1px solid ${sel ? style.color : 'var(--border)'}`,
                        background: sel ? style.bg : 'var(--bg-raised)',
                        color: sel ? style.color : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Button */}
          <div style={{ marginTop: 'auto', paddingTop: 16 }}>
            <button
              id="add-item-submit-btn"
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14, fontWeight: 700 }}
            >
              <Plus size={15} /> Add to Kitchen
            </button>
          </div>
        </form>
      </aside>

      {/* Receipt Scan Modal */}
      {showReceipt && (
        <ReceiptScanModal
          onAdd={onAdd}
          onAddMultiple={(items) => {
            items.forEach((it) => onAdd(it));
            onClose();
          }}
          onClose={() => setShowReceipt(false)}
        />
      )}

      {/* Barcode Scan Modal */}
      {showBarcode && (
        <BarcodeScanModal
          onAdd={(item) => {
            onAdd(item);
            onClose();
          }}
          onClose={() => setShowBarcode(false)}
        />
      )}
    </>
  );
}
