// src/components/Inventory/PantryCard.jsx
import React, { useState } from 'react';
import { Trash2, ShoppingCart, TrendingDown, CheckCircle2, AlertTriangle, Scale, Pencil, X, Save } from 'lucide-react';
import { useSettings, formatCurrency, formatQuantity, MEASUREMENT_UNITS } from '../../store/useSettings';

const STATES = ['FULL', 'HALF', 'LOW'];
const STATE_CONFIG = {
  FULL: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.25)', fill: 100 },
  HALF: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.25)', fill: 50 },
  LOW:  { color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)',  border: 'rgba(244, 63, 94, 0.25)',  fill: 18 },
};

const EMOJI = { Dairy: '🥛', Vegetables: '🥬', Fruit: '🍓', Meat: '🥩', Pantry: '🥫', Bakery: '🍞' };

function computeForecast(history = [], currentState) {
  if (!history || history.length < 2) return null;

  const intervals = [];
  for (let i = 1; i < history.length; i++) {
    const diff = (new Date(history[i].timestamp) - new Date(history[i - 1].timestamp)) / 86400000;
    if (diff > 0) intervals.push(diff);
  }
  if (!intervals.length) return null;

  const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const stepsLeft = { FULL: 2, HALF: 1, LOW: 0 }[currentState] ?? 0;
  const daysLeft = Math.round(avg * stepsLeft);

  if (stepsLeft === 0) {
    return { daysLeft: 0, confidence: intervals.length >= 2 ? 'high' : 'medium', restockNow: true };
  }

  const restockBy = new Date();
  restockBy.setDate(restockBy.getDate() + daysLeft);
  const restockStr = restockBy.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return {
    daysLeft,
    restockBy: restockStr,
    restockNow: daysLeft <= 2,
    confidence: intervals.length >= 3 ? 'high' : 'medium',
  };
}

export default function PantryCard({ item, onToggle, onDelete, onAddToRestock, onConsume, onWaste, onUpdate }) {
  const [settings] = useSettings();
  const currentCurrency = settings.regional?.currency || 'INR';

  const [editing, setEditing] = useState(false);
  const [ef, setEf] = useState({
    name: item.name,
    quantity: item.quantity ?? 1,
    unit: item.unit || 'kg',
    price: item.price ?? 0,
  });

  const cfg = STATE_CONFIG[item.pantryState] || STATE_CONFIG.FULL;
  const isLow = item.pantryState === 'LOW';
  const isHalf = item.pantryState === 'HALF';

  const forecast = computeForecast(item.stateTransitionHistory, item.pantryState);
  const formattedQty = formatQuantity(item.quantity, item.unit);

  const save = () => {
    if (onUpdate) {
      onUpdate(item.id, {
        name: ef.name.trim(),
        quantity: parseFloat(ef.quantity) || 1,
        unit: ef.unit || 'kg',
        price: parseFloat(ef.price) || 0,
      });
    }
    setEditing(false);
  };

  return (
    <div
      className="card"
      style={{
        padding: 16,
        borderRadius: 14,
        background: 'var(--surface)',
        border: `1px solid ${isLow ? 'rgba(244, 63, 94, 0.35)' : 'var(--border)'}`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: isLow ? '0 2px 10px rgba(244, 63, 94, 0.08)' : '0 1px 3px rgba(0,0,0,0.03)',
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
        <div>
          {/* Top Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', minWidth: 0 }}>
              <span style={{ fontSize: 26, lineHeight: 1, flexShrink: 0 }}>{EMOJI[item.category] || '🥫'}</span>
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
                  <span className="badge badge-cat">{item.category || 'Pantry'}</span>
                  {/* Quantity measurement badge */}
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
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn-icon" onClick={() => setEditing(true)} title="Edit details">
                <Pencil size={13} />
              </button>
              <button className="btn-icon" onClick={() => onDelete(item.id)} title="Remove item">
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Stock Level Bar */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>Current Stock Level</span>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: cfg.color }}>{item.pantryState}</span>
            </div>
            <div className="stock-bar-track" style={{ background: 'var(--surface-2)', height: 6, borderRadius: 99, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  borderRadius: 99,
                  width: `${cfg.fill}%`,
                  background: cfg.color,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>

          {/* 3-State Toggle: FULL -> HALF -> LOW */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
            {STATES.map((s) => {
              const sc = STATE_CONFIG[s];
              const active = item.pantryState === s;
              return (
                <button
                  key={s}
                  id={`pantry-toggle-${item.id}-${s.toLowerCase()}`}
                  type="button"
                  onClick={() => onToggle(item.id, s)}
                  style={{
                    padding: '7px 0',
                    borderRadius: 8,
                    fontSize: 11.5,
                    fontWeight: 700,
                    border: `1px solid ${active ? sc.border : 'var(--border)'}`,
                    background: active ? sc.bg : 'var(--bg-raised)',
                    color: active ? sc.color : 'var(--text-muted)',
                    transition: 'all 0.14s ease',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>

          {/* Predictive Restock Indicator */}
          {forecast && (isLow || isHalf) && (
            <div
              style={{
                padding: '9px 11px',
                borderRadius: 9,
                marginBottom: 10,
                border: `1px solid ${forecast.restockNow ? 'rgba(244, 63, 94, 0.3)' : 'rgba(245, 158, 11, 0.25)'}`,
                background: forecast.restockNow ? 'var(--coral-soft)' : 'var(--amber-soft)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              <TrendingDown
                size={14}
                color={forecast.restockNow ? 'var(--coral)' : 'var(--amber)'}
                style={{ flexShrink: 0, marginTop: 1 }}
              />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text)', lineHeight: 1.3 }}>
                  {forecast.restockNow
                    ? `Depleted quickly — needs restocking now.`
                    : `Runs low in ~${forecast.daysLeft} day${forecast.daysLeft !== 1 ? 's' : ''}.`}
                </p>
                <p style={{ fontSize: 10.5, color: 'var(--text-dim)', marginTop: 2 }}>
                  {forecast.restockNow ? 'Add to shopping list.' : `Restock by ${forecast.restockBy}.`}
                </p>
              </div>
            </div>
          )}

          {/* LOW Banner Shortcut */}
          {isLow && onAddToRestock && (
            <div
              className="alert-row"
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                background: 'var(--coral-soft)',
                border: '1px solid rgba(244, 63, 94, 0.2)',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: 11.5, color: 'var(--coral)', fontWeight: 600 }}>Stock is LOW</span>
              <button
                type="button"
                onClick={() => onAddToRestock(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: 'var(--coral)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <ShoppingCart size={12} /> Add to list
              </button>
            </div>
          )}
        </div>
      )}

      {/* Row Actions: Consumed & Wasted */}
      <div style={{ display: 'flex', gap: 6, borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
        <button
          className="btn btn-primary"
          style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '6px 8px' }}
          onClick={() => onConsume && onConsume(item.id)}
          title="Mark pantry item as consumed"
        >
          <CheckCircle2 size={12} /> Consumed
        </button>
        <button
          className="btn btn-amber"
          style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '6px 8px' }}
          onClick={() => onWaste && onWaste(item.id)}
          title="Mark as wasted"
        >
          <AlertTriangle size={12} /> Wasted
        </button>
      </div>
    </div>
  );
}
