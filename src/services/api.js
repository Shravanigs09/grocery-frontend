// src/services/api.js
// Full API layer for GROVIO with multi-user isolation and unit-only metrics

import axios from 'axios';
import { addDays, toDateKey, todayKey } from '../utils/dates';

const PROD_API_URL = 'https://grovio-backend-k2hl.onrender.com/api';
const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? PROD_API_URL : 'http://localhost:5000/api');
let USE_MOCK = false;

const client = axios.create({ baseURL: BASE_URL, timeout: 8000 });

export function getActiveUser() {
  try {
    const raw = localStorage.getItem('grovio_auth_user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getActiveUserId() {
  const u = getActiveUser();
  if (u?.id) return u.id;
  return 'guest_user';
}

client.interceptors.request.use((config) => {
  try {
    const user = getActiveUser();
    const userId = user?.id || 'guest_user';
    if (userId) {
      config.headers['x-user-id'] = userId;
    }
    if (user?.token) {
      config.headers['Authorization'] = `Bearer ${user.token}`;
    }

    // Attach household code if the current logged-in user has one or active in storage
    const activeHousehold = (user?.householdCode || localStorage.getItem('grove_household_code') || '').trim();
    if (activeHousehold) {
      config.headers['x-household-code'] = activeHousehold.toUpperCase();
    } else {
      delete config.headers['x-household-code'];
    }
  } catch {}
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (!err.response) USE_MOCK = true;
    return Promise.reject(err);
  }
);

const daysFromNow = (d) => addDays(todayKey(), d);

function groceryId(doc) {
  return doc?.id || doc?._id?.toString?.() || doc?._id || '';
}

export function toClientGrocery(doc) {
  if (!doc) return doc;
  const panel = doc.panelType || (doc.track === 'pantry' ? 'PANTRY' : doc.track === 'produce' ? 'PRODUCE' : '');
  const qtyObj = doc.quantity;
  const quantity = typeof qtyObj === 'object' && qtyObj !== null
    ? (qtyObj.value ?? 1)
    : (typeof doc.quantity === 'number' ? doc.quantity : (parseFloat(doc.quantity) || 1));
  const unit = typeof qtyObj === 'object' && qtyObj !== null
    ? (qtyObj.unit || 'kg')
    : (doc.unit || (typeof doc.quantity === 'string' && doc.quantity.replace(/[\d.\s]/g, '')) || 'kg');
  const price = typeof doc.price === 'number' ? doc.price : (parseFloat(doc.price) || 0);

  return {
    ...doc,
    id: groceryId(doc),
    userId: doc.userId || getActiveUserId() || 'guest_user',
    track: doc.track || (panel === 'PANTRY' ? 'pantry' : 'produce'),
    status: String(doc.status || 'active').toLowerCase(),
    pantryState: doc.pantryState || doc.stockLevel || 'FULL',
    expiryDate: toDateKey(doc.computedExpiryDate || doc.expiryDate),
    purchaseDate: toDateKey(doc.purchaseDate),
    quantity,
    unit: unit || 'kg',
    price,
  };
}

function toServerGrocery(item = {}) {
  const currentUid = getActiveUserId();
  const householdCode = getActiveHouseholdCode();
  const payload = {
    userId: householdCode || item.userId || currentUid,
  };
  if (item.name !== undefined) payload.name = item.name;
  if (item.track !== undefined || item.panelType !== undefined) {
    payload.panelType = item.track === 'pantry' || item.panelType === 'PANTRY' ? 'PANTRY' : 'PRODUCE';
  }
  if (item.category !== undefined) payload.category = item.category;
  if (item.storageLocation !== undefined) payload.storageLocation = item.storageLocation;
  if (item.pantryState !== undefined || item.stockLevel !== undefined) {
    payload.stockLevel = item.pantryState || item.stockLevel;
  }
  if (item.status !== undefined) payload.status = String(item.status).toUpperCase();
  if (item.purchaseDate !== undefined) payload.purchaseDate = item.purchaseDate;
  if (item.shelfLifeDays !== undefined) payload.shelfLifeDays = item.shelfLifeDays;
  if (item.expiryDate !== undefined) payload.expiryDate = item.expiryDate;
  if (item.price !== undefined) payload.price = Number(item.price) || 0;
  if (item.quantity !== undefined || item.unit !== undefined) {
    const qVal = typeof item.quantity === 'number' ? item.quantity : (parseFloat(item.quantity) || 1);
    const qUnit = item.unit || (typeof item.quantity === 'string' && item.quantity.replace(/[\d.\s]/g, '')) || 'kg';
    payload.quantity = { value: qVal, unit: qUnit };
  }
  return payload;
}

export function toClientNote(doc) {
  if (!doc) return doc;
  return {
    ...doc,
    id: groceryId(doc),
    userId: doc.userId || getActiveUserId() || 'guest_user',
    done: doc.done ?? doc.isBought ?? false,
    category: doc.category || 'General',
    quantity: doc.quantity || 1,
    unit: doc.unit || 'kg',
    estimatedPrice: doc.estimatedPrice || doc.price || 0,
  };
}

function unwrapItem(res, mapper) {
  const payload = res?.data;
  const doc = payload?.data ?? payload;
  return { data: mapper(doc) };
}

function unwrapList(res, mapper, fallback) {
  const payload = res?.data;
  const list = payload?.data ?? payload;
  if (!Array.isArray(list)) return { data: fallback };
  return { data: list.map(mapper) };
}

// ─── User-Isolated Mock Data ────────────────────────────────────────────────
export let mockGroceries = [
  // Shravani's Stock (Produce + Pantry)
  { id:'g1', userId:'usr_shravani', name:'Baby Spinach',   track:'produce', category:'Vegetables', quantity: 500, unit: 'g', price: 40, purchaseDate:daysFromNow(-2), shelfLifeDays:3,  expiryDate:daysFromNow(1),  status:'active', storageLocation:'fridge' },
  { id:'g2', userId:'usr_shravani', name:'Whole Milk',     track:'produce', category:'Dairy',      quantity: 1, unit: 'L', price: 68, purchaseDate:daysFromNow(-4), shelfLifeDays:6,  expiryDate:daysFromNow(2),  status:'active', storageLocation:'fridge' },
  { id:'g3', userId:'usr_shravani', name:'Strawberries',   track:'produce', category:'Fruit',      quantity: 1, unit: 'pack', price: 120, purchaseDate:daysFromNow(-3), shelfLifeDays:4,  expiryDate:daysFromNow(1),  status:'active', storageLocation:'fridge' },
  { id:'g4', userId:'usr_shravani', name:'Chicken Breast', track:'produce', category:'Meat',       quantity: 1, unit: 'kg', price: 240, purchaseDate:daysFromNow(-1), shelfLifeDays:2,  expiryDate:daysFromNow(1),  status:'active', storageLocation:'fridge' },
  { id:'g5', userId:'usr_shravani', name:'Lettuce',        track:'produce', category:'Vegetables', quantity: 1, unit: 'pcs', price: 45, purchaseDate:daysFromNow(-5), shelfLifeDays:5,  expiryDate:daysFromNow(0),  status:'active', storageLocation:'fridge' },
  { id:'g6', userId:'usr_shravani', name:'Greek Yogurt',   track:'produce', category:'Dairy',      quantity: 400, unit: 'g', price: 90, purchaseDate:daysFromNow(-7), shelfLifeDays:14, expiryDate:daysFromNow(7),  status:'active', storageLocation:'fridge' },
  { id:'g7', userId:'usr_shravani', name:'Sourdough Bread',track:'produce', category:'Bakery',     quantity: 1, unit: 'pack', price: 85, purchaseDate:daysFromNow(-1), shelfLifeDays:4,  expiryDate:daysFromNow(3),  status:'active', storageLocation:'counter'},
  { id:'g8', userId:'usr_shravani', name:'Basmati Rice',   track:'pantry',  category:'Pantry',     quantity: 5, unit: 'kg', price: 350, pantryState:'HALF', status:'active',
    stateTransitionHistory:[{state:'FULL',timestamp:daysFromNow(-14)},{state:'HALF',timestamp:daysFromNow(-7)}] },
  { id:'g9', userId:'usr_shravani', name:'Olive Oil',      track:'pantry',  category:'Pantry',     quantity: 1, unit: 'L', price: 550, pantryState:'FULL', status:'active', stateTransitionHistory:[] },
  { id:'g10',userId:'usr_shravani', name:'Wheat Flour',    track:'pantry',  category:'Pantry',     quantity: 10, unit: 'kg', price: 420, pantryState:'LOW',  status:'active',
    stateTransitionHistory:[{state:'FULL',timestamp:daysFromNow(-20)},{state:'HALF',timestamp:daysFromNow(-10)},{state:'LOW',timestamp:daysFromNow(-3)}] },

  // Alex's Stock (Produce + Pantry)
  { id:'g11', userId:'usr_alex', name:'Avocados',      track:'produce', category:'Fruit',      quantity: 4, unit: 'pcs', price: 160, purchaseDate:daysFromNow(-1), shelfLifeDays:5,  expiryDate:daysFromNow(4),  status:'active', storageLocation:'counter' },
  { id:'g12', userId:'usr_alex', name:'Almond Milk',   track:'produce', category:'Dairy',      quantity: 1, unit: 'gal', price: 210, purchaseDate:daysFromNow(-2), shelfLifeDays:8,  expiryDate:daysFromNow(6),  status:'active', storageLocation:'fridge' },
  { id:'g13', userId:'usr_alex', name:'Salmon Fillet', track:'produce', category:'Meat',       quantity: 500, unit: 'g', price: 450, purchaseDate:daysFromNow(-1), shelfLifeDays:3,  expiryDate:daysFromNow(1),  status:'active', storageLocation:'fridge' },
  { id:'g14', userId:'usr_alex', name:'Blueberries',   track:'produce', category:'Fruit',      quantity: 250, unit: 'g', price: 180, purchaseDate:daysFromNow(-2), shelfLifeDays:6,  expiryDate:daysFromNow(3),  status:'active', storageLocation:'fridge' },
  { id:'g15', userId:'usr_alex', name:'Bell Peppers',  track:'produce', category:'Vegetables', quantity: 1, unit: 'kg', price: 80, purchaseDate:daysFromNow(-3), shelfLifeDays:7,  expiryDate:daysFromNow(4),  status:'active', storageLocation:'fridge' },
  { id:'g16', userId:'usr_alex', name:'Organic Quinoa',track:'pantry',  category:'Pantry',     quantity: 1, unit: 'kg', price: 280, pantryState:'FULL', status:'active', stateTransitionHistory:[] },
  { id:'g17', userId:'usr_alex', name:'Penne Pasta',   track:'pantry',  category:'Pantry',     quantity: 500, unit: 'g', price: 95, pantryState:'LOW',  status:'active',
    stateTransitionHistory:[{state:'FULL',timestamp:daysFromNow(-15)},{state:'LOW',timestamp:daysFromNow(-2)}] },
].map(toClientGrocery);

export let mockNotes = [
  // Shravani's Notes
  { id:'n1', userId:'usr_shravani', name:'Eggs (12-pack)', category:'Dairy',      quantity: 12, unit:'pcs', estimatedPrice: 90, done:false, targetPanel:'PRODUCE' },
  { id:'n2', userId:'usr_shravani', name:'Tomatoes',       category:'Vegetables', quantity: 2, unit:'kg', estimatedPrice: 70, done:false, targetPanel:'PRODUCE' },
  { id:'n3', userId:'usr_shravani', name:'Oat Milk',       category:'Dairy',      quantity: 1, unit:'L', estimatedPrice: 180, done:false, targetPanel:'PRODUCE' },

  // Alex's Notes
  { id:'n4', userId:'usr_alex', name:'Chia Seeds',    category:'Pantry', quantity: 250, unit:'g', estimatedPrice: 150, done:false, targetPanel:'PANTRY' },
  { id:'n5', userId:'usr_alex', name:'Parmesan Block',category:'Dairy',  quantity: 200, unit:'g', estimatedPrice: 320, done:false, targetPanel:'PRODUCE' },
];

export let mockWasteLog = [
  // Shravani's Waste History
  { id:'w1', userId:'usr_shravani', itemName:'Cucumber',    category:'Vegetables', quantity: 1, unit:'kg', price: 30, date:daysFromNow(-6), week:'Last Week', status:'wasted' },
  { id:'w2', userId:'usr_shravani', itemName:'Paneer',      category:'Dairy',      quantity: 250, unit:'g', price: 80, date:daysFromNow(-5), week:'Last Week', status:'wasted' },
  { id:'w3', userId:'usr_shravani', itemName:'Tomatoes',    category:'Vegetables', quantity: 1, unit:'kg', price: 35, date:daysFromNow(-4), week:'Last Week', status:'consumed' },
  { id:'w4', userId:'usr_shravani', itemName:'Coriander',   category:'Vegetables', quantity: 1, unit:'bunch', price: 20, date:daysFromNow(-2), week:'This Week', status:'wasted' },
  { id:'w5', userId:'usr_shravani', itemName:'Strawberries',category:'Fruit',      quantity: 1, unit:'pack', price: 120, date:daysFromNow(-1), week:'This Week', status:'consumed' },

  // Alex's Waste History
  { id:'w6', userId:'usr_alex', itemName:'Fresh Basil', category:'Vegetables', quantity: 1, unit:'bunch', price: 40, date:daysFromNow(-3), week:'This Week', status:'wasted' },
  { id:'w7', userId:'usr_alex', itemName:'Greek Yogurt',category:'Dairy',      quantity: 400, unit:'g', price: 90, date:daysFromNow(-2), week:'This Week', status:'consumed' },
];

function toClientWaste(doc) {
  const qtyObj = doc.quantity;
  const quantity = typeof qtyObj === 'object' && qtyObj !== null
    ? (qtyObj.value ?? 1)
    : (typeof doc.quantity === 'number' ? doc.quantity : (parseFloat(doc.quantity) || 1));
  const unit = typeof qtyObj === 'object' && qtyObj !== null
    ? (qtyObj.unit || 'kg')
    : (doc.unit || 'kg');
  const price = typeof doc.price === 'number' ? doc.price : (parseFloat(doc.price) || 0);

  return {
    id: groceryId(doc),
    userId: doc.userId || getActiveUserId() || 'guest_user',
    itemName: doc.itemName || doc.name,
    category: doc.category || 'General',
    status: String(doc.status || 'wasted').toLowerCase(),
    date: toDateKey(doc.date || doc.resolvedDate || doc.updatedAt),
    week: doc.week || 'This Week',
    quantity,
    unit,
    price,
  };
}

// ─── Grocery CRUD ─────────────────────────────────────────────────────────────
export const getGroceries = async (explicitUid) => {
  const currentUid = explicitUid || getActiveUserId();
  const householdCode = getActiveHouseholdCode();
  const targetUid = householdCode || currentUid;
  const fallback = mockGroceries.filter(g =>
    householdCode ? (g.userId === householdCode || g.userId === currentUid) : g.userId === currentUid
  );
  if (USE_MOCK) return { data: fallback.map(toClientGrocery) };
  try {
    const res = await client.get(`/groceries?userId=${encodeURIComponent(targetUid)}`);
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return { data: res.data.data.map(toClientGrocery) };
    }
    return { data: fallback.map(toClientGrocery) };
  } catch {
    return { data: fallback.map(toClientGrocery) };
  }
};

export const addGrocery = async item => {
  const currentUid = getActiveUserId();
  const payload = toServerGrocery({ ...item, userId: currentUid });
  if (USE_MOCK) {
    const n = toClientGrocery({ ...payload, id:`g${Date.now()}`, userId: currentUid, status:'active' });
    mockGroceries.push(n);
    return { data: n };
  }
  try {
    return unwrapItem(await client.post('/groceries', payload), toClientGrocery);
  } catch {
    const n = toClientGrocery({ ...payload, id:`g${Date.now()}`, userId: currentUid, status:'active' });
    mockGroceries.push(n);
    return { data: n };
  }
};

export const updateGrocery = async (id, patch) => {
  if (USE_MOCK) {
    const i = mockGroceries.findIndex(g => g.id === id);
    if (i !== -1) mockGroceries[i] = { ...mockGroceries[i], ...patch };
    return { data: mockGroceries[i] };
  }
  try {
    return unwrapItem(await client.patch(`/groceries/${id}`, toServerGrocery(patch)), toClientGrocery);
  } catch {
    const i = mockGroceries.findIndex(g => g.id === id);
    if (i !== -1) mockGroceries[i] = { ...mockGroceries[i], ...patch };
    return { data: mockGroceries[i] };
  }
};

export const updateStockWithHistory = async (id, pantryState) => {
  return await updateGrocery(id, { pantryState });
};

export const getForecast = async () => {
  try {
    const res = await client.get('/groceries/forecast');
    return res.data;
  } catch {
    return { data: [] };
  }
};

export const resolveGrocery = async (id, status) => {
  const currentUid = getActiveUserId();
  const normalizedStatus = String(status).toLowerCase();
  if (USE_MOCK) {
    const i = mockGroceries.findIndex(g => g.id === id);
    if (i !== -1) {
      mockGroceries[i].status = normalizedStatus;
      mockGroceries[i].resolvedDate = todayKey();
      mockWasteLog.push({
        id: `w_${Date.now()}`,
        userId: currentUid,
        itemName: mockGroceries[i].name,
        category: mockGroceries[i].category,
        date: todayKey(),
        status: normalizedStatus,
      });
      return { data: mockGroceries[i] };
    }
  }
  try {
    return unwrapItem(await client.patch(`/groceries/${id}/resolve`, { status: normalizedStatus.toUpperCase() }), toClientGrocery);
  } catch {
    const i = mockGroceries.findIndex(g => g.id === id);
    if (i !== -1) {
      mockGroceries[i].status = normalizedStatus;
      return { data: mockGroceries[i] };
    }
    return { data: {} };
  }
};

export const deleteGrocery = async id => {
  if (USE_MOCK) {
    mockGroceries = mockGroceries.filter(g => g.id !== id);
    return { data:{} };
  }
  try {
    return await client.delete(`/groceries/${id}`);
  } catch {
    mockGroceries = mockGroceries.filter(g => g.id !== id);
    return { data:{} };
  }
};

export const getWasteLog = async (explicitUid) => {
  const currentUid = explicitUid || getActiveUserId();
  const householdCode = getActiveHouseholdCode();
  const targetUid = householdCode || currentUid;
  const fallback = mockWasteLog.filter(w =>
    householdCode ? (w.userId === householdCode || w.userId === currentUid) : w.userId === currentUid
  );
  if (USE_MOCK) return { data: fallback };
  try {
    const res = await client.get(`/groceries/analytics/waste?userId=${encodeURIComponent(targetUid)}`);
    if (res.data?.success && Array.isArray(res.data?.items)) {
      return { data: res.data.items.map(toClientWaste) };
    }
    return { data: fallback };
  } catch {
    return { data: fallback };
  }
};

export const getUnitWasteAnalytics = async () => {
  const currentUid = getActiveUserId();
  try {
    const res = await client.get(`/groceries/analytics/waste?userId=${encodeURIComponent(currentUid)}`);
    if (res.data?.success) return res.data;
  } catch {}

  // Local fallback unit calculation
  const userGroceries = mockGroceries.filter(g => g.userId === currentUid);
  const userWaste = mockWasteLog.filter(w => w.userId === currentUid);

  const spoiled = userWaste.filter(w => w.status === 'wasted').length;
  const consumed = userWaste.filter(w => w.status === 'consumed').length;
  const total = spoiled + consumed;
  const score = total > 0 ? Math.round((consumed / total) * 100) : 100;

  const categorySpoilage = {};
  userWaste.forEach(w => {
    categorySpoilage[w.category] = (categorySpoilage[w.category] || 0) + 1;
  });

  return {
    success: true,
    userId: currentUid,
    totalSpoiledUnits: spoiled,
    totalConsumedUnits: consumed,
    activeItemsCount: userGroceries.length,
    preservationScore: score,
    categorySpoilage,
  };
};

// ─── Notes (Shopping List) ───────────────────────────────────────────────────
export const getNotes = async (explicitUid) => {
  const currentUid = explicitUid || getActiveUserId();
  const householdCode = getActiveHouseholdCode();
  const targetUid = householdCode || currentUid;
  const fallback = mockNotes.filter(n =>
    householdCode ? (n.userId === householdCode || n.userId === currentUid) : n.userId === currentUid
  );
  if (USE_MOCK) return { data: fallback };
  try {
    const res = await client.get(`/notes?userId=${encodeURIComponent(targetUid)}`);
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return { data: res.data.data.map(toClientNote) };
    }
    return { data: fallback };
  } catch {
    return { data: fallback };
  }
};

