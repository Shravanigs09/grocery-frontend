// src/components/Layout/Sidebar.jsx
// Exact visual match to the Grove View Left Navigation Bar
import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  TrendingUp,
  Settings as SettingsIcon,
  LogOut,
  ChevronRight,
  Sprout,
  Users,
  Check,
  Plus,
  ChefHat,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'planner',   label: 'Meal Plan', icon: ChefHat },
  { id: 'shopping',  label: 'Shopping List', icon: ClipboardList },
  { id: 'insights',  label: 'Insights', icon: TrendingUp },
  { id: 'settings',  label: 'Settings', icon: SettingsIcon },
];

export default function Sidebar({ activeTab, setActiveTab, onOpenAuth }) {
  const { user, isGuest, logout, knownAccounts = [], switchAccount } = useAuth();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const menuRef = useRef(null);

  // Close account switcher on outside click
  useEffect(() => {
    if (!showAccountMenu) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAccountMenu]);

  const getInitials = (name = '') => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <aside
      style={{
        width: 240,
        flexShrink: 0,
        background: 'var(--surface, #ffffff)',
        borderRight: '1px solid var(--border, #e5e9f0)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxSizing: 'border-box',
        padding: '24px 14px',
        transition: 'background 0.2s ease, border-color 0.2s ease',
      }}
      className="grove-sidebar"
    >
      {/* Top Brand Logo & Navigation */}
      <div>
        {/* Brand Logo & Name */}
        <div
          onClick={() => setActiveTab('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '4px 10px 24px',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          {/* Green Sprout Leaf Icon from Mockup */}
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, var(--green, #16a34a), var(--green-light, #15803d))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 8px var(--green-glow, rgba(22, 163, 74, 0.25))',
              flexShrink: 0,
            }}
          >
            <Sprout size={18} />
          </div>
          <span
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text, #1e293b)',
              lineHeight: 1,
            }}
          >
            Grovio
          </span>
        </div>

        {/* Navigation Items List */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 12,
                  border: 'none',
                  background: isActive ? 'var(--green-glow, #dcfce7)' : 'transparent',
                  color: isActive ? 'var(--green, #15803d)' : 'var(--text-muted, #64748b)',
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--surface-2, #f8fafc)';
                    e.currentTarget.style.color = 'var(--text, #1e293b)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted, #64748b)';
                  }
                }}
              >
                {/* Left vertical green indicator accent bar when active (as seen in Image 3) */}
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      left: -14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 4,
                      height: 24,
                      borderRadius: '0 4px 4px 0',
                      background: 'var(--green, #16a34a)',
                    }}
                  />
                )}
                <Icon size={18} color={isActive ? 'var(--green, #16a34a)' : 'var(--text-muted, #64748b)'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: User Profile Card & Multi-Account Switcher */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
        {showAccountMenu && user && (
          <div
            ref={menuRef}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              right: 0,
              marginBottom: 8,
              background: 'var(--surface, #ffffff)',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: 14,
              padding: '10px 8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
              zIndex: 100,
            }}
          >
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted, #64748b)', padding: '4px 8px 6px', borderBottom: '1px solid var(--border-soft, #f1f5f9)', letterSpacing: '0.05em' }}>
              YOUR ACCOUNTS
            </div>
            <div style={{ maxHeight: 180, overflowY: 'auto', margin: '4px 0' }}>
              {knownAccounts.map((acc) => {
                const isCurrent = (acc.username && user.username && acc.username.toLowerCase() === user.username.toLowerCase()) || acc.id === user.id;
                return (
                  <div
                    key={acc.id || acc.username}
                    onClick={() => {
                      if (!isCurrent && switchAccount) switchAccount(acc);
                      setShowAccountMenu(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 8px',
                      borderRadius: 8,
                      cursor: isCurrent ? 'default' : 'pointer',
                      background: isCurrent ? 'var(--surface-2, #f1f5f9)' : 'transparent',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrent) e.currentTarget.style.background = 'var(--surface-2, #f8fafc)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrent) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: '50%',
                          background: isCurrent ? 'var(--green, #16a34a)' : 'var(--text-dim, #94a3b8)',
                          color: '#fff',
                          fontSize: 10.5,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {(acc.name || acc.username || 'U').slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text, #1e293b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {acc.name || acc.username}
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted, #64748b)' }}>
                          @{acc.username}
                        </div>
                      </div>
                    </div>
                    {isCurrent && <Check size={14} color="var(--green, #16a34a)" strokeWidth={2.5} />}
                  </div>
                );
              })}
              {knownAccounts.length <= 1 && (
                <div style={{ padding: '8px 10px', fontSize: 11, color: 'var(--text-muted, #64748b)', textAlign: 'center' }}>
                  No other accounts for this user yet
                </div>
              )}
            </div>
            <div style={{ borderTop: '1px solid var(--border-soft, #f1f5f9)', paddingTop: 6, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => {
                  setShowAccountMenu(false);
                  if (user?.id) {
                    sessionStorage.setItem('grovio_linking_account_from', user.id);
                  }
                  logout();
                  if (onOpenAuth) onOpenAuth();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 8px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--green, #16a34a)',
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Plus size={13} />
                <span>+ Add Another Account</span>
              </button>
            </div>
          </div>
        )}

        {user && !isGuest ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: 12,
              background: 'var(--surface-2, #f8fafc)',
              border: '1px solid var(--border, #e2e8f0)',
            }}
          >
            <div
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              title="Click to Switch Accounts"
              style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, cursor: 'pointer' }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--green, #16a34a), var(--green-light, #15803d))',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {getInitials(user.name)}
              </div>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text, #1e293b)',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                >
                  {user.name || user.username || 'Admin User'}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--text-muted, #64748b)',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                  }}
                >
                  @{user.username || (user.email ? user.email.split('@')[0] : 'user')}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button
                type="button"
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                title="Switch Account"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  background: showAccountMenu ? 'var(--green-glow, rgba(22, 163, 74, 0.15))' : 'transparent',
                  color: showAccountMenu ? 'var(--green, #16a34a)' : 'var(--text-dim, #94a3b8)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Users size={14} />
              </button>

              <button
                type="button"
                onClick={logout}
                title="Sign Out"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-dim, #94a3b8)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ef4444';
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-dim, #94a3b8)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 12,
              background: 'var(--green, #16a34a)',
              color: '#ffffff',
              border: 'none',
              fontSize: 13.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 2px 6px var(--green-glow, rgba(22, 163, 74, 0.25))',
            }}
          >
            <span>Sign In</span>
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </aside>
  );
}
