// src/components/Notifications/MorningDigestModal.jsx
// Morning Kitchen Digest & Food Preservation Briefing
import React from 'react';
import {
  Sun,
  X,
  ChefHat,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { markDigestSeenToday } from '../../utils/notifications';

export default function MorningDigestModal({
  isOpen,
  onClose,
  expiringProduce = [],
  lowPantry = [],
  onOpenRecipes,
  onAddNotes,
}) {
  if (!isOpen) return null;

  const handleDismiss = () => {
    markDigestSeenToday();
    onClose();
  };

  const handleRescueClick = () => {
    markDigestSeenToday();
    onClose();
    if (onOpenRecipes) onOpenRecipes(expiringProduce);
  };

  const handleRestockClick = () => {
    if (onAddNotes && lowPantry.length > 0) {
      lowPantry.forEach((p) => {
        onAddNotes({
          name: p.name,
          category: p.category || 'Pantry',
          targetPanel: 'PANTRY',
        });
      });
    }
    markDigestSeenToday();
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleDismiss();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: '#ffffff',
          borderRadius: 20,
          border: '1px solid #e2e8f0',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeIn 0.22s ease-out',
        }}
      >
        {/* Sunrise Header */}
        <div
          style={{
            padding: '22px 24px',
            background: 'linear-gradient(135deg, #fef3c7 0%, #ecfdf5 100%)',
            borderBottom: '1px solid #fde68a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#f59e0b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 8px rgba(245, 158, 11, 0.3)',
              }}
            >
              <Sun size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#78350f', margin: 0 }}>
                  Morning Kitchen Digest
                </h3>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 99,
                    background: '#ffffff',
                    color: '#b45309',
                    border: '1px solid #fde68a',
                  }}
                >
                  Daily Briefing
                </span>
              </div>
              <p style={{ fontSize: 12.5, color: '#92400e', margin: '3px 0 0' }}>
                Good morning! Here is your food preservation summary for today.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: 'none',
              background: 'rgba(255, 255, 255, 0.7)',
              color: '#78350f',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Digest Content */}
        <div style={{ padding: '20px 24px', maxHeight: '60vh', overflowY: 'auto' }}>
          {/* Expiring Produce Section */}
          {expiringProduce.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={13} /> Expiring Soon ({expiringProduce.length})
                </label>
                <span style={{ fontSize: 11.5, color: '#64748b' }}>Needs rescue today</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {expiringProduce.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid #fee2e2',
                      background: '#fffbfb',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>🥬</span>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748b' }}>
                          {item.category || 'Fresh Produce'}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 99,
                        background: (item.daysLeft ?? 1) <= 1 ? '#fee2e2' : '#fef3c7',
                        color: (item.daysLeft ?? 1) <= 1 ? '#ef4444' : '#b45309',
                      }}
                    >
                      {item.daysLeft === 0 ? 'Expires Today' : `${item.daysLeft ?? 1} Day${item.daysLeft !== 1 ? 's' : ''} Left`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Low Pantry Items Section */}
          {lowPantry.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShoppingCart size={13} /> Running Low ({lowPantry.length})
                </label>
                <span style={{ fontSize: 11.5, color: '#64748b' }}>Pantry restock</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lowPantry.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid #fed7aa',
                      background: '#fffaf5',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>🍞</span>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e293b' }}>
                        {item.name}
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 99,
                        background: '#fee2e2',
                        color: '#ef4444',
                      }}
                    >
                      LOW
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {expiringProduce.length === 0 && lowPantry.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <CheckCircle2 size={36} color="#16a34a" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Your kitchen is in peak shape!
              </p>
              <p style={{ fontSize: 12.5, color: '#64748b', margin: '4px 0 0' }}>
                All ingredients are fresh with optimal shelf life.
              </p>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #f1f5f9',
            background: '#fafbfc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          {lowPantry.length > 0 ? (
            <button
              type="button"
              onClick={handleRestockClick}
              style={{
                padding: '8px 14px',
                borderRadius: 9,
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <ShoppingCart size={13} />
              <span>Restock Low Items</span>
            </button>
          ) : (
            <div />
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            {expiringProduce.length > 0 && (
              <button
                type="button"
                onClick={handleRescueClick}
                style={{
                  padding: '9px 18px',
                  borderRadius: 9,
                  border: 'none',
                  background: '#166534',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 6px rgba(22, 101, 52, 0.25)',
                }}
              >
                <ChefHat size={15} />
                <span>Rescue with Recipe 🍳</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDismiss}
              style={{
                padding: '9px 16px',
                borderRadius: 9,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#64748b',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Start Day ✓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