export const addNote = async note => {
  const currentUid = getActiveUserId();
  const householdCode = getActiveHouseholdCode();
  const payload = {
    userId: householdCode || currentUid,
    name: note.name,
    category: note.category || 'General',
    targetPanel: note.track === 'produce' || note.targetPanel === 'PRODUCE' ? 'PRODUCE' : 'PANTRY',
  };
  if (USE_MOCK) {
    const n = { ...payload, id:`n${Date.now()}`, done:false };
    mockNotes.push(n);
    return { data: n };
  }
  try {
    return unwrapItem(await client.post('/notes', payload), toClientNote);
  } catch {
    const n = { ...payload, id:`n${Date.now()}`, done:false };
    mockNotes.push(n);
    return { data: n };
  }
};

export const markNoteBought = async (id, newItem) => {
  if (USE_MOCK) {
    const i = mockNotes.findIndex(n => n.id === id);
    if (i !== -1) mockNotes[i].done = !mockNotes[i].done;
    return { data: mockNotes[i] };
  }
  try {
    if (newItem) {
      return unwrapItem(
        await client.post(`/notes/${id}/move-to-inventory`, toServerGrocery(newItem)),
        toClientGrocery
      );
    }
    return unwrapItem(await client.patch(`/notes/${id}/toggle`), toClientNote);
  } catch {
    const i = mockNotes.findIndex(n => n.id === id);
    if (i !== -1) mockNotes[i].done = !mockNotes[i].done;
    return { data: mockNotes[i] };
  }
};

