// src/store/useSettings.js
// Persistent settings store for GROVIO — Clean, light-neutral kitchen aesthetic
// Supports multi-currency dynamic conversions and comprehensive quantity measurements

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'grovio_settings';

// ─── Theme Configurations ───────────────────────────────────────────────────
export const THEMES = [
  {
    id: 'minimalist',
    label: 'GROVIO Olive',
    isDefault: true,
    description: 'Warm linen kitchen aesthetic with rich olive accents (from GROVIO)',
    bgPreview: '#fbfbf8',
    cardPreview: '#ffffff',
    borderPreview: '#dcdfd5',
    accentPreview: '#556b2f',
    vars: {
      '--bg': '#fbfbf8',
      '--bg-raised': '#ffffff',
      '--surface': '#ffffff',
      '--surface-2': '#f3f5ee',
      '--border': '#dcdfd5',
      '--border-soft': 'rgba(220, 223, 213, 0.85)',
      '--text': '#1d2315',
      '--text-muted': '#505648',
      '--text-dim': '#8b9183',
      '--sage': '#556b2f',
      '--green': '#556b2f',
      '--green-light': '#688339',
      '--green-glow': 'rgba(85, 107, 47, 0.15)',
      '--coral': '#e0533c',
      '--coral-soft': 'rgba(224, 83, 60, 0.1)',
      '--red': '#e0533c',
      '--red-soft': 'rgba(224, 83, 60, 0.1)',
      '--amber': '#df9857',
      '--amber-soft': 'rgba(223, 152, 87, 0.12)',
      '--blue': '#3b82f6',
      '--blue-soft': 'rgba(59, 130, 246, 0.1)',
    },
  },
  {
    id: 'slate',
    label: 'Slate Charcoal',
    description: 'Deep modern slate and charcoal dark theme',
    bgPreview: '#0f172a',
    cardPreview: '#1e293b',
    borderPreview: '#334155',
    accentPreview: '#10b981',
    vars: {
      '--bg': '#0f172a',
      '--bg-raised': '#162032',
      '--surface': '#1e293b',
      '--surface-2': '#273549',
      '--border': '#334155',
      '--border-soft': 'rgba(51, 65, 85, 0.6)',
      '--text': '#f8fafc',
      '--text-muted': '#94a3b8',
      '--text-dim': '#64748b',
      '--sage': '#60a5fa',
      '--green': '#10b981',
      '--green-light': '#34d399',
      '--green-glow': 'rgba(16, 185, 129, 0.2)',
      '--coral': '#fb7185',
      '--coral-soft': 'rgba(251, 113, 133, 0.15)',
      '--red': '#fb7185',
      '--red-soft': 'rgba(251, 113, 133, 0.15)',
      '--amber': '#fbbf24',
      '--amber-soft': 'rgba(251, 191, 36, 0.15)',
      '--blue': '#60a5fa',
      '--blue-soft': 'rgba(96, 165, 250, 0.15)',
    },
  },
  {
    id: 'forest',
    label: 'Forest Mint',
    description: 'Botanical mint and soft organic green tones',
    bgPreview: '#f0fdf4',
    cardPreview: '#ffffff',
    borderPreview: '#bbf7d0',
    accentPreview: '#059669',
    vars: {
      '--bg': '#f0fdf4',
      '--bg-raised': '#ffffff',
      '--surface': '#ffffff',
      '--surface-2': '#dcfce7',
      '--border': '#bbf7d0',
      '--border-soft': 'rgba(187, 247, 208, 0.8)',
      '--text': '#14532d',
      '--text-muted': '#166534',
      '--text-dim': '#4ade80',
      '--sage': '#16a34a',
      '--green': '#059669',
      '--green-light': '#047857',
      '--green-glow': 'rgba(5, 150, 105, 0.14)',
      '--coral': '#e11d48',
      '--coral-soft': 'rgba(225, 29, 72, 0.12)',
      '--red': '#e11d48',
      '--red-soft': 'rgba(225, 29, 72, 0.12)',
      '--amber': '#d97706',
      '--amber-soft': 'rgba(217, 119, 6, 0.12)',
      '--blue': '#0284c7',
      '--blue-soft': 'rgba(2, 132, 199, 0.12)',
    },
  },
  {
    id: 'linen',
    label: 'Warm Linen',
    description: 'Earthy oatmeal and warm stone kitchen tones',
    bgPreview: '#faf7f2',
    cardPreview: '#ffffff',
    borderPreview: '#e7e2d9',
    accentPreview: '#059669',
    vars: {
      '--bg': '#faf7f2',
      '--bg-raised': '#ffffff',
      '--surface': '#ffffff',
      '--surface-2': '#f4ede4',
      '--border': '#e7e2d9',
      '--border-soft': 'rgba(231, 226, 217, 0.8)',
      '--text': '#292524',
      '--text-muted': '#57534e',
      '--text-dim': '#a8a29e',
      '--sage': '#059669',
      '--green': '#059669',
      '--green-light': '#047857',
      '--green-glow': 'rgba(5, 150, 105, 0.12)',
      '--coral': '#ea580c',
      '--coral-soft': 'rgba(234, 88, 12, 0.12)',
      '--red': '#ea580c',
      '--red-soft': 'rgba(234, 88, 12, 0.12)',
      '--amber': '#d97706',
      '--amber-soft': 'rgba(217, 119, 6, 0.12)',
      '--blue': '#2563eb',
      '--blue-soft': 'rgba(37, 99, 235, 0.12)',
    },
  },
  {
    id: 'midnight',
    label: 'Dark Midnight',
    description: 'Ultra high-contrast deep midnight theme',
    bgPreview: '#0b0f17',
    cardPreview: '#121824',
    borderPreview: '#1f293d',
    accentPreview: '#34d399',
    vars: {
      '--bg': '#0b0f17',
      '--bg-raised': '#101520',
      '--surface': '#121824',
      '--surface-2': '#192233',
      '--border': '#1f293d',
      '--border-soft': 'rgba(31, 41, 61, 0.7)',
      '--text': '#e2e8f0',
      '--text-muted': '#94a3b8',
      '--text-dim': '#64748b',
      '--sage': '#34d399',
      '--green': '#10b981',
      '--green-light': '#34d399',
      '--green-glow': 'rgba(16, 185, 129, 0.22)',
      '--coral': '#f43f5e',
      '--coral-soft': 'rgba(244, 63, 94, 0.18)',
      '--red': '#f43f5e',
      '--red-soft': 'rgba(244, 63, 94, 0.18)',
      '--amber': '#f59e0b',
      '--amber-soft': 'rgba(245, 158, 11, 0.18)',
      '--blue': '#38bdf8',
      '--blue-soft': 'rgba(56, 189, 248, 0.18)',
    },
  },
];

