// src/components/Inventory/ExpiryBadge.jsx
import { parseLocalDate, todayKey } from '../../utils/dates';
import { getSettings } from '../../store/useSettings';

export function getExpiryStatus(expiryDate, customWindowHours = null) {
  const windowHours = customWindowHours ?? (getSettings()?.preservation?.spoilageWindowHours || 48);
  const now = parseLocalDate(todayKey());
  const exp = parseLocalDate(expiryDate);
  if (!now || !exp) return { status: 'fresh', label: 'Fresh', daysLeft: null };
  const diffH = (exp - now) / 36e5;
  if (diffH > windowHours) return { status: 'fresh',  label: 'Fresh',      daysLeft: Math.ceil(diffH / 24) };
  if (diffH > 0)  return { status: 'warn',   label: 'Check soon', daysLeft: Math.ceil(diffH / 24) };
  return             { status: 'urgent', label: 'Urgent',     daysLeft: 0 };
}

export default function ExpiryBadge({ expiryDate }) {
  const { status, label, daysLeft } = getExpiryStatus(expiryDate);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span className={`badge badge-${status}`}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
        {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
      </span>
    </div>
  );
}
