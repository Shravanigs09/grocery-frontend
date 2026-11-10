// src/components/Layout/UserProfileChip.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { getActiveHouseholdCode } from '../../services/api';

export default function UserProfileChip({ roleLabel, showEmail = true }) {
  const { user } = useAuth();

  const name = user?.name || user?.username || 'User';
  const email = user?.email || (user?.username ? `@${user.username}` : '');
  const initial = name ? name[0].toUpperCase() : 'U';
  const householdCode = user?.householdCode || getActiveHouseholdCode();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        userSelect: 'none',
      }}
    >
      {householdCode && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 99,
            background: '#dcfce7',
            color: '#166534',
            border: '1px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
          title={`Shared Household Kitchen: ${householdCode}`}
        >
          <span>🏡</span>
          <span>{householdCode}</span>
        </span>
      )}

      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #16a34a, #15803d)',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(22, 163, 74, 0.2)',
          flexShrink: 0,
        }}
      >
        {initial}
      </div>
      <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text, #1e293b)' }}>
          {roleLabel || name}
        </div>
        {showEmail && (
          <div style={{ fontSize: 11, color: 'var(--text-muted, #64748b)' }}>
            {email}
          </div>
        )}
      </div>
    </div>
  );
}