// ─── Currency System & Exchange Rates ───────────────────────────────────────
// Baseline rates calibrated with 1 USD = 85.0 INR, 1 EUR = 92.5 INR, 1 GBP = 108.0 INR
export const CURRENCY_CONFIG = {
  INR: {
    code: 'INR',
    symbol: '₹',
    label: 'Indian Rupee (₹ INR)',
    rateAgainstINR: 1.0,
    decimals: 0,
  },
  USD: {
    code: 'USD',
    symbol: '$',
    label: 'US Dollar ($ USD)',
    rateAgainstINR: 1 / 85.0, // 1 USD = 85 INR
    decimals: 2,
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    label: 'Euro (€ EUR)',
    rateAgainstINR: 1 / 92.5, // 1 EUR = 92.5 INR
    decimals: 2,
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    label: 'British Pound (£ GBP)',
    rateAgainstINR: 1 / 108.0, // 1 GBP = 108 INR
    decimals: 2,
  },
};

export const CURRENCY_OPTIONS = Object.values(CURRENCY_CONFIG);

/**
 * Convert numerical monetary amount from one currency to another
 */
export function convertCurrency(amount, fromCode = 'INR', toCode = 'INR') {
  if (amount === undefined || amount === null || isNaN(amount)) return 0;
  const num = Number(amount);
  if (fromCode === toCode) return num;

  const fromCfg = CURRENCY_CONFIG[fromCode] || CURRENCY_CONFIG.INR;
  const toCfg = CURRENCY_CONFIG[toCode] || CURRENCY_CONFIG.INR;

  // Convert from fromCode -> INR (base) -> toCode
  const inINR = num / fromCfg.rateAgainstINR;
  const converted = inINR * toCfg.rateAgainstINR;

  return toCfg.decimals === 0 ? Math.round(converted) : Number(converted.toFixed(toCfg.decimals));
}

