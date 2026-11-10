// src/services/authService.js
// Multi-user authentication & demo isolation service for GROVIO

import axios from 'axios';

const PROD_API_ROOT = 'https://grovio-backend-k2hl.onrender.com/api';
const API_ROOT = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? PROD_API_ROOT : 'http://localhost:5000/api');
const BASE_URL = `${API_ROOT.replace(/\/+$/, '')}/auth`;
const client = axios.create({ baseURL: BASE_URL, timeout: 5000 });

const SAVED_CREDS_KEY = 'grovio_saved_credentials';
const AUTH_USER_KEY = 'grovio_auth_user';
const LOCAL_USERS_KEY = 'grovio_local_accounts';

export const DEMO_USERS = [
  {
    id: 'usr_shravani',
    name: 'Shravani',
    username: 'shravani',
    email: 'shravani@grovio.app',
    role: 'Organizer',
    initials: 'SH',
    color: '#10b981',
  },
  {
    id: 'usr_alex',
    name: 'Alex',
    username: 'alex',
    email: 'alex@grovio.app',
    role: 'Member',
    initials: 'AL',
    color: '#3b82f6',
  },
];

// Initialize local users storage with the demo users
function initLocalUsers() {
  try {
    const existing = localStorage.getItem(LOCAL_USERS_KEY);
    if (!existing) {
      const initial = DEMO_USERS.map((u) => ({
        ...u,
        password: 'password123',
        createdAt: new Date().toISOString(),
      }));
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(initial));
    }
  } catch (e) {
    console.warn('LocalStorage unavailable for local users:', e);
  }
}
initLocalUsers();

export function getLocalUsers() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveLocalUsers(users) {
  try {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save local users:', e);
  }
}

// ─── Session Helpers ─────────────────────────────────────────────────────────

export function getPersistedSession() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.id ? parsed : null;
  } catch {
    return null;
  }
}

export function rememberKnownUser(user) {
  if (!user || (!user.username && !user.id)) return;
  try {
    const local = getLocalUsers();
    const cleanU = (user.username || user.email || user.id).toLowerCase();
    const idx = local.findIndex((u) => u.username?.toLowerCase() === cleanU || u.id === user.id);
    const record = {
      id: user.id || `usr_${cleanU}`,
      name: user.name || cleanU,
      username: user.username || cleanU,
      email: user.email || '',
      role: user.role || 'Member',
      initials: (user.name || cleanU).slice(0, 2).toUpperCase(),
      householdCode: user.householdCode || null,
      token: user.token,
    };
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...record };
    } else {
      local.push(record);
    }
    saveLocalUsers(local);
  } catch (e) {
    console.warn('Failed to remember user:', e);
  }
}

const LINKED_ACCOUNTS_KEY = 'grovio_linked_user_accounts';