export const removeNote = async id => {
  if (USE_MOCK) {
    mockNotes = mockNotes.filter(n => n.id !== id);
    return { data:{} };
  }
  try {
    return await client.delete(`/notes/${id}`);
  } catch {
    mockNotes = mockNotes.filter(n => n.id !== id);
    return { data:{} };
  }
};

// ─── AI / Utilities ──────────────────────────────────────────────────────────
export const generateRecipe = async ingredients => {
  try {
    const res = await client.post('/ai/recipe', { ingredients }, { timeout: 25000 });
    return { data: res.data };
  } catch {
    return {
      data: {
        success: true,
        recipes: [
          {
            title: `Quick Fresh Stir-Fry with ${ingredients[0] || 'Vegetables'}`,
            ingredients: [...ingredients, 'Garlic', 'Olive oil', 'Black pepper'],
            instructions: ['Sauté garlic in olive oil', `Toss in ${ingredients.join(', ')}`, 'Cook 5 minutes & serve fresh'],
            cookTime: '10 mins',
            difficulty: 'Easy',
          },
        ],
      },
    };
  }
};

export const scanReceipt = async ({ imageBase64, mimeType, receiptText }, geminiKey) => {
  const headers = {};
  if (geminiKey) headers['x-gemini-key'] = geminiKey;
  try {
    const res = await client.post('/ai/scan-receipt', { imageBase64, mimeType, receiptText }, { headers, timeout: 35000 });
    return res.data;
  } catch (err) {
    console.warn('Scan receipt error:', err);
    throw err;
  }
};