/**
 * Format numerical monetary amount with the active currency symbol
 */
export function formatCurrency(amount, currencyCode = 'INR') {
  if (amount === undefined || amount === null || isNaN(amount)) return '';
  const cfg = CURRENCY_CONFIG[currencyCode] || CURRENCY_CONFIG.INR;
  const num = Number(amount);
  if (cfg.decimals === 0) {
    return `${cfg.symbol}${Math.round(num).toLocaleString()}`;
  }
  return `${cfg.symbol}${num.toFixed(cfg.decimals)}`;
}

// ─── Measurement Units System (kg, liter, gallon, etc.) ──────────────────────
export const MEASUREMENT_UNITS = [
  // Mass / Weight
  { id: 'kg',   label: 'kg',   fullName: 'Kilograms', short: 'kg',   type: 'mass',   system: 'metric' },
  { id: 'g',    label: 'g',    fullName: 'Grams',     short: 'g',    type: 'mass',   system: 'metric' },
  { id: 'lbs',  label: 'lbs',  fullName: 'Pounds',    short: 'lbs',  type: 'mass',   system: 'imperial' },
  { id: 'oz',   label: 'oz',   fullName: 'Ounces',    short: 'oz',   type: 'mass',   system: 'imperial' },

  // Volume / Liquids
  { id: 'L',    label: 'L',    fullName: 'Liters',    short: 'L',    type: 'volume', system: 'metric' },
  { id: 'ml',   label: 'ml',   fullName: 'Milliliters', short: 'ml', type: 'volume', system: 'metric' },
  { id: 'gal',  label: 'gal',  fullName: 'Gallons',   short: 'gal',  type: 'volume', system: 'imperial' },

  // Count / Discrete
  { id: 'pcs',  label: 'pcs',  fullName: 'Pieces',    short: 'pcs',  type: 'count',  system: 'universal' },
  { id: 'pack', label: 'pack', fullName: 'Packs',     short: 'pack', type: 'count',  system: 'universal' },
  { id: 'bunch',label: 'bunch',fullName: 'Bunches',   short: 'bunch',type: 'count',  system: 'universal' },
];

export function formatQuantity(quantity, unit = 'kg') {
  if (quantity === undefined || quantity === null || quantity === '') return '';
  const num = typeof quantity === 'number' ? quantity : parseFloat(quantity);
  if (isNaN(num)) return `${quantity} ${unit}`.trim();
  const unitStr = unit || 'kg';
  return `${Number(num.toFixed(2))} ${unitStr}`;
}

export const STORAGE_ENVIRONMENTS = [
  { id: 'ambient',       label: 'Ambient (Room Temp)', multiplier: 1.0, description: 'Standard kitchen condition (~24°C)' },
  { id: 'refrigerated',  label: 'Refrigerated',        multiplier: 1.8, description: 'Crisper drawer & chill shelves (~4°C)' },
  { id: 'chiller',       label: 'Deep Chiller',        multiplier: 2.5, description: 'Sub-zero low humidity cooling (0°C)' },
];

export const SPEECH_LANGUAGES = [
  { code: 'en-IN', label: 'English - India (en-IN)' },
  { code: 'en-US', label: 'English - US (en-US)' },
];

