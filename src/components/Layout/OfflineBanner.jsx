// src/components/Layout/OfflineBanner.jsx
// Offline connectivity status indicator
import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {/* ── Offline Alert Banner ── */}
      {!isOnline && (
        <div
          style={{
            position: 'fixed',
            top: 14,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2000,
            background: '#0f172a',
            color: '#ffffff',
            padding: '8px 18px',
            borderRadius: 99,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            animation: 'fadeIn 0.2s ease',
            fontSize: 12.5,
            fontWeight: 600,
          }}
        >
          <WifiOff size={15} color="#f87171" />
          <span>Offline Mode: Shopping checklist &amp; inventory saved locally.</span>
        </div>
      )}

      {/* ── Connection Restored Toast ── */}
      {showRestored && (
        <div
          style={{
            position: 'fixed',
            top: 14,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2000,
            background: '#166534',
            color: '#ffffff',
            padding: '8px 18px',
            borderRadius: 99,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 8px 24px rgba(22, 101, 52, 0.35)',
            animation: 'fadeIn 0.2s ease',
            fontSize: 12.5,
            fontWeight: 600,
          }}
        >
          <Wifi size={15} color="#86efac" />
          <span>Back online — Kitchen synced!</span>
        </div>
      )}
    </>
  );
}
