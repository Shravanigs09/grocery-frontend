// src/components/Settings/SettingsPage.jsx
// Grovio Clean & Simple Settings
// Includes only the requested essentials:
// 1. Profile & Household (NO chef titles)
// 2. Measurement Units & Currency
// 3. Freshness & Expiry Alerts
// 4. Themes (At least 4 distinct options)
// 5. Account & Security

import React, { useState, useEffect } from 'react';
import {
  User,
  Users,
  Scale,
  Bell,
  Palette,
  ShieldCheck,
  Lock,
  LogOut,
  Check,
  AlertCircle,
  Sparkles,
  Info,
  Clock,
  Save,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import {
  useSettings,
  updateSettings,
  applyTheme,
  THEMES,
} from '../../store/useSettings';
import {
  getNotificationPermissionStatus,
  requestDesktopNotificationPermission,
  sendDesktopAlert,
} from '../../utils/notifications';
import { useAuth } from '../../context/AuthContext';
import HouseholdSettingsCard from './HouseholdSettingsCard';

export default function SettingsPage({ onOpenAuth }) {
  const [settings, setStoreSettings] = useSettings();
  const { user, isGuest, logout, updateProfile } = useAuth();

  // Active section tab
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'units' | 'alerts' | 'theme' | 'security'

  // Profile form state
  const [profileName, setProfileName] = useState(user?.name || 'User');
  const [profileUsername, setProfileUsername] = useState(user?.username || 'user');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [householdSize, setHouseholdSize] = useState(user?.householdSize || settings?.profile?.householdSize || 2);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Notifications state
  const [notifPermission, setNotifPermission] = useState(() => getNotificationPermissionStatus());
  const [testAlertSent, setTestAlertSent] = useState(false);

  // Sync profile fields if user changes
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileUsername(user.username || '');
      setProfileEmail(user.email || '');
      setHouseholdSize(user.householdSize || 2);
    } else {
      setProfileName('User');
      setProfileUsername('user');
      setProfileEmail('');
      setHouseholdSize(1);
    }
  }, [user?.id, user?.name, user?.username, user?.email, user?.householdSize]);

  // Expiry threshold in days (derived from spoilageWindowHours)
  const spoilageHours = settings?.preservation?.spoilageWindowHours || 48;
  const expiryDays = Math.round(spoilageHours / 24) || 2;

  // Morning digest toggle
  const morningDigestEnabled = settings?.automation?.morningDigest !== false;

  // Active measurement system
  const measurementSystem = settings?.regional?.measurementSystem || 'metric';

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    setProfileSaving(true);
    setProfileSuccess('');
    setProfileError('');

    try {
      const res = await updateProfile({
        name: profileName.trim(),
        username: profileUsername.trim().toLowerCase(),
        email: profileEmail.trim().toLowerCase(),
        householdSize: Number(householdSize) || 1,
        role: user?.role === 'Organizer' ? 'Organizer' : 'Member',
      });

      if (res?.success) {
        updateSettings({
          profile: {
            name: profileName.trim(),
            username: profileUsername.trim().toLowerCase(),
            householdSize: Number(householdSize) || 1,
            role: user?.role === 'Organizer' ? 'Organizer' : 'Member',
          },
        });
        setProfileSuccess('Profile updated successfully!');
        setTimeout(() => setProfileSuccess(''), 3000);
      } else {
        setProfileError(res?.message || 'Could not update profile.');
      }
    } catch (err) {
      setProfileError(err.message || 'Error updating profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e?.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await updateProfile({
        currentPassword,
        newPassword,
      });

      if (res?.success) {
        setPasswordSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 4000);
      } else {
        setPasswordError(res?.message || 'Failed to change password.');
      }
    } catch (err) {
      setPasswordError(err.message || 'Error changing password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleMeasurementSystemChange = (sys) => {
    updateSettings({ regional: { measurementSystem: sys } });
  };

  const handleExpiryThresholdChange = (days) => {
    updateSettings({
      preservation: {
        spoilageWindowHours: days * 24,
      },
    });
  };

  const handleMorningDigestToggle = () => {
    updateSettings({
      automation: {
        morningDigest: !morningDigestEnabled,
      },
    });
  };

  const handleEnableNotifications = async () => {
    const res = await requestDesktopNotificationPermission();
    setNotifPermission(res);
  };

  const handleSendTestNotification = () => {
    const notif = sendDesktopAlert(
      'Grovio Freshness Alert',
      'Fresh Baby Spinach is expiring in 2 days. Ready to use in a healthy recipe!'
    );
    setTestAlertSent(true);
    setTimeout(() => setTestAlertSent(false), 3000);
  };

  const handleThemeSelect = (themeId) => {
    applyTheme(themeId);
    updateSettings({ themeId });
  };

  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out of Grovio?')) {
      logout();
      if (onOpenAuth) onOpenAuth();
    }
  };

  // ─── Tab Navigation Bar ───────────────────────────────────────────────────
  const tabs = [
    { id: 'profile', label: 'Profile & Household', icon: Users },
    { id: 'units', label: 'Measurement Units', icon: Scale },
    { id: 'alerts', label: 'Freshness & Alerts', icon: Bell },
    { id: 'theme', label: 'Theme & Style', icon: Palette },
    { id: 'security', label: 'Account & Security', icon: ShieldCheck },
  ];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: 'var(--text, #1e293b)',
            letterSpacing: '-0.02em',
            margin: '0 0 6px',
          }}
        >
          Settings
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted, #64748b)', margin: 0 }}>
          Manage your personal profile, household kitchen, measurement units, freshness alerts, and themes.
        </p>
      </div>

      {/* Tabs Row */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          background: 'var(--surface-2, #f1f5f9)',
          padding: 5,
          borderRadius: 14,
          marginBottom: 28,
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                borderRadius: 10,
                border: 'none',
                background: isActive ? 'var(--surface, #ffffff)' : 'transparent',
                color: isActive ? 'var(--green, #16a34a)' : 'var(--text-muted, #64748b)',
                fontWeight: isActive ? 700 : 500,
                fontSize: 13.5,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────────────
          TAB 1: Profile & Household (NO Chef roles)
         ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* User Profile Card */}
          <div
            style={{
              background: 'var(--surface, #ffffff)',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 20,
                paddingBottom: 16,
                borderBottom: '1px solid var(--border-soft, #f1f5f9)',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'var(--green-glow, #dcfce7)',
                  color: 'var(--green, #16a34a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text, #1e293b)' }}>
                  Profile Information
                </h2>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted, #64748b)', margin: '2px 0 0' }}>
                  Update your display name, username, and household member count.
                </p>
              </div>
            </div>

            {profileSuccess && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: '#dcfce7',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <CheckCircle2 size={16} />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: '#fee2e2',
                  border: '1px solid #fca5a5',
                  color: '#b91c1c',
                  fontSize: 13,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertCircle size={16} />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                {/* Full Name */}
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--text-muted, #64748b)',
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="e.g. Shravani"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--border, #cbd5e1)',
                      background: 'var(--bg, #f8fafc)',
                      color: 'var(--text, #1e293b)',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Username */}
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--text-muted, #64748b)',
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    value={profileUsername}
                    onChange={(e) => setProfileUsername(e.target.value)}
                    placeholder="e.g. shravani"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--border, #cbd5e1)',
                      background: 'var(--bg, #f8fafc)',
                      color: 'var(--text, #1e293b)',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--text-muted, #64748b)',
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="e.g. shravani@grovio.app"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--border, #cbd5e1)',
                      background: 'var(--bg, #f8fafc)',
                      color: 'var(--text, #1e293b)',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Household Size */}
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--text-muted, #64748b)',
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Household Members Count
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="number"
                      min="1"
                      max="15"
                      value={householdSize}
                      onChange={(e) => setHouseholdSize(Math.max(1, Number(e.target.value) || 1))}
                      style={{
                        width: 100,
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1px solid var(--border, #cbd5e1)',
                        background: 'var(--bg, #f8fafc)',
                        color: 'var(--text, #1e293b)',
                        fontSize: 14,
                        outline: 'none',
                      }}
                    />
                    <span style={{ fontSize: 13, color: 'var(--text-muted, #64748b)' }}>
                      {householdSize === 1 ? 'person' : 'people eating from this kitchen'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'var(--green, #16a34a)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: profileSaving ? 'not-allowed' : 'pointer',
                  opacity: profileSaving ? 0.7 : 1,
                  boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                }}
              >
                {profileSaving ? <RefreshCw size={14} className="spin-animate" /> : <Save size={14} />}
                <span>{profileSaving ? 'Saving…' : 'Save Profile Changes'}</span>
              </button>
            </form>
          </div>

          {/* Shared Household Kitchen Card (Sync, Code, Members - No Chef Titles) */}
          <HouseholdSettingsCard />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          TAB 2: Measurement Units (Metric vs Imperial)
         ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'units' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Measurement System Selection */}
          <div
            style={{
              background: 'var(--surface, #ffffff)',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
                paddingBottom: 16,
                borderBottom: '1px solid var(--border-soft, #f1f5f9)',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'var(--green-glow, #dcfce7)',
                  color: 'var(--green, #16a34a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Scale size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text, #1e293b)' }}>
                  Measurement Unit System
                </h2>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted, #64748b)', margin: '2px 0 0' }}>
                  Select whether you prefer Metric units or Imperial units for weights and liquids.
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 14,
              }}
            >
              {/* Metric Card */}
              <button
                type="button"
                onClick={() => handleMeasurementSystemChange('metric')}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  border:
                    measurementSystem === 'metric'
                      ? '2px solid var(--green, #16a34a)'
                      : '1px solid var(--border, #e2e8f0)',
                  background:
                    measurementSystem === 'metric'
                      ? 'var(--surface-2, #f0fdf4)'
                      : 'var(--surface, #ffffff)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text, #1e293b)' }}>
                    Metric System (kg, g, L, ml)
                  </span>
                  {measurementSystem === 'metric' && (
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: 'var(--green, #16a34a)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check size={12} />
                    </div>
                  )}
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted, #64748b)', margin: 0, lineHeight: 1.4 }}>
                  Standard international units. Ideal for recipes measured in kilograms, grams, liters, and milliliters.
                </p>
              </button>

              {/* Imperial Card */}
              <button
                type="button"
                onClick={() => handleMeasurementSystemChange('imperial')}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  border:
                    measurementSystem === 'imperial'
                      ? '2px solid var(--green, #16a34a)'
                      : '1px solid var(--border, #e2e8f0)',
                  background:
                    measurementSystem === 'imperial'
                      ? 'var(--surface-2, #f0fdf4)'
                      : 'var(--surface, #ffffff)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text, #1e293b)' }}>
                    Imperial System (lbs, oz, gal)
                  </span>
                  {measurementSystem === 'imperial' && (
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: 'var(--green, #16a34a)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Check size={12} />
                    </div>
                  )}
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted, #64748b)', margin: 0, lineHeight: 1.4 }}>
                  US Customary units. Ideal for recipes and grocery stock measured in pounds, ounces, and fluid gallons.
                </p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          TAB 3: Freshness & Expiry Alerts
         ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'alerts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Expiry Warning Threshold */}
          <div
            style={{
              background: 'var(--surface, #ffffff)',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
                paddingBottom: 16,
                borderBottom: '1px solid var(--border-soft, #f1f5f9)',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'var(--green-glow, #dcfce7)',
                  color: 'var(--green, #16a34a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Clock size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text, #1e293b)' }}>
                  Freshness &amp; Expiry Alert Window
                </h2>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted, #64748b)', margin: '2px 0 0' }}>
                  When should Grovio mark produce as &ldquo;Expiring Soon&rdquo; and suggest rescue recipes?
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              {[
                { days: 1, label: '1 Day', desc: 'Strict / Last-minute warning' },
                { days: 2, label: '2 Days (Recommended)', desc: 'Balanced notice to cook or preserve' },
                { days: 3, label: '3 Days', desc: 'Early planning alert' },
              ].map((opt) => {
                const isSelected = expiryDays === opt.days;
                return (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => handleExpiryThresholdChange(opt.days)}
                    style={{
                      flex: '1 1 200px',
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: isSelected
                        ? '2px solid var(--green, #16a34a)'
                        : '1px solid var(--border, #e2e8f0)',
                      background: isSelected
                        ? 'var(--surface-2, #f0fdf4)'
                        : 'var(--surface, #ffffff)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text, #1e293b)' }}>
                        {opt.label}
                      </span>
                      {isSelected && (
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: 'var(--green, #16a34a)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Check size={11} />
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted, #64748b)' }}>
                      {opt.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Morning Digest Toggle */}
          <div
            style={{
              background: 'var(--surface, #ffffff)',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px', color: 'var(--text, #1e293b)' }}>
                Morning Freshness Digest
              </h3>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted, #64748b)', margin: 0, maxWidth: 540 }}>
                Automatically show a quick morning summary of ingredients expiring today and pantry staples running low.
              </p>
            </div>

            <button
              type="button"
              onClick={handleMorningDigestToggle}
              style={{
                width: 48,
                height: 26,
                borderRadius: 99,
                background: morningDigestEnabled ? 'var(--green, #16a34a)' : '#cbd5e1',
                position: 'relative',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#ffffff',
                  position: 'absolute',
                  top: 3,
                  left: morningDigestEnabled ? 25 : 3,
                  transition: 'left 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              />
            </button>
          </div>

          {/* Desktop Push Notifications */}
          <div
            style={{
              background: 'var(--surface, #ffffff)',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
                paddingBottom: 16,
                borderBottom: '1px solid var(--border-soft, #f1f5f9)',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'var(--green-glow, #dcfce7)',
                  color: 'var(--green, #16a34a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bell size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text, #1e293b)' }}>
                    Desktop &amp; Browser Notifications
                  </h2>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 99,
                      background:
                        notifPermission === 'granted'
                          ? '#dcfce7'
                          : notifPermission === 'denied'
                          ? '#fee2e2'
                          : '#fef3c7',
                      color:
                        notifPermission === 'granted'
                          ? '#166534'
                          : notifPermission === 'denied'
                          ? '#b91c1c'
                          : '#92400e',
                    }}
                  >
                    {notifPermission === 'granted'
                      ? 'Enabled'
                      : notifPermission === 'denied'
                      ? 'Blocked in Browser'
                      : 'Permission Required'}
                  </span>
                </div>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted, #64748b)', margin: '2px 0 0' }}>
                  Get alert notifications when perishable groceries are within your alert window.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {notifPermission !== 'granted' && (
                <button
                  type="button"
                  onClick={handleEnableNotifications}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 16px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'var(--green, #16a34a)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  <Bell size={14} />
                  <span>Enable Desktop Notifications</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSendTestNotification}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 16px',
                  borderRadius: 10,
                  border: '1px solid var(--border, #cbd5e1)',
                  background: 'var(--surface, #ffffff)',
                  color: 'var(--text, #1e293b)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <Sparkles size={14} />
                <span>{testAlertSent ? 'Alert Dispatched!' : 'Send Test Freshness Alert'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          TAB 4: Themes (At least 4 distinct options)
         ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'theme' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              background: 'var(--surface, #ffffff)',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 20,
                paddingBottom: 16,
                borderBottom: '1px solid var(--border-soft, #f1f5f9)',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'var(--green-glow, #dcfce7)',
                  color: 'var(--green, #16a34a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Palette size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text, #1e293b)' }}>
                  Visual Design &amp; Theme
                </h2>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted, #64748b)', margin: '2px 0 0' }}>
                  Choose a color palette that matches your kitchen style. Switches apply instantly.
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 16,
              }}
            >
              {THEMES.map((th) => {
                const isSelected = (settings?.themeId || 'minimalist') === th.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => handleThemeSelect(th.id)}
                    style={{
                      padding: 16,
                      borderRadius: 14,
                      border: isSelected
                        ? '2px solid var(--green, #16a34a)'
                        : '1px solid var(--border, #e2e8f0)',
                      background: 'var(--surface, #ffffff)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 3px 10px rgba(0,0,0,0.06)' : 'none',
                    }}
                  >
                    {/* Color Swatches Header */}
                    <div
                      style={{
                        height: 52,
                        borderRadius: 10,
                        background: th.bgPreview,
                        border: `1px solid ${th.borderPreview}`,
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: th.cardPreview,
                            border: `1px solid ${th.borderPreview}`,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          }}
                        />
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: th.accentPreview,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                          }}
                        />
                      </div>

                      {isSelected && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: th.accentPreview,
                            color: '#ffffff',
                            padding: '3px 8px',
                            borderRadius: 99,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          <Check size={11} />
                          <span>Active</span>
                        </div>
                      )}
                    </div>

                    {/* Theme Info */}
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text, #1e293b)', marginBottom: 4 }}>
                      {th.label}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted, #64748b)', lineHeight: 1.4 }}>
                      {th.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          TAB 5: Account & Security
         ───────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Change Password Card */}
          <div
            style={{
              background: 'var(--surface, #ffffff)',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 20,
                paddingBottom: 16,
                borderBottom: '1px solid var(--border-soft, #f1f5f9)',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'var(--green-glow, #dcfce7)',
                  color: 'var(--green, #16a34a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Lock size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text, #1e293b)' }}>
                  Change Password
                </h2>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted, #64748b)', margin: '2px 0 0' }}>
                  Ensure your Grovio account and shared pantry remain secure.
                </p>
              </div>
            </div>

            {passwordSuccess && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: '#dcfce7',
                  border: '1px solid #bbf7d0',
                  color: '#166534',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <CheckCircle2 size={16} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: '#fee2e2',
                  border: '1px solid #fca5a5',
                  color: '#b91c1c',
                  fontSize: 13,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertCircle size={16} />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--text-muted, #64748b)',
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--border, #cbd5e1)',
                      background: 'var(--bg, #f8fafc)',
                      color: 'var(--text, #1e293b)',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--text-muted, #64748b)',
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    New Password (min 6 chars)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--border, #cbd5e1)',
                      background: 'var(--bg, #f8fafc)',
                      color: 'var(--text, #1e293b)',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--text-muted, #64748b)',
                      display: 'block',
                      marginBottom: 6,
                    }}
                  >
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--border, #cbd5e1)',
                      background: 'var(--bg, #f8fafc)',
                      color: 'var(--text, #1e293b)',
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordSaving}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'var(--green, #16a34a)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: 13.5,
                  cursor: passwordSaving ? 'not-allowed' : 'pointer',
                  opacity: passwordSaving ? 0.7 : 1,
                  boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
                }}
              >
                {passwordSaving ? <RefreshCw size={14} className="spin-animate" /> : <Lock size={14} />}
                <span>{passwordSaving ? 'Updating Password…' : 'Update Password'}</span>
              </button>
            </form>
          </div>

          {/* Account Status & Sign Out */}
          <div
            style={{
              background: 'var(--surface, #ffffff)',
              border: '1px solid var(--border, #e2e8f0)',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px', color: 'var(--text, #1e293b)' }}>
                Session &amp; Account
              </h3>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted, #64748b)', margin: 0 }}>
                Signed in as <strong style={{ color: 'var(--text, #1e293b)' }}>{user?.name || 'User'}</strong> ({user?.username ? `@${user.username}` : user?.email || 'Local User'}).
              </p>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                borderRadius: 10,
                border: '1px solid #fca5a5',
                background: '#fff1f2',
                color: '#be123c',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <LogOut size={15} />
              <span>Sign Out of Grovio</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
