// src/components/Inventory/ProduceCard.jsx
import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Trash2, Pencil, X, Save, Clock, Scale } from 'lucide-react';
import ExpiryBadge, { getExpiryStatus } from './ExpiryBadge';
import { useSettings, formatCurrency, formatQuantity, MEASUREMENT_UNITS } from '../../store/useSettings';

const CATEGORIES = ['Dairy', 'Vegetables', 'Fruit', 'Meat', 'Pantry', 'Bakery'];
const EMOJI = { Dairy: '🥛', Vegetables: '🥬', Fruit: '🍓', Meat: '🥩', Pantry: '🥫', Bakery: '🍞' };

const STORAGE_LABELS = {
  fridge: '❄️ Fridge',
  freezer: '🧊 Freezer',
  pantry: '🗄️ Pantry',
  counter: '🍽️ Counter',
};

export default function ProduceCard({ item, onConsume, onWaste, onDelete, onUpdate }) {
  const [settings] = useSettings();
  const currentCurrency = settings.regional?.currency || 'INR';

  const [editing, setEditing] = useState(false);
  const [ef, setEf] = useState({
    name: item.name,
    category: item.category,
    quantity: item.quantity ?? 1,
    unit: item.unit || 'kg',
    price: item.price ?? 0,
    shelfLifeDays: item.shelfLifeDays || 5,
    storageLocation: item.storageLocation || 'fridge',
  });

  const { status, daysLeft } = getExpiryStatus(item.expiryDate);
  const borderColor =
    status === 'urgent'
      ? 'rgba(244, 63, 94, 0.45)'
      : status === 'warn'
      ? 'rgba(245, 158, 11, 0.35)'
      : 'var(--border)';

  const save = () => {
    onUpdate(item.id, {
      name: ef.name.trim(),
      category: ef.category,
      quantity: parseFloat(ef.quantity) || 1,
      unit: ef.unit || 'kg',
      price: parseFloat(ef.price) || 0,
      shelfLifeDays: parseInt(ef.shelfLifeDays, 10) || 5,
      storageLocation: ef.storageLocation,
    });
    setEditing(false);
  };

  const formattedQty = formatQuantity(item.quantity, item.unit);

  return (
    <div
      className="card"
      style={{
        padding: 16,
        borderRadius: 14,
        background: 'var(--surface)',
        border: `1px solid ${borderColor}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: status === 'urgent' ? '0 2px 10px rgba(244, 63, 94, 0.08)' : '0 1px 3px rgba(0,0,0,0.03)',
      }}
    >
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            className="field"
            style={{ fontSize: 13 }}
            value={ef.name}
            onChange={(e) => setEf((f) => ({ ...f, name: e.target.value }))}
            placeholder="Item name"
          />

          {/* Quantity & Unit measurements */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 10.5, color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>Qty</label>
              <input
                className="field"
                style={{ fontSize: 12.5 }}
                type="number"
                step="0.1"
                min="0.1"
                value={ef.quantity}
                onChange={(e) => setEf((f) => ({ ...f, quantity: e.target.value }))}
              />
            </div>
            <div>
              <label style={{ fontSize: 10.5, color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>Unit</label>
              <select
                className="field"
                style={{ fontSize: 12.5 }}
                value={ef.unit}
                onChange={(e) => setEf((f) => ({ ...f, unit: e.target.value }))}
              >
                {MEASUREMENT_UNITS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.short} ({u.fullName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Price & Shelf Days */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 10.5, color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>
                Price ({formatCurrency(0, currentCurrency).replace(/\d+.*$/, '')})
              </label>
              <input
                className="field"
                style={{ fontSize: 12.5 }}
                type="number"
                step="0.1"
                min="0"
                value={ef.price}
                onChange={(e) => setEf((f) => ({ ...f, price: e.target.value }))}
              />
            </div>
            <div>
              <label style={{ fontSize: 10.5, color: 'var(--text-dim)', display: 'block', marginBottom: 2 }}>Shelf days</label>
              <input
                className="field"
                style={{ fontSize: 12.5 }}
                type="number"
                min={1}
                value={ef.shelfLifeDays}
                onChange={(e) => setEf((f) => ({ ...f, shelfLifeDays: e.target.value }))}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
            <select
              className="field"
              style={{ fontSize: 12.5 }}
              value={ef.category}
              onChange={(e) => setEf((f) => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 12.5 }} onClick={save}>
              <Save size={13} /> Save
            </button>
            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', fontSize: 12.5 }} onClick={() => setEditing(false)}>
              <X size={13} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Top Row: Emoji, Name, Quantity & Price */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', minWidth: 0 }}>
                <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>{EMOJI[item.category] || '🥬'}</span>
                <div style={{ minWidth: 0 }}>
                  <p
                    style={{
                      fontWeight: 700,
                      color: 'var(--text)',
                      fontSize: 14.5,
                      lineHeight: 1.3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                    <span className="badge badge-cat">{item.category}</span>
                    {/* Quantity Badge with Measurement Unit (kg, L, gal, etc.) */}
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
                    {/* Dynamic Converted Price */}
                    {item.price > 0 && (
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--green-light)' }}>
                        {formatCurrency(item.price, currentCurrency)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button className="btn-icon" onClick={() => setEditing(true)} title="Edit details">
                <Pencil size={13} />
              </button>
            </div>

            {/* Decay / Expiry Countdown */}
            <div style={{ marginBottom: 16 }}>
              <ExpiryBadge expiryDate={item.expiryDate} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, flexWrap: 'wrap', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-dim)' }}>
                  <Clock size={11} />
                  <span>
                    {daysLeft !== null && daysLeft !== undefined
                      ? daysLeft <= 0
                        ? 'Expired / Expires today'
                        : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`
                      : 'Target date: ' + (item.expiryDate || 'N/A')}
                  </span>
                </div>
                {item.storageLocation && (
                  <span style={{ fontSize: 10.5, color: 'var(--text-dim)' }}>
                    {STORAGE_LABELS[item.storageLocation] || item.storageLocation}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Row Actions: Consumed, Wasted, Delete */}
          <div style={{ display: 'flex', gap: 6, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1, justifyContent: 'center', fontSize: 12.5, padding: '7px 8px' }}
              onClick={() => onConsume(item.id)}
              title="Mark as Consumed"
            >
              <CheckCircle2 size={13} /> Consumed
            </button>
            <button
              className="btn btn-amber"
              style={{ flex: 1, justifyContent: 'center', fontSize: 12.5, padding: '7px 8px' }}
              onClick={() => onWaste(item.id)}
              title="Mark as Spoiled / Wasted"
            >
              <AlertTriangle size={13} /> Wasted
            </button>
            <button
              className="btn btn-danger"
              style={{ padding: '7px 9px', justifyContent: 'center' }}
              onClick={() => onDelete(item.id)}
              title="Delete item"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
