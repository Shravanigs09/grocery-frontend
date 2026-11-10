// src/components/Auth/AuthPage.jsx
// Exact visual match to the Grove View personal food preservation space mockup
import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import KitchenIllustration from './KitchenIllustration';

export default function AuthPage({ onSuccess }) {
  const {
    login,
    register,
    forgotPassword,
    resetPassword,
    savedCredentials,
    forgetSavedCredentials,
  } = useAuth();

  // Mode: 'login' | 'register' | 'forgot' | 'reset' | 'reset_success'
  const [mode, setMode] = useState('login');

  // Form Fields
  const [identifier, setIdentifier] = useState(''); // username or email
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Password reset fields
  const [resetCode, setResetCode] = useState('');
  const [testCodeHint, setTestCodeHint] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-fill saved credentials on mount
  useEffect(() => {
    if (savedCredentials && (savedCredentials.identifier || savedCredentials.email)) {
      const idVal = savedCredentials.identifier || savedCredentials.email;
      setIdentifier(idVal);
      if (savedCredentials.password) {
        setPassword(savedCredentials.password);
      }
      setRememberMe(true);
    }
  }, [savedCredentials]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!identifier.trim()) {
      setErrorMsg('Please enter your email address or username.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(identifier, password, rememberMe);
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!username.trim() || username.trim().length < 3) {
      setErrorMsg('Username must be at least 3 characters long and unique.');
      return;
    }
    if (email.trim() && !email.includes('@')) {
      setErrorMsg('Please enter a valid email address, or leave it blank.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(name, username, email, password, rememberMe);
      if (onSuccess) onSuccess();
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const target = (identifier || email).trim();
    if (!target) {
      setErrorMsg('Please enter your email address or username.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await forgotPassword(target);
      const code = res.resetCode || '';
      setTestCodeHint(code);
      setResetCode(code);
      setSuccessMsg(res.message || 'Verification code generated successfully.');
      setMode('reset');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to request password reset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const target = (identifier || email).trim();
    if (!target) {
      setErrorMsg('Email address or username is required.');
      return;
    }
    if (!resetCode.trim()) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(target, resetCode, password);
      setMode('reset_success');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reset password. Check your code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#eef0e8', // Soft neutral canvas surrounding the card stage
        padding: '24px 16px',
        boxSizing: 'border-box',
        fontFamily: "'DM Sans', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ═════════════════════════════════════════════════════════════════════
          MAIN STAGE CONTAINER (MATCHING 16:9 ROUNDED CARD FROM SCREENSHOT)
         ═════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          width: '100%',
          maxWidth: 1040,
          minHeight: 580,
          borderRadius: 36,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'row',
          boxShadow: '0 20px 50px rgba(45, 53, 33, 0.09), 0 4px 16px rgba(0, 0, 0, 0.04)',
          position: 'relative',
          background: '#fbfbf8',
        }}
      >
        {/* ─── LEFT HALF: CREAM BACKGROUND WITH FLOATING AUTH CARD ──────── */}
        <div
          style={{
            flex: '1 1 50%',
            background: '#fbfbf8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '36px 28px',
            boxSizing: 'border-box',
            position: 'relative',
          }}
        >
          <div style={{ width: '100%', maxWidth: 360 }}>
            {/* Logo Mark: Green Leaf + Grove View */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                marginBottom: 16,
              }}
            >
              {/* Distinctive Two-Leaf Botanical Graphic */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 19 C3 12 9 6 20 4 C21 15 15 21 4 19 Z"
                  fill="#546c27"
                />
                <path
                  d="M4 19 Q12 13 20 4"
                  stroke="#fbfbf8"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: '#212818',
                  letterSpacing: '-0.01em',
                }}
              >
                Grovio
              </span>
            </div>

            {/* Floating White Card with Rounded Corners */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 24,
                padding: '30px 26px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.02)',
                border: '1px solid rgba(0, 0, 0, 0.04)',
                boxSizing: 'border-box',
              }}
            >
              {/* Feedback Alert Messages */}
              {errorMsg && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: '#fdf2f2',
                    border: '1px solid #f8b4b4',
                    color: '#9b1c1c',
                    fontSize: 12,
                    marginBottom: 14,
                  }}
                >
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '8px 12px',
                    borderRadius: 10,
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#15803d',
                    fontSize: 12,
                    marginBottom: 14,
                  }}
                >
                  <CheckCircle2 size={14} style={{ flexShrink: 0 }} />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* ── MODE: LOGIN ─────────────────────────────────────────── */}
              {mode === 'login' && (
                <div>
                  {/* Two-Line Title & Subtitle from screenshot */}
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <h1
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: '#191f12',
                        margin: 0,
                        lineHeight: 1.25,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      Welcome back to<br />Grovio
                    </h1>
                    <p
                      style={{
                        fontSize: 12,
                        color: '#767d6f',
                        margin: '5px 0 0',
                      }}
                    >
                      Welcome back, Grovio with you
                    </p>
                  </div>

                  <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Username or Email field */}
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#495041',
                          marginBottom: 4,
                        }}
                      >
                        Username or Email
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. shravani or user@email.com"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        autoComplete="username"
                        required
                        style={{
                          width: '100%',
                          height: 40,
                          boxSizing: 'border-box',
                          padding: '0 14px',
                          borderRadius: 9,
                          border: '1px solid #dcdfd5',
                          background: '#ffffff',
                          fontSize: 13,
                          color: '#1d2315',
                          outline: 'none',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#556c27')}
                        onBlur={(e) => (e.target.style.borderColor = '#dcdfd5')}
                      />
                    </div>

                    {/* Password field with Eye toggle */}
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                        style={{
                          width: '100%',
                          height: 40,
                          boxSizing: 'border-box',
                          padding: '0 38px 0 14px',
                          borderRadius: 9,
                          border: '1px solid #dcdfd5',
                          background: '#ffffff',
                          fontSize: 13,
                          color: '#1d2315',
                          outline: 'none',
                        }}
                        onFocus={(e) => (e.target.style.borderColor = '#556c27')}
                        onBlur={(e) => (e.target.style.borderColor = '#dcdfd5')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#959b8d',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    {/* Options Row: Remember Me & Forgot Password? */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        marginTop: 2,
                      }}
                    >
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          color: '#495041',
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          style={{
                            accentColor: '#556c27',
                            width: 14,
                            height: 14,
                            cursor: 'pointer',
                            borderRadius: 3,
                          }}
                        />
                        <span>Remember Me</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#556c27',
                          fontWeight: 500,
                          fontSize: 12,
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        Forgot Password?
                      </button>
                    </div>

                    {/* Solid Olive Green Pill Button: Sign In */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        height: 42,
                        borderRadius: 999,
                        background: '#556c27',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginTop: 4,
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#45591e')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#556c27')}
                    >
                      {isSubmitting ? 'Signing in...' : 'Sign In'}
                    </button>
                  </form>

                  {/* Divider: or continue with */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      margin: '18px 0 12px',
                    }}
                  >
                    <div style={{ flex: 1, height: 1, background: '#e3e6de' }} />
                    <span style={{ fontSize: 11, color: '#959c8d' }}>or continue with</span>
                    <div style={{ flex: 1, height: 1, background: '#e3e6de' }} />
                  </div>

                  {/* Switch Household Account Action */}
                  <div style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIdentifier('');
                        setPassword('');
                        setErrorMsg('');
                        setSuccessMsg('Enter your household member username or email to sign in.');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#556c27',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        padding: '3px 6px',
                      }}
                    >
                      Switch Household Account
                    </button>
                  </div>

                  {/* Don't have an account? Sign up */}
                  <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#495041' }}>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#556c27',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Sign up
                    </button>
                  </div>
                </div>
              )}

              {/* ── MODE: REGISTER (SIGN UP) ─────────────────────────────── */}
              {mode === 'register' && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: 18 }}>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: '#191f12', margin: 0 }}>
                      Create Your Account
                    </h1>
                    <p style={{ fontSize: 12, color: '#767d6f', margin: '4px 0 0' }}>
                      Join Grovio preservation space
                    </p>
                  </div>

                  <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#495041', marginBottom: 3 }}>
                        Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Shravani"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (!username) {
                            setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                          }
                        }}
                        required
                        style={{
                          width: '100%',
                          height: 38,
                          boxSizing: 'border-box',
                          padding: '0 12px',
                          borderRadius: 8,
                          border: '1px solid #dcdfd5',
                          fontSize: 12.5,
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <label style={{ fontSize: 11.5, fontWeight: 600, color: '#495041' }}>
                          Unique Username *
                        </label>
                        <span style={{ fontSize: 10.5, color: '#767d6f' }}>
                          Unique for everyone
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. shravani (unique handle)"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                        required
                        style={{
                          width: '100%',
                          height: 38,
                          boxSizing: 'border-box',
                          padding: '0 12px',
                          borderRadius: 8,
                          border: '1px solid #dcdfd5',
                          fontSize: 12.5,
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                        <label style={{ fontSize: 11.5, fontWeight: 600, color: '#495041' }}>
                          Email Address (Optional)
                        </label>
                        <span style={{ fontSize: 10.5, color: '#767d6f' }}>
                          Optional
                        </span>
                      </div>
                      <input
                        type="email"
                        placeholder="name@email.com (optional)"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                          width: '100%',
                          height: 38,
                          boxSizing: 'border-box',
                          padding: '0 12px',
                          borderRadius: 8,
                          border: '1px solid #dcdfd5',
                          fontSize: 12.5,
                          outline: 'none',
                        }}
                      />
                    </div>

                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password (min 6 chars)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          height: 38,
                          boxSizing: 'border-box',
                          padding: '0 34px 0 12px',
                          borderRadius: 8,
                          border: '1px solid #dcdfd5',
                          fontSize: 12.5,
                          outline: 'none',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#959b8d',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        height: 38,
                        boxSizing: 'border-box',
                        padding: '0 12px',
                        borderRadius: 8,
                        border: '1px solid #dcdfd5',
                        fontSize: 12.5,
                        outline: 'none',
                      }}
                    />

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        height: 40,
                        borderRadius: 999,
                        background: '#556c27',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: 13.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginTop: 4,
                      }}
                    >
                      {isSubmitting ? 'Creating account...' : 'Create Account'}
                    </button>
                  </form>

                  <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: '#495041' }}>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#556c27',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Sign in
                    </button>
                  </div>
                </div>
              )}

              {/* ── MODE: FORGOT PASSWORD ─────────────────────────────────── */}
              {mode === 'forgot' && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <h1 style={{ fontSize: 19, fontWeight: 700, color: '#191f12', margin: 0 }}>
                      Recover Password
                    </h1>
                    <p style={{ fontSize: 12, color: '#767d6f', margin: '4px 0 0' }}>
                      Enter your username or email for recovery code
                    </p>
                  </div>

                  <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <input
                      type="text"
                      placeholder="Username or Email Address"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        height: 40,
                        boxSizing: 'border-box',
                        padding: '0 14px',
                        borderRadius: 9,
                        border: '1px solid #dcdfd5',
                        fontSize: 13,
                        outline: 'none',
                      }}
                    />

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => switchMode('login')}
                        style={{
                          flex: 1,
                          height: 40,
                          borderRadius: 999,
                          background: '#f4f5f0',
                          color: '#495041',
                          border: '1px solid #dcdfd5',
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                          flex: 1.4,
                          height: 40,
                          borderRadius: 999,
                          background: '#556c27',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {isSubmitting ? 'Sending...' : 'Send Code'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ── MODE: RESET PASSWORD ──────────────────────────────────── */}
              {mode === 'reset' && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: 14 }}>
                    <h1 style={{ fontSize: 19, fontWeight: 700, color: '#191f12', margin: 0 }}>
                      Enter Verification Code
                    </h1>
                    <p style={{ fontSize: 12, color: '#767d6f', margin: '3px 0 0' }}>
                      Code sent for: <strong>{identifier}</strong>
                    </p>
                  </div>

                  {testCodeHint && (
                    <div
                      style={{
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: 8,
                        padding: '6px 10px',
                        marginBottom: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: 12,
                      }}
                    >
                      <span style={{ color: '#15803d', fontWeight: 600 }}>Code: {testCodeHint}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setResetCode(testCodeHint);
                          setCodeCopied(true);
                          setTimeout(() => setCodeCopied(false), 2000);
                        }}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #bbf7d0',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: '#15803d',
                          cursor: 'pointer',
                        }}
                      >
                        {codeCopied ? 'Filled' : 'Auto-Fill'}
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        height: 38,
                        boxSizing: 'border-box',
                        textAlign: 'center',
                        letterSpacing: '0.25em',
                        fontSize: 16,
                        fontWeight: 700,
                        borderRadius: 8,
                        border: '1px solid #dcdfd5',
                        outline: 'none',
                      }}
                    />

                    <input
                      type="password"
                      placeholder="New Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        height: 38,
                        boxSizing: 'border-box',
                        padding: '0 12px',
                        borderRadius: 8,
                        border: '1px solid #dcdfd5',
                        fontSize: 12.5,
                        outline: 'none',
                      }}
                    />

                    <input
                      type="password"
                      placeholder="Confirm New Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        height: 38,
                        boxSizing: 'border-box',
                        padding: '0 12px',
                        borderRadius: 8,
                        border: '1px solid #dcdfd5',
                        fontSize: 12.5,
                        outline: 'none',
                      }}
                    />

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        width: '100%',
                        height: 40,
                        borderRadius: 999,
                        background: '#556c27',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: 13.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginTop: 2,
                      }}
                    >
                      {isSubmitting ? 'Resetting...' : 'Update Password'}
                    </button>
                  </form>
                </div>
              )}

              {/* ── MODE: RESET SUCCESS ───────────────────────────────────── */}
              {mode === 'reset_success' && (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <CheckCircle2 size={32} color="#15803d" style={{ margin: '0 auto 10px' }} />
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#191f12', margin: '0 0 4px' }}>
                    Password Reset!
                  </h2>
                  <p style={{ fontSize: 12, color: '#767d6f', margin: '0 0 16px' }}>
                    You can now sign in with your updated password.
                  </p>
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    style={{
                      width: '100%',
                      height: 40,
                      borderRadius: 999,
                      background: '#556c27',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: 13.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>



        {/* ─── RIGHT HALF: SAGE GREEN KITCHEN ILLUSTRATION & HEADLINE ───── */}
        <div
          style={{
            flex: '1 1 50%',
            background: '#bac4ac', // Exact soft sage olive from screenshot
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 32px',
            boxSizing: 'border-box',
            position: 'relative',
          }}
          className="auth-right-hero"
        >
          <div style={{ width: '100%', maxWidth: 440, textAlign: 'center' }}>
            {/* The Full Kitchen Scene (Fridge, Cabinets, Plant, Badges) */}
            <KitchenIllustration />

            {/* Exact Headline from Screenshot */}
            <h2
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#1d2415',
                lineHeight: 1.25,
                margin: '24px 0 0',
                letterSpacing: '-0.015em',
              }}
            >
              Your Personal Household<br />Food Preservation Space
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}
