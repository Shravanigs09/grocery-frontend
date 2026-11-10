// src/components/Layout/NotificationStack.jsx
import { X, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

const CONFIG = {
  success: { Icon: CheckCircle2, iconColor: '#5ecb8a', cls: 'success' },
  warn:    { Icon: AlertTriangle, iconColor: '#e09352', cls: '' },
  danger:  { Icon: AlertCircle,  iconColor: '#e07268', cls: 'danger' },
};

export default function NotificationStack({ notifications, dismiss }) {
  if (!notifications.length) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 16,
      zIndex: 100, display: 'flex', flexDirection: 'column', gap: 8,
      width: 300, maxWidth: 'calc(100vw - 32px)',
    }}>
      {notifications.map((n) => {
        const { Icon, iconColor, cls } = CONFIG[n.type] || CONFIG.warn;
        return (
          <div key={n.id} className={`alert-row ${cls}`}
            style={{ animation: 'slide-down 0.22s ease', boxShadow: '0 6px 24px rgba(0,0,0,0.35)' }}>
            <Icon size={15} color={iconColor} style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 13, color: 'var(--text)', flex: 1 }}>{n.msg}</span>
            <button className="btn-icon" onClick={() => dismiss(n.id)} style={{ padding: 2, flexShrink: 0 }}>
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
