// src/components/Notifications/NotificationBellDropdown.jsx
// Interactive Kitchen Notification Center & Desktop Alert Bridge
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Bell,
  ShoppingCart,
  ChefHat,
  Sun,
  Check,
} from 'lucide-react';
import {
  getExpiringAndLowAlerts,
  getNotificationPermissionStatus,
  requestDesktopNotificationPermission,
  sendDesktopAlert,
} from '../../utils/notifications';

export default function NotificationBellDropdown({
  items = [],
  onOpenRescueRecipes,
  onAddNote,
  onOpenMorningDigest,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState(() => getNotificationPermissionStatus());
  const dropdownRef = useRef(null);

  // Calculate live alerts
  const { expiringProduce, lowPantry, totalCount } = useMemo(() => {
    return getExpiringAndLowAlerts(items);
  }, [items]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleEnableDesktopAlerts = async () => {
    const res = await requestDesktopNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      sendDesktopAlert(
        'Grovio Alerts Enabled 🌿',
        'You will receive morning notifications for groceries nearing expiration!'
      );
    }
  };

  const handleTestAlert = () => {
    if (permission === 'granted') {
      sendDesktopAlert(
        'Grovio Kitchen Alert 🌿',
        expiringProduce.length > 0
          ? `${expiringProduce[0].name} expires soon! Rescue it with a 15-min recipe.`
          : 'Your kitchen stock is looking fresh and healthy today!'
      );
    } else {
      handleEnableDesktopAlerts();
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* ── Bell Icon Button (Image 4 & 5 Exact Style) ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Kitchen Notifications"
        style={{
          position: 'relative',
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: isOpen ? '#f1f5f9' : '#ffffff',
          border: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: totalCount > 0 ? '#1e293b' : '#64748b',
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.15s ease',
        }}
      >
        <Bell size={16} />

        {/* Orange Alert Dot / Badge */}
        {totalCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 5,
              right: 5,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#ea580c',
              border: '2px solid #ffffff',
            }}
          />
        )}
      </button>

      {/* ── Floating Notification Dropdown ── */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: 340,
            maxWidth: 'calc(100vw - 32px)',
            background: '#ffffff',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.15)',
            zIndex: 1050,
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid #f1f5f9',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Bell size={15} color="#166534" />
              <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                Kitchen Alerts ({totalCount})
              </span>
            </div>

            {onOpenMorningDigest && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenMorningDigest();
                }}
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: '#b45309',
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  padding: '2px 8px',
                  borderRadius: 99,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Sun size={11} />
                <span>Digest</span>
              </button>
            )}
          </div>

          {/* Alert Cards Container */}
          <div style={{ maxHeight: 320, overflowY: 'auto', padding: '12px 14px' }}>
            {totalCount === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b' }}>
                <Check size={28} color="#16a34a" style={{ margin: '0 auto 6px' }} />
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: '#1e293b' }}>
                  No active alerts!
                </p>
                <p style={{ fontSize: 11.5, margin: '2px 0 0' }}>
                  All your groceries are well within safe shelf life.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Expiring produce items */}
                {expiringProduce.map((item, idx) => (
                  <div
                    key={`exp-${idx}`}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #fee2e2',
                      background: '#fffbfb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>
                        {item.daysLeft === 0 ? 'Expires Today' : `${item.daysLeft} Day${item.daysLeft !== 1 ? 's' : ''} Left`}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        if (onOpenRescueRecipes) onOpenRescueRecipes([item]);
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: 'none',
                        background: '#166534',
                        color: '#ffffff',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <ChefHat size={12} />
                      <span>Rescue</span>
                    </button>
                  </div>
                ))}

                {/* Low pantry items */}
                {lowPantry.map((item, idx) => (
                  <div
                    key={`low-${idx}`}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #fed7aa',
                      background: '#fffaf5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 11, color: '#ea580c', fontWeight: 600 }}>
                        Running LOW in pantry
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (onAddNote) {
                          onAddNote({
                            name: item.name,
                            category: item.category || 'Pantry',
                            targetPanel: 'PANTRY',
                          });
                        }
                        setIsOpen(false);
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid #fdba74',
                        background: '#ffffff',
                        color: '#c2410c',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <ShoppingCart size={11} />
                      <span>+ Buy</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Notification Footer */}
          <div
            style={{
              padding: '10px 14px',
              borderTop: '1px solid #f1f5f9',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {permission === 'granted' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#166534', fontWeight: 600 }}>
                <Check size={13} />
                <span>Desktop alerts active</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleEnableDesktopAlerts}
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: '#166534',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Bell size={12} />
                <span>Enable Desktop Alerts</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleTestAlert}
              style={{
                fontSize: 11,
                color: '#64748b',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Test Alert
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
