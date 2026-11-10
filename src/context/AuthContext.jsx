// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getSavedCredentials,
  saveCredentials,
  clearSavedCredentials,
  getPersistedSession,
  setPersistedSession,
  clearPersistedSession,
  loginUser,
  registerUser,
  updateUserProfile,
  forgotPasswordRequest,
  resetPasswordWithCode,
  getAllKnownAccounts,
  getAccountsForUser,
  linkAccounts,
} from '../services/authService';
import { switchUserSettings } from '../store/useSettings';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getPersistedSession());
  const [isGuest, setIsGuest] = useState(false);
  const [savedCreds, setSavedCreds] = useState(() => getSavedCredentials());
  const [isLoading, setIsLoading] = useState(false);

  // Sync saved credentials state if changed
  const refreshSavedCredentials = useCallback(() => {
    setSavedCreds(getSavedCredentials());
  }, []);

  // Switch user settings whenever active user changes
  useEffect(() => {
    if (user?.id) {
      switchUserSettings(user.id);
    }
  }, [user?.id]);

  const login = useCallback(async (identifier, password, remember = true) => {
    setIsLoading(true);
    try {
      const result = await loginUser(identifier, password);
      setUser(result.user);
      setPersistedSession(result.user, result.token);
      setIsGuest(false);
      switchUserSettings(result.user?.id);

      if (remember) {
        saveCredentials(identifier, password);
        refreshSavedCredentials();
      } else {
        clearSavedCredentials();
        refreshSavedCredentials();
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  }, [refreshSavedCredentials]);

  const register = useCallback(async (name, username, email, password, remember = true) => {
    setIsLoading(true);
    try {
      const result = await registerUser(name, username, email, password);
      setUser(result.user);
      setPersistedSession(result.user, result.token);
      setIsGuest(false);
      switchUserSettings(result.user?.id);

      if (remember) {
        saveCredentials(username || email, password);
        refreshSavedCredentials();
      } else {
        clearSavedCredentials();
        refreshSavedCredentials();
      }

      return result;
    } finally {
      setIsLoading(false);
    }
  }, [refreshSavedCredentials]);

  const updateProfile = useCallback(async (profileData) => {
    const res = await updateUserProfile(profileData);
    if (res?.user) {
      setUser(res.user);
    }
    return res;
  }, []);

  const forgotPassword = useCallback(async (identifier) => {
    return await forgotPasswordRequest(identifier);
  }, []);

  const resetPassword = useCallback(async (identifier, code, newPassword) => {
    const result = await resetPasswordWithCode(identifier, code, newPassword);
    const cleanId = (identifier || '').trim().toLowerCase();
    const currentSaved = getSavedCredentials();
    if (currentSaved && currentSaved.identifier === cleanId) {
      saveCredentials(identifier, newPassword);
      refreshSavedCredentials();
    }
    return result;
  }, [refreshSavedCredentials]);

  const logout = useCallback(() => {
    setUser(null);
    setIsGuest(false);
    clearPersistedSession();
    switchUserSettings('guest_user');
  }, []);

  const guestLogin = useCallback(() => {
    setIsGuest(true);
    setUser({
      id: 'guest_user',
      name: 'Guest User',
      email: 'guest@grovio.app',
      isGuest: true,
      initials: 'GC',
    });
  }, []);

  const forgetSavedCredentials = useCallback(() => {
    clearSavedCredentials();
    setSavedCreds(null);
  }, []);

  const userAccounts = getAccountsForUser(user);

  const switchAccount = useCallback((accountOrId) => {
    if (!accountOrId) return;
    let target = accountOrId;
    if (typeof accountOrId === 'string') {
      const all = getAccountsForUser(user);
      target = all.find((a) => a.id === accountOrId || a.username === accountOrId) || DEMO_USERS.find((d) => d.id === accountOrId);
    }
    if (target) {
      if (user?.id && target.id) {
        linkAccounts(user.id, target.id);
      }
      clearPersistedSession();
      const sessionUser = {
        id: target.id || `usr_${target.username}`,
        name: target.name || target.username,
        username: target.username || (target.email ? target.email.split('@')[0] : 'user'),
        email: target.email || '',
        role: target.role || 'Member',
        initials: (target.name || target.username || 'U').slice(0, 2).toUpperCase(),
        householdCode: target.householdCode || null,
        token: target.token || `session_${target.id || target.username}`,
      };
      setPersistedSession(sessionUser, sessionUser.token);
      setUser(sessionUser);
      setIsGuest(false);
      switchUserSettings(sessionUser.id);
    }
  }, [user]);

  const value = {
    user,
    isAuthenticated: !!user,
    isGuest,
    isLoading,
    savedCredentials: savedCreds,
    knownAccounts: userAccounts,
    userAccounts,
    login,
    switchAccount,
    register,
    updateProfile,
    forgotPassword,
    resetPassword,
    logout,
    guestLogin,
    forgetSavedCredentials,
    refreshSavedCredentials,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