export const pingBackend = async () => {
  const start = performance.now();
  try {
    const res = await client.get('/health', { timeout: 4000 });
    const latency = Math.round(performance.now() - start);
    return {
      online: true,
      latency,
      status: res.data?.status || 'OK',
      message: res.data?.message || 'GROVIO Backend running smoothly',
      dbConnected: true,
    };
  } catch (err) {
    const latency = Math.round(performance.now() - start);
    return {
      online: false,
      latency,
      status: 'OFFLINE',
      message: err.message || 'Cannot reach localhost:5000',
      dbConnected: false,
    };
  }
};

export const seedEvaluationDataset = async () => {
  const currentUid = getActiveUserId();
  const today = todayKey();

  const evaluationGroceries = [
    {
      userId: currentUid,
      name: 'Baby Spinach',
      track: 'produce',
      category: 'Vegetables',
      quantity: { value: 1, unit: 'bag' },
      storageLocation: 'refrigerator',
      shelfLifeDays: 3,
      purchaseDate: today,
      expiryDate: today, // Urgent: 0d left
      status: 'active',
    },
    {
      userId: currentUid,
      name: 'Ripe Strawberries',
      track: 'produce',
      category: 'Fruit',
      quantity: { value: 2, unit: 'packs' },
      storageLocation: 'refrigerator',
      shelfLifeDays: 2,
      purchaseDate: today,
      expiryDate: today, // Urgent: 0d left
      status: 'active',
    },
    {
      userId: currentUid,
      name: 'Honeycrisp Apples',
      track: 'produce',
      category: 'Fruit',
      quantity: { value: 6, unit: 'items' },
      storageLocation: 'counter',
      shelfLifeDays: 14,
      purchaseDate: today,
      expiryDate: addDays(today, 12),
      status: 'active',
    },
    {
      userId: currentUid,
      name: 'Fresh Carrots',
      track: 'produce',
      category: 'Vegetables',
      quantity: { value: 1, unit: 'kg' },
      storageLocation: 'refrigerator',
      shelfLifeDays: 12,
      purchaseDate: today,
      expiryDate: addDays(today, 10),
      status: 'active',
    },
    {
      userId: currentUid,
      name: 'Royal Basmati Rice',
      track: 'pantry',
      category: 'Pantry',
      quantity: { value: 5, unit: 'kg' },
      storageLocation: 'pantry',
      pantryState: 'LOW',
      stockLevel: 'LOW',
      purchaseDate: today,
      shelfLifeDays: 180,
      expiryDate: addDays(today, 180),
      status: 'active',
    },
    {
      userId: currentUid,
      name: 'Cold Pressed Olive Oil',
      track: 'pantry',
      category: 'Pantry',
      quantity: { value: 1, unit: 'bottle' },
      storageLocation: 'pantry',
      pantryState: 'FULL',
      stockLevel: 'FULL',
      purchaseDate: today,
      shelfLifeDays: 365,
      expiryDate: addDays(today, 365),
      status: 'active',
    },
  ];

  const evaluationNotes = [
    { userId: currentUid, name: 'Greek Yogurt (High Protein)', category: 'Dairy', done: false, targetPanel: 'PRODUCE' },
    { userId: currentUid, name: 'Almond Milk (Unsweetened)', category: 'Dairy', done: false, targetPanel: 'PRODUCE' },
  ];

  const addedGroceries = [];
  for (const item of evaluationGroceries) {
    const res = await addGrocery(item);
    if (res.data) addedGroceries.push(res.data);
  }

  const addedNotes = [];
  for (const note of evaluationNotes) {
    const res = await addNote(note);
    if (res.data) addedNotes.push(res.data);
  }

  return { addedGroceries, addedNotes };
};

