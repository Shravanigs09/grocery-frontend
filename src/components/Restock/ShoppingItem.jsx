// src/components/Restock/ShoppingItem.jsx
import React, { useState } from 'react';
import { ArrowRight, Trash2, ChevronDown, ChevronUp, Calendar, Clock, X, PackagePlus, Scale, DollarSign } from 'lucide-react';
import { addDays, todayKey } from '../../utils/dates';
import { detectFoodDetails } from '../../utils/foodDetection';
import { useSettings, formatCurrency, formatQuantity, MEASUREMENT_UNITS } from '../../store/useSettings';

const CATEGORIES = ['Dairy', 'Vegetables', 'Fruit', 'Meat', 'Pantry', 'Bakery'];
const PANTRY_STATES = ['FULL', 'HALF', 'LOW'];
const today = () => todayKey();

function calcExpiry(date, days) {
  if (!date || !days) return '';
  return addDays(date, parseInt(days, 10));
}

const PANTRY_CHIP = {
  FULL: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.25)' },
  HALF: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.25)' },
  LOW:  { color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)',  border: 'rgba(244, 63, 94, 0.25)'  },
};

const EMOJI = { Dairy: '🥛', Vegetables: '🥬', Fruit: '🍓', Meat: '🥩', Bakery: '🍞', Pantry: '🥫' };

export default function ShoppingItem({ note, onBuy, onDelete }) {
  const [settings] = useSettings();
  const currentCurrency = settings.regional?.currency || 'INR';

  const [open, setOpen] = useState(false);
  const detected = detectFoodDetails(note.name);

  const [form, setForm] = useState({
    name: note.name,
    track: detected?.track || 'produce',
    quantity: note.quantity || detected?.quantity || 1,
    unit: note.unit || detected?.unit || 'kg',
    price: note.estimatedPrice || '',
    purchaseDate: today(),
    shelfLifeDays: detected?.shelfLifeDays || 7,
    pantryState: 'FULL',
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const confirmMoveToInventory = () => {
    const expiryDate =
      form.track === 'produce' ? calcExpiry(form.purchaseDate, form.shelfLifeDays) : undefined;
    onBuy(note.id, {
      name: form.name || note.name,
      track: form.track,
      category: note.category || 'Pantry',
      quantity: parseFloat(form.quantity) || 1,
      unit: form.unit || 'kg',
      price: parseFloat(form.price) || 0,
      ...(form.track === 'produce'
        ? { purchaseDate: form.purchaseDate, shelfLifeDays: parseInt(form.shelfLifeDays, 10), expiryDate }
        : { pantryState: form.pantryState }),
    });
    setOpen(false);
  };

  const formattedQty = formatQuantity(note.quantity, note.unit);

  return (
    <div
      className="surface-raised"
      style={{
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
      }}
    >
      {/* Main Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'var(--surface-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: 18,
          }}
        >
          {EMOJI[note.category] || '🛒'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {note.name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
            {note.category && <span className="badge badge-cat">{note.category}</span>}
            {/* Quantity Measurement Badge */}
            {formattedQty && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  background: 'var(--surface-2)',
                  padding: '1px 6px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Scale size={10} />
                {formattedQty}
              </span>
            )}
            {note.estimatedPrice > 0 && (
              <span style={{ fontSize: 11, color: 'var(--green-light)', fontWeight: 600 }}>
                Est. {formatCurrency(note.estimatedPrice, currentCurrency)}
              </span>
            )}
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Needed</span>
          </div>
        </div>

        {/* Action Buttons: Move to Inventory & Delete */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            id={`move-inventory-btn-${note.id}`}
            type="button"
            className="btn btn-primary"
            style={{ padding: '7px 12px', fontSize: 12.5 }}
            onClick={() => setOpen((o) => !o)}
            title="Transfer bought item into active kitchen stock"
          >
            <PackagePlus size={13} />
            <span>Move to Inventory</span>
            {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            style={{ padding: '7px 9px' }}
            onClick={() => onDelete(note.id)}
            title="Delete note"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Expandable Move to Inventory Form */}
      {open && (
        <div
          style={{
            padding: '14px 16px 16px',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface-2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Configure Active Inventory Entry
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: 0 }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Track Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              ['produce', '🥬', 'Fresh Produce (Expiry countdown)'],
              ['pantry', '🥫', 'Dry Pantry (3-state stock)'],
            ].map(([v, e, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => set('track', v)}
                style={{
                  padding: '9px 10px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  border: `1px solid ${form.track === v ? 'var(--green)' : 'var(--border)'}`,
                  background: form.track === v ? 'var(--green-glow)' : 'var(--bg-raised)',
                  color: form.track === v ? 'var(--green-light)' : 'var(--text-muted)',
                  transition: 'all 0.14s ease',
                }}
              >
                <span>{e}</span>
                <span>{l}</span>
              </button>
            ))}
          </div>

          {/* Quantity & Measurement Unit Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.6fr', gap: 10 }}>
            <div>
              <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Scale size={11} /> Quantity
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                className="field"
                style={{ fontSize: 12.5 }}
                value={form.quantity}
                onChange={(e) => set('quantity', e.target.value)}
              />
            </div>
            <div>
              <label className="field-label">Measurement Unit</label>
              <select
                className="field"
                style={{ fontSize: 12.5 }}
                value={form.unit}
                onChange={(e) => set('unit', e.target.value)}
              >
                {MEASUREMENT_UNITS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.short} ({u.fullName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price Input in Active Currency */}
          <div>
            <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <DollarSign size={11} /> Price ({formatCurrency(0, currentCurrency).replace(/\d+.*$/, '')})
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              className="field"
              placeholder="0.00"
              style={{ fontSize: 12.5 }}
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
            />
          </div>

          {form.track === 'produce' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={11} /> Purchase Date
                </label>
                <input
                  type="date"
                  className="field"
                  style={{ fontSize: 12.5 }}
                  value={form.purchaseDate}
                  onChange={(e) => set('purchaseDate', e.target.value)}
                />
              </div>
              <div>
                <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={11} /> Shelf Life (days)
                </label>
                <input
                  type="number"
                  className="field"
                  style={{ fontSize: 12.5 }}
                  min={1}
                  value={form.shelfLifeDays}
                  onChange={(e) => set('shelfLifeDays', e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="field-label">Starting Stock Level</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {PANTRY_STATES.map((s) => {
                  const pc = PANTRY_CHIP[s];
                  const active = form.pantryState === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set('pantryState', s)}
                      style={{
                        padding: '8px 0',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        border: `1px solid ${active ? pc.border : 'var(--border)'}`,
                        background: active ? pc.bg : 'var(--bg-raised)',
                        color: active ? pc.color : 'var(--text-dim)',
                        cursor: 'pointer',
                        transition: 'all 0.14s ease',
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center', padding: '9px 0', fontSize: 13, fontWeight: 700 }}
              onClick={confirmMoveToInventory}
            >
              <ArrowRight size={14} /> Confirm &amp; Move to Inventory
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: '9px 12px' }}
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