export function getLinkedAccountsMap() {
  try {
    const raw = localStorage.getItem(LINKED_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function linkAccounts(idA, idB) {
  if (!idA || !idB || idA === idB) return;
  try {
    const map = getLinkedAccountsMap();
    const cleanA = String(idA).toLowerCase();
    const cleanB = String(idB).toLowerCase();

    const listA = new Set(map[cleanA] || []);
    listA.add(cleanB);
    map[cleanA] = Array.from(listA);

    const listB = new Set(map[cleanB] || []);
    listB.add(cleanA);
    map[cleanB] = Array.from(listB);

    localStorage.setItem(LINKED_ACCOUNTS_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Failed to link accounts:', e);
  }
}

// Returns ONLY other accounts belonging to the SAME user (matching email or explicitly linked)
export function getAccountsForUser(currentUser) {
  if (!currentUser) return [];

  const isDemo = currentUser.id === 'usr_shravani' || currentUser.id === 'usr_alex' || currentUser.isDemo;
  if (isDemo) {
    // Demo accounts only switch between demo accounts
    return DEMO_USERS.map((d) => ({ ...d, isDemo: true }));
  }

  try {
    const local = getLocalUsers();
    const linkedMap = getLinkedAccountsMap();

    const currentId = (currentUser.id || '').toLowerCase();
    const currentUsername = (currentUser.username || '').toLowerCase();
    const currentEmail = (currentUser.email || '').trim().toLowerCase();

    const linkedIds = new Set();
    if (currentId && linkedMap[currentId]) {
      linkedMap[currentId].forEach((id) => linkedIds.add(id.toLowerCase()));
    }
    if (currentUsername && linkedMap[currentUsername]) {
      linkedMap[currentUsername].forEach((id) => linkedIds.add(id.toLowerCase()));
    }
    if (currentEmail && linkedMap[currentEmail]) {
      linkedMap[currentEmail].forEach((id) => linkedIds.add(id.toLowerCase()));
    }

    const matchedAccounts = [];
    const seen = new Set();

    // 1. Current user account
    const currentAcc = {
      id: currentUser.id || `usr_${currentUsername}`,
      name: currentUser.name || currentUsername,
      username: currentUser.username || currentUsername,
      email: currentUser.email || '',
      role: currentUser.role || 'Member',
      initials: (currentUser.name || currentUsername || 'U').slice(0, 2).toUpperCase(),
      householdCode: currentUser.householdCode || null,
      token: currentUser.token,
    };
    matchedAccounts.push(currentAcc);
    seen.add(currentAcc.id.toLowerCase());
    if (currentAcc.username) seen.add(currentAcc.username.toLowerCase());

    // 2. Only other accounts of the SAME user
    local.forEach((acc) => {
      // Never show demo accounts to real registered users!
      if (acc.id === 'usr_shravani' || acc.id === 'usr_alex' || acc.isDemo) {
        return;
      }

      const accId = (acc.id || '').toLowerCase();
      const accUsername = (acc.username || '').toLowerCase();
      const accEmail = (acc.email || '').trim().toLowerCase();

      if (seen.has(accId) || (accUsername && seen.has(accUsername))) {
        return;
      }

      // Check if same email or explicitly linked to this user
      const isSameEmail = currentEmail && accEmail && accEmail === currentEmail;
      const isLinked = linkedIds.has(accId) || (accUsername && linkedIds.has(accUsername)) || (accEmail && linkedIds.has(accEmail));

      if (isSameEmail || isLinked) {
        matchedAccounts.push({
          id: acc.id || `usr_${accUsername}`,
          name: acc.name || accUsername,
          username: acc.username || accUsername,
          email: acc.email || '',
          role: acc.role || 'Member',
          initials: (acc.name || accUsername || 'U').slice(0, 2).toUpperCase(),
          householdCode: acc.householdCode || null,
          token: acc.token,
        });
        seen.add(accId);
        if (accUsername) seen.add(accUsername);
      }
    });

    return matchedAccounts;
  } catch (err) {
    console.error('Error getting accounts for user:', err);
    return [currentUser];
  }
}

export function getAllKnownAccounts() {
  try {
    const local = getLocalUsers();
    const map = new Map();
    DEMO_USERS.forEach((d) => map.set((d.username || d.id).toLowerCase(), { ...d, isDemo: true }));
    local.forEach((l) => map.set((l.username || l.id).toLowerCase(), { ...l, isDemo: false }));
    return Array.from(map.values());
  } catch {
    return DEMO_USERS;
  }
}

export function setPersistedSession(user, token = `session_${Date.now()}`) {
  try {
    if (user) {
      const sessionUser = { ...user, token };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(sessionUser));
      rememberKnownUser(sessionUser);

      // Check if this account was logged into from an existing user's "+ Add Account"
      const linkingParent = sessionStorage.getItem('grovio_linking_account_from');
      if (linkingParent && linkingParent !== sessionUser.id) {
        linkAccounts(linkingParent, sessionUser.id);
        sessionStorage.removeItem('grovio_linking_account_from');
      }

      if (user.householdCode) {
        localStorage.setItem('grove_household_code', user.householdCode.trim().toUpperCase());
      } else {
        localStorage.removeItem('grove_household_code');
      }
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem('grove_household_code');
    }
  } catch (e) {
    console.error('Failed to persist session:', e);
  }
}

export function clearPersistedSession() {
  try {
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem('grove_household_code');
  } catch (e) {
    console.error('Failed to clear session:', e);
  }
}

// ─── Saved Credentials Helpers (Username or Email) ──────────────────────────

export function getSavedCredentials() {
  try {
    const raw = localStorage.getItem(SAVED_CREDS_KEY);
    if (!raw) return null;
    const creds = JSON.parse(raw);
    if (creds && (creds.identifier || creds.email)) {
      return {
        identifier: creds.identifier || creds.email,
        password: creds.password || '',
        remember: true,
      };
    }
  } catch {}
  return null;
}

export function saveCredentials(identifier, password) {
  try {
    const clean = (identifier || '').trim().toLowerCase();
    localStorage.setItem(
      SAVED_CREDS_KEY,
      JSON.stringify({
        identifier: clean,
        email: clean,
        password: password || '',
        remember: true,
        savedAt: new Date().toISOString(),
      })
    );
  } catch (e) {
    console.error('Failed to save credentials:', e);
  }
}

export function clearSavedCredentials() {
  try {
    localStorage.removeItem(SAVED_CREDS_KEY);
  } catch (e) {
    console.error('Failed to clear saved credentials:', e);
  }
}

// ─── Demo User Switcher ─────────────────────────────────────────────────────

export function loginDemoUser(userId) {
  clearPersistedSession();
  const target = DEMO_USERS.find((u) => u.id === userId) || DEMO_USERS[0];
  const userObj = {
    id: target.id,
    name: target.name,
    username: target.username || target.email.split('@')[0],
    email: target.email,
    role: target.role,
    initials: target.initials,
    householdCode: null,
    householdName: null,
  };
  setPersistedSession(userObj, `demo_token_${target.id}`);
  return userObj;
}

// ─── Authentication API Calls (Login with Username OR Email) ─────────────────

export async function loginUser(identifier, password) {
  const cleanId = (identifier || '').trim().toLowerCase();

  // Check demo accounts directly
  const demoMatch = DEMO_USERS.find(
    (d) => d.email.toLowerCase() === cleanId || d.username?.toLowerCase() === cleanId
  );
  if (demoMatch && (!password || password === 'password123')) {
    const userObj = {
      id: demoMatch.id,
      name: demoMatch.name,
      username: demoMatch.username || demoMatch.email.split('@')[0],
      email: demoMatch.email,
      role: demoMatch.role,
      initials: demoMatch.initials,
    };
    setPersistedSession(userObj);
    return { success: true, user: userObj, token: `demo_${demoMatch.id}` };
  }

  // Try real backend API
  try {
    const res = await client.post('/login', { identifier: cleanId, email: cleanId, password });
    if (res.data?.success) {
      setPersistedSession(res.data.user, res.data.token);
      return { success: true, user: res.data.user, token: res.data.token };
    }
  } catch (err) {
    if (err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
  }

  // Local storage fallback accounts
  const localUsers = getLocalUsers();
  const matched = localUsers.find(
    (u) => (u.email && u.email.toLowerCase() === cleanId) || (u.username && u.username.toLowerCase() === cleanId)
  );
  if (!matched) {
    throw new Error('Account not found. Please check your username/email or sign up.');
  }
  if (matched.password !== password) {
    throw new Error('Incorrect password. Please try again.');
  }

  const safeUser = {
    id: matched.id,
    name: matched.name,
    username: matched.username || matched.email.split('@')[0],
    email: matched.email,
    role: matched.role || 'Member',
    initials: (matched.name || 'U').slice(0, 2).toUpperCase(),
  };
  setPersistedSession(safeUser);
  return { success: true, user: safeUser, token: `local_${matched.id}` };
}

export async function registerUser(name, username, email, password) {
  clearPersistedSession();
  const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : null;
  const cleanName = (name || '').trim();
  const rawUsername = username || (cleanEmail ? cleanEmail.split('@')[0] : cleanName.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const cleanUsername = rawUsername.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '_');

  try {
    const res = await client.post('/register', {
      name: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      password,
    });
    if (res.data?.success) {
      setPersistedSession(res.data.user, res.data.token);
      return { success: true, user: res.data.user, token: res.data.token };
    }
  } catch (err) {
    if (err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
  }

  // Local fallback
  const localUsers = getLocalUsers();
  if (cleanEmail && localUsers.some((u) => u.email === cleanEmail)) {
    throw new Error('An account with this email already exists.');
  }
  if (localUsers.some((u) => u.username && u.username.toLowerCase() === cleanUsername.toLowerCase())) {
    throw new Error(`Username "${cleanUsername}" is already taken. Please choose another.`);
  }

  const newUser = {
    id: `usr_${Date.now()}`,
    name: cleanName,
    username: cleanUsername,
    email: cleanEmail || '',
    password: password,
    role: 'Member',
    householdCode: null,
    householdName: null,
    initials: cleanName.slice(0, 2).toUpperCase(),
    createdAt: new Date().toISOString(),
  };
  localUsers.push(newUser);
  saveLocalUsers(localUsers);

  setPersistedSession(newUser);
  return { success: true, user: newUser, token: `local_${newUser.id}` };
}

export async function updateUserProfile(profileData) {
  const currentSession = getPersistedSession();
  const userId = currentSession?.id;

  try {
    const res = await client.put('/profile', { ...profileData, userId }, {
      headers: {
        'x-user-id': userId,
        Authorization: currentSession?.token ? `Bearer ${currentSession.token}` : undefined,
      },
    });
    if (res.data?.success && res.data.user) {
      const updatedUser = {
        ...currentSession,
        ...res.data.user,
        initials: (res.data.user.name || currentSession.name || 'U').slice(0, 2).toUpperCase(),
      };
      setPersistedSession(updatedUser, currentSession?.token);
      return { success: true, user: updatedUser, message: res.data.message };
    }
  } catch (err) {
    if (profileData.newPassword) {
      return {
        success: false,
        message: err.response?.data?.message || 'Password update failed. Please check your current password.',
      };
    }
    console.warn('API profile update failed, applying locally:', err.message);
  }

  // Fallback update in local storage
  const updatedUser = {
    ...currentSession,
    ...profileData,
    initials: (profileData.name || currentSession?.name || 'U').slice(0, 2).toUpperCase(),
  };
  setPersistedSession(updatedUser, currentSession?.token);

  const localUsers = getLocalUsers();
  const idx = localUsers.findIndex((u) => u.id === userId || u.username === currentSession?.username);
  if (idx !== -1) {
    localUsers[idx] = { ...localUsers[idx], ...profileData };
    saveLocalUsers(localUsers);
  }

  return { success: true, user: updatedUser };
}

export async function forgotPasswordRequest(identifier) {
  const cleanId = (identifier || '').trim().toLowerCase();
  try {
    const res = await client.post('/forgot-password', { identifier: cleanId, email: cleanId });
    if (res.data?.success) return res.data;
  } catch {}

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return {
    success: true,
    message: 'Verification code generated for password recovery.',
    resetCode: code,
  };
}

export async function resetPasswordWithCode(identifier, code, newPassword) {
  const cleanId = (identifier || '').trim().toLowerCase();
  try {
    const res = await client.post('/reset-password', {
      identifier: cleanId,
      email: cleanId,
      code,
      newPassword,
    });
    if (res.data?.success) return res.data;
  } catch {}

  // Update local storage account if present
  const localUsers = getLocalUsers();
  const idx = localUsers.findIndex(
    (u) => (u.email && u.email.toLowerCase() === cleanId) || (u.username && u.username.toLowerCase() === cleanId)
  );
  if (idx !== -1) {
    localUsers[idx].password = newPassword;
    saveLocalUsers(localUsers);
  }

  return { success: true, message: 'Password reset successfully! You can now log in.' };
}