// ─── Per-User Scoped Settings ───────────────────────────────────────────────

function getActiveUserId() {
  try {
    const raw = localStorage.getItem('grovio_auth_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (u?.id) return u.id;
    }
  } catch {}
  return 'guest_user';
}

export function getUserStorageKey(userId) {
  const uid = userId || getActiveUserId() || 'guest_user';
  return `grovio_settings_${uid}`;
}

export function getDefaultSettingsForUser(userId) {
  const uid = userId || getActiveUserId() || 'guest_user';

  if (uid === 'usr_shravani') {
    return {
      themeId: 'forest', // Shravani's signature Botanical Mint aesthetic
      regional: {
        currency: 'INR',
        measurementSystem: 'metric',
        wasteBudget: 500,
      },
      preservation: {
        spoilageWindowHours: 48,
        storageMultiplier: 1.8,
        storageEnvironment: 'refrigerated',
        categoryShelfLife: { leafyGreens: 3, freshFruits: 5, dairyMeats: 7, rootVegetables: 14 },
      },
      automation: { autoRestockPantryLow: true, autoArchiveConsumed: false, desktopNotifications: false },
      voiceInput: { speechLanguage: 'en-IN', audioFeedback: true },
      profile: {
        name: 'Shravani',
        username: 'shravani',
        role: 'Household Organizer',
        bio: 'Zero-waste Indian & Mediterranean home kitchen focused on leafy greens freshness.',
        householdSize: 2,
        dietaryPrefs: ['Vegetarian', 'Seasonal'],
        favoriteCuisine: 'Indian & Mediterranean',
      },
    };
  }

  if (uid === 'usr_alex') {
    return {
      themeId: 'slate', // Alex's signature Slate Charcoal aesthetic
      regional: {
        currency: 'USD',
        measurementSystem: 'imperial',
        wasteBudget: 40,
      },
      preservation: {
        spoilageWindowHours: 36,
        storageMultiplier: 1.8,
        storageEnvironment: 'refrigerated',
        categoryShelfLife: { leafyGreens: 4, freshFruits: 6, dairyMeats: 5, rootVegetables: 10 },
      },
      automation: { autoRestockPantryLow: true, autoArchiveConsumed: true, desktopNotifications: false },
      voiceInput: { speechLanguage: 'en-US', audioFeedback: true },
      profile: {
        name: 'Alex',
        username: 'alex',
        role: 'Member & Meal Planner',
        bio: 'High-protein fitness meal preps and bulk pantry batch management.',
        householdSize: 1,
        dietaryPrefs: ['High-Protein', 'Low-Carb'],
        favoriteCuisine: 'Contemporary Fusion',
      },
    };
  }

  // Any other registered user / friend / guest
  let activeUser = null;
  try {
    const raw = localStorage.getItem('grovio_auth_user');
    if (raw) {
      const u = JSON.parse(raw);
      if (!userId || u?.id === userId) {
        activeUser = u;
      }
    }
  } catch {}

  const cleanName = activeUser?.name || 'User';
  const cleanUsername = activeUser?.username || 'user';

  return {
    themeId: 'minimalist',
    regional: {
      currency: 'INR',
      measurementSystem: 'metric',
      wasteBudget: 500,
    },
    preservation: {
      spoilageWindowHours: 48,
      storageMultiplier: 1.8,
      storageEnvironment: 'refrigerated',
      categoryShelfLife: { leafyGreens: 3, freshFruits: 5, dairyMeats: 7, rootVegetables: 14 },
    },
    automation: { autoRestockPantryLow: true, autoArchiveConsumed: false, desktopNotifications: false },
    voiceInput: { speechLanguage: 'en-IN', audioFeedback: true },
    profile: {
      name: cleanName,
      username: cleanUsername,
      role: activeUser?.role || 'Member',
      bio: activeUser?.bio || 'Personal kitchen stock & decay timer tracking.',
      householdSize: activeUser?.householdSize || 1,
      dietaryPrefs: activeUser?.dietaryPreferences || ['Fresh Foods'],
      favoriteCuisine: activeUser?.favoriteCuisine || 'Seasonal',
    },
  };
}

