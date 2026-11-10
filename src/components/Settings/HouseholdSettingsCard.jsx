// src/components/Settings/HouseholdSettingsCard.jsx
// Grovio Shared Household Kitchen & Family Sync Card
import React, { useState, useEffect } from 'react';
import {
  Users,
  Home,
  Copy,
  Check,
  Plus,
  LogIn,
  LogOut,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  fetchHousehold,
  createHouseholdKitchen,
  joinHouseholdKitchen,
  leaveHouseholdKitchen,
  getActiveHouseholdCode,
} from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function HouseholdSettingsCard() {
  const { user } = useAuth();
  const [household, setHousehold] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Form states
  const [createName, setCreateName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadHouseholdData = async () => {
    setLoading(true);
    setActionError('');
    try {
      const activeCode = getActiveHouseholdCode();
      if (!user?.householdCode && !activeCode) {
        setHousehold(null);
        return;
      }
      const res = await fetchHousehold();
      if (res?.success && res?.household) {
        setHousehold(res.household);
      } else if (activeCode && user?.householdCode) {
        // Fallback representation if backend returned null but code exists for current user
        setHousehold({
          code: activeCode,
          name: `${user?.name || 'Household'}'s Kitchen`,
          members: [
            {
              userId: user?.id || 'member-1',
              name: user?.name || 'You',
              role: 'Organizer',
              joinedAt: new Date(),
            },
          ],
        });
      } else {
        setHousehold(null);
      }
    } catch {
      setHousehold(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHouseholdData();
  }, [user?.id]);

  const handleCopyCode = () => {
    if (!household?.code) return;
    navigator.clipboard?.writeText?.(household.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = async (e) => {
    e?.preventDefault();
    setSubmitting(true);
    setActionError('');
    setActionSuccess('');

    try {
      const name = createName.trim() || `${user?.name || 'Our'}'s Kitchen`;
      const res = await createHouseholdKitchen(name);
      if (res?.success && res?.household) {
        setHousehold(res.household);
        setActionSuccess(`Shared kitchen "${res.household.name}" created! Kitchen Code: ${res.household.code}`);
        setCreateName('');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setActionError(res?.message || 'Failed to create kitchen.');
      }
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Error creating household kitchen.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (e) => {
    e?.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase();
    if (!cleanCode) {
      setActionError('Please enter a valid Kitchen Code (e.g. GROVE-4821)');
      return;
    }

    setSubmitting(true);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await joinHouseholdKitchen(cleanCode);
      if (res?.success && res?.household) {
        setHousehold(res.household);
        setActionSuccess(`Joined ${res.household.name}! Syncing inventory…`);
        setJoinCode('');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setActionError(res?.message || 'Could not join household with that code.');
      }
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Invalid Kitchen Code. Please check with your family member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeave = async () => {
    if (!window.confirm('Are you sure you want to leave this shared household kitchen? You will return to your private personal inventory.')) {
      return;
    }

    setSubmitting(true);
    setActionError('');
    try {
      await leaveHouseholdKitchen(household?.code);
      setHousehold(null);
      setActionSuccess('Returned to private personal kitchen.');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setActionError(err.message || 'Error leaving household.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      }}
    >
      {/* Card Header */}
      <div
        style={{
          padding: '18px 24px',
          borderBottom: '1px solid #f1f5f9',
          background: 'linear-gradient(to right, #fafbfc, #ffffff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: '#dcfce7',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Shared Household Kitchen &amp; Family Sync
            </h3>
            <p style={{ fontSize: 12.5, color: '#64748b', margin: '2px 0 0' }}>
              Sync kitchen groceries, fridge expiry dates, and shopping lists across family members
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadHouseholdData}
          title="Refresh sync status"
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            background: '#ffffff',
            color: '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 12,
          }}
        >
          <RefreshCw size={12} className={loading ? 'spin-animate' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Card Body */}
      <div style={{ padding: '22px 24px' }}>
        {/* Status Alerts */}
        {actionError && (
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
            <AlertCircle size={15} />
            <span>{actionError}</span>
          </div>
        )}

        {actionSuccess && (
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
            <Check size={15} />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* ── Active Household Display ── */}
        {household ? (
          <div>
            <div
              style={{
                background: '#f8fafc',
                border: '1.5px solid #bbf7d0',
                borderRadius: 14,
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🏡</span>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    {household.name}
                  </h4>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 99,
                      background: '#dcfce7',
                      color: '#166534',
                    }}
                  >
                    Live Synced
                  </span>
                </div>
                <p style={{ fontSize: 12.5, color: '#64748b', margin: '4px 0 0' }}>
                  All household members share the same live inventory and shopping checklist
                </p>
              </div>

              {/* Kitchen Code Badge + Copy */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    background: '#ffffff',
                    border: '1.5px dashed #16a34a',
                    padding: '8px 14px',
                    borderRadius: 10,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Kitchen Code
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#166534', letterSpacing: '0.05em' }}>
                    {household.code}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#166534',
                    color: '#ffffff',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 6px rgba(22, 101, 52, 0.2)',
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            </div>

            {/* Household Members List */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 10 }}>
                Household Members ({(household.members || []).length})
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                {(household.members || [
                  { userId: '1', name: user?.name || 'You', role: 'Organizer' },
                ]).map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: '#dcfce7',
                        color: '#166534',
                        fontWeight: 700,
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {(m.name || 'M')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.name || 'Member'} {m.userId === user?.id ? '(You)' : ''}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        {m.role || 'Family Member'}
                      </div>
                    </div>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#16a34a',
                      }}
                      title="Active"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Leave Household Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                disabled={submitting}
                onClick={handleLeave}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: '1px solid #fee2e2',
                  background: '#ffffff',
                  color: '#dc2626',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <LogOut size={13} />
                <span>Leave Shared Household</span>
              </button>
            </div>
          </div>
        ) : (
          /* ── Not in Household: Create or Join ── */
          <div>
            <div
              style={{
                marginBottom: 20,
                padding: '12px 16px',
                borderRadius: 12,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Home size={18} color="#64748b" />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  Personal Kitchen Mode (Private)
                </p>
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                  Items are currently visible only to your account. Create a Kitchen Code to invite family or enter an existing code to join a household.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Option A: Create Kitchen */}
              <form
                onSubmit={handleCreate}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: '18px 20px',
                  background: '#fafbfc',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Plus size={16} color="#16a34a" />
                    <h4 style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      Create a Household Kitchen
                    </h4>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 14px' }}>
                    Generate a new Kitchen Code to share with your family members or roommates.
                  </p>

                  <input
                    type="text"
                    placeholder="e.g. The Smith Kitchen"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 9,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      marginBottom: 12,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 9,
                    border: 'none',
                    background: '#16a34a',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: submitting ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Sparkles size={14} />
                  <span>{submitting ? 'Generating…' : 'Create Kitchen Code'}</span>
                </button>
              </form>

              {/* Option B: Join Existing Kitchen */}
              <form
                onSubmit={handleJoin}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  padding: '18px 20px',
                  background: '#fafbfc',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <LogIn size={16} color="#2563eb" />
                    <h4 style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                      Join an Existing Kitchen
                    </h4>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 14px' }}>
                    Enter the 6-character Kitchen Code provided by your household member.
                  </p>

                  <input
                    type="text"
                    placeholder="Enter Code (e.g. GROVE-4821)"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 9,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      marginBottom: 12,
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 9,
                    border: 'none',
                    background: '#0f172a',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: submitting ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Check size={14} />
                  <span>{submitting ? 'Connecting…' : 'Join Household Kitchen'}</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