export const purgeAllDatabase = async () => {
  const currentUid = getActiveUserId();
  let serverCleared = false;
  try {
    await client.delete(`/groceries/purge?userId=${encodeURIComponent(currentUid)}`);
    await client.delete(`/notes/purge?userId=${encodeURIComponent(currentUid)}`);
    serverCleared = true;
  } catch (err) {
    console.warn('Backend purge call failed, falling back to local wipe:', err);
  }

  mockGroceries = mockGroceries.filter(g => g.userId !== currentUid);
  mockNotes = mockNotes.filter(n => n.userId !== currentUid);
  mockWasteLog = mockWasteLog.filter(w => w.userId !== currentUid);

  return { success: true, serverCleared };
};

// ─── Feature 3: Household Kitchen Sync API ────────────────────────────────────
export const getActiveHouseholdCode = () => {
  try {
    const user = getActiveUser();
    if (user?.householdCode && typeof user.householdCode === 'string') {
      return user.householdCode.trim().toUpperCase();
    }
    const saved = localStorage.getItem('grove_household_code');
    if (saved && typeof saved === 'string') {
      return saved.trim().toUpperCase();
    }
    return '';
  } catch {
    return '';
  }
};

export const setActiveHouseholdCode = (code) => {
  try {
    const cleanCode = code ? code.trim().toUpperCase() : null;
    const user = getActiveUser();
    if (user) {
      const updatedUser = {
        ...user,
        householdCode: cleanCode,
      };
      localStorage.setItem('grovio_auth_user', JSON.stringify(updatedUser));
    }
    if (cleanCode) {
      localStorage.setItem('grove_household_code', cleanCode);
    } else {
      localStorage.removeItem('grove_household_code');
    }
  } catch {}
};