export const DEFAULT_SETTINGS = getDefaultSettingsForUser();

function deepMerge(target, source) {
  if (!source) return target;
  const output = { ...target };
  Object.keys(source).forEach((key) => {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = deepMerge(target[key] || {}, source[key]);
    } else if (source[key] !== undefined) {
      output[key] = source[key];
    }
  });
  return output;
}

export function loadSettings(userId) {
  try {
    const key = getUserStorageKey(userId);
    const raw = localStorage.getItem(key);
    const defaults = getDefaultSettingsForUser(userId);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    const merged = deepMerge(defaults, parsed);
    if (!merged.themeId) {
      merged.themeId = defaults.themeId || 'minimalist';
    }
    if (!merged.regional) {
      merged.regional = defaults.regional;
    }
    return merged;
  } catch {
    return getDefaultSettingsForUser(userId);
  }
}

function saveSettings(s, userId) {
  try {
    const key = getUserStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(s));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function applyTheme(themeId = 'minimalist') {
  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([key, val]) => root.style.setProperty(key, val));
  root.setAttribute('data-theme', theme.id);
  if (typeof document !== 'undefined') {
    if (theme.id === 'slate' || theme.id === 'midnight') {
      document.body.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      document.body.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }
}

// Global reactive store singleton
let _listeners = [];
let _currencyListeners = [];
let _currentUserId = getActiveUserId();
let _settings = loadSettings(_currentUserId);

export function switchUserSettings(userId) {
  const targetUid = userId || 'guest_user';
  _currentUserId = targetUid;
  const prevCurrency = _settings?.regional?.currency || 'INR';
  _settings = loadSettings(targetUid);
  applyTheme(_settings.themeId || 'minimalist');

  _listeners.forEach((fn) => {
    try {
      fn(_settings);
    } catch (e) {
      console.error('Settings listener error on user switch:', e);
    }
  });

  const nextCurrency = _settings.regional?.currency || 'INR';
  if (prevCurrency !== nextCurrency) {
    _currencyListeners.forEach((fn) => {
      try {
        fn(prevCurrency, nextCurrency);
      } catch (e) {
        console.error('Currency listener error on user switch:', e);
      }
    });
  }
}

export function getSettings() {
  return _settings;
}

export function updateSettings(patch, userId) {
  const targetUid = userId || _currentUserId;
  const prevCurrency = _settings.regional?.currency || 'INR';
  const next = deepMerge(_settings, patch);
  _settings = next;
  saveSettings(_settings, targetUid);

  _listeners.forEach((fn) => {
    try {
      fn(_settings);
    } catch (e) {
      console.error('Settings listener error:', e);
    }
  });

  const nextCurrency = next.regional?.currency || 'INR';
  if (prevCurrency !== nextCurrency) {
    _currencyListeners.forEach((fn) => {
      try {
        fn(prevCurrency, nextCurrency);
      } catch (e) {
        console.error('Currency listener error:', e);
      }
    });
  }

  if (patch.themeId) {
    applyTheme(patch.themeId);
  }
}

export function subscribeSettings(fn) {
  _listeners.push(fn);
  return () => {
    _listeners = _listeners.filter((l) => l !== fn);
  };
}

export function subscribeCurrencyChange(fn) {
  _currencyListeners.push(fn);
  return () => {
    _currencyListeners = _currencyListeners.filter((l) => l !== fn);
  };
}

/** React hook returning reactive [settings, updateSettings] */
export function useSettings() {
  const [settings, setSettings] = useState(getSettings);

  useEffect(() => {
    applyTheme(settings.themeId || 'minimalist');
    const unsub = subscribeSettings(setSettings);
    return unsub;
  }, [settings.themeId]);

  return [settings, updateSettings];
}