export const fetchHousehold = async () => {
  try {
    const res = await client.get('/household');
    return res.data;
  } catch (err) {
    return { success: false, household: null };
  }
};

export const createHouseholdKitchen = async (name) => {
  const currentUid = getActiveUserId();
  try {
    const res = await client.post('/household/create', { name });
    if (res.data?.household?.code) {
      setActiveHouseholdCode(res.data.household.code);
    }
    return res.data;
  } catch (err) {
    if (USE_MOCK || !err.response) {
      const code = `GROVE-${Math.floor(1000 + Math.random() * 9000)}`;
      setActiveHouseholdCode(code);
      mockGroceries.forEach((g) => {
        if (g.userId === currentUid) g.userId = code;
      });
      mockNotes.forEach((n) => {
        if (n.userId === currentUid) n.userId = code;
      });
      return {
        success: true,
        household: {
          code,
          name: name || 'Shared Kitchen',
          ownerId: currentUid,
          members: [{ userId: currentUid, name: 'You', role: 'Organizer', joinedAt: new Date() }],
        },
      };
    }
    throw err;
  }
};

export const joinHouseholdKitchen = async (code) => {
  const cleanCode = (code || '').trim().toUpperCase();
  const currentUid = getActiveUserId();
  try {
    const res = await client.post('/household/join', { code: cleanCode });
    if (res.data?.household?.code) {
      setActiveHouseholdCode(res.data.household.code);
    }
    return res.data;
  } catch (err) {
    if (USE_MOCK || !err.response) {
      setActiveHouseholdCode(cleanCode);
      mockGroceries.forEach((g) => {
        if (g.userId === currentUid) g.userId = cleanCode;
      });
      mockNotes.forEach((n) => {
        if (n.userId === currentUid) n.userId = cleanCode;
      });
      return {
        success: true,
        household: {
          code: cleanCode,
          name: 'Shared Kitchen',
          ownerId: 'demo_owner',
          members: [{ userId: currentUid, name: 'You', role: 'Member', joinedAt: new Date() }],
        },
      };
    }
    throw err;
  }
};

export const leaveHouseholdKitchen = async (code) => {
  const res = await client.post('/household/leave', { code });
  setActiveHouseholdCode(null);
  return res.data;
};
