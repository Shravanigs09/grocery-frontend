// src/store/useGroceryStore.js
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  mockGroceries, mockNotes, mockWasteLog,
  getGroceries, getNotes, getWasteLog,
  addGrocery, updateGrocery, deleteGrocery, resolveGrocery,
  addNote, markNoteBought, removeNote,
  generateRecipe, getForecast, updateStockWithHistory,
  scanReceipt,
  getActiveHouseholdCode, toClientGrocery, toClientNote,
} from '../services/api';
import { todayKey } from '../utils/dates';
import {
  getSettings,
  updateSettings,
  convertCurrency,
  formatCurrency,
  subscribeCurrencyChange,
} from './useSettings';

export function useGroceryStore(userId) {
  const currentUid = userId || 'guest_user';
  const isDemo = currentUid === 'usr_shravani' || currentUid === 'usr_alex';
  const [items,         setItems]         = useState(() => isDemo ? mockGroceries.filter(g => g.userId === currentUid) : []);
  const [notes,         setNotes]         = useState(() => isDemo ? mockNotes.filter(n => n.userId === currentUid) : []);
  const [wasteLog,      setWasteLog]      = useState(() => isDemo ? mockWasteLog.filter(w => w.userId === currentUid) : []);
  const [notifications, setNotifications] = useState([]);
  const notifTimers = useRef(new Map());

  const refreshAll = useCallback(async () => {
    if (!currentUid || currentUid === 'guest_user') return;
    const [g, n, w] = await Promise.all([getGroceries(currentUid), getNotes(currentUid), getWasteLog(currentUid)]);
    if (Array.isArray(g?.data)) setItems(g.data);
    if (Array.isArray(n?.data)) setNotes(n.data);
    if (Array.isArray(w?.data)) setWasteLog(w.data);
  }, [currentUid]);

  useEffect(() => {
    let cancelled = false;
    // Set immediate isolated filtered baseline when user changes
    const isDemoUser = currentUid === 'usr_shravani' || currentUid === 'usr_alex';
    const baselineItems = isDemoUser ? mockGroceries.filter(g => g.userId === currentUid) : [];
    const baselineNotes = isDemoUser ? mockNotes.filter(n => n.userId === currentUid) : [];
    const baselineWaste = isDemoUser ? mockWasteLog.filter(w => w.userId === currentUid) : [];
    setItems(baselineItems);
    setNotes(baselineNotes);
    setWasteLog(baselineWaste);

    (async () => {
      if (!currentUid || currentUid === 'guest_user') return;
      const [g, n, w] = await Promise.all([getGroceries(currentUid), getNotes(currentUid), getWasteLog(currentUid)]);
      if (cancelled) return;
      if (Array.isArray(g?.data)) setItems(g.data);
      if (Array.isArray(n?.data)) setNotes(n.data);
      if (Array.isArray(w?.data)) setWasteLog(w.data);
    })();
    return () => {
      cancelled = true;
      notifTimers.current.forEach(clearTimeout);
      notifTimers.current.clear();
    };
  }, [currentUid]);

  // ── Currency dynamic conversion listener ─────────────────────────────────────
  // When currency changes, recalculate all existing items & wasteLog prices
  useEffect(() => {
    const unsub = subscribeCurrencyChange((fromCurrency, toCurrency) => {
      if (fromCurrency === toCurrency) return;
      setItems((prevItems) =>
        prevItems.map((item) => {
          if (item.price === undefined || item.price === null) return item;
          const converted = convertCurrency(item.price, fromCurrency, toCurrency);
          return {
            ...item,
            price: converted,
          };
        })
      );

      setNotes((prevNotes) =>
        prevNotes.map((note) => {
          const rawPrice = note.price !== undefined ? note.price : note.estimatedPrice;
          if (rawPrice === undefined || rawPrice === null) return note;
          const converted = convertCurrency(rawPrice, fromCurrency, toCurrency);
          return {
            ...note,
            price: converted,
            estimatedPrice: converted,
          };
        })
      );

      setWasteLog((prevLog) =>
        prevLog.map((w) => {
          if (w.price === undefined || w.price === null) return w;
          const converted = convertCurrency(w.price, fromCurrency, toCurrency);
          return {
            ...w,
            price: converted,
          };
        })
      );
    });

    return unsub;
  }, []);

  const changeCurrency = useCallback((newCurrencyCode) => {
    const s = getSettings();
    const currentCode = s.regional?.currency || 'INR';
    if (currentCode === newCurrencyCode) return;
    updateSettings({ regional: { ...s.regional, currency: newCurrencyCode } });
  }, []);

  // ── Notifications ──────────────────────────────────────────────────────────
  const pushNotif = useCallback((msg, type = 'warn') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setNotifications(p => [...p, { id, msg, type }]);
    const timer = setTimeout(() => {
      setNotifications(p => p.filter(n => n.id !== id));
      notifTimers.current.delete(id);
    }, 6000);
    notifTimers.current.set(id, timer);
  }, []);

  const dismissNotif = useCallback(id => {
    const timer = notifTimers.current.get(id);
    if (timer) clearTimeout(timer);
    notifTimers.current.delete(id);
    setNotifications(p => p.filter(n => n.id !== id));
  }, []);

  // ── Real-Time Household SSE Listener ──────────────────────────────────────
  useEffect(() => {
    if (!currentUid || currentUid === 'guest_user') return;
    const householdCode = getActiveHouseholdCode();
    const url = `http://localhost:5000/api/household/events?userId=${encodeURIComponent(currentUid)}&householdCode=${encodeURIComponent(householdCode || '')}`;

    let es = null;
    try {
      es = new EventSource(url);

      es.addEventListener('grocery_change', (e) => {
        try {
          const data = JSON.parse(e.data);
          const clientItem = data.item ? toClientGrocery(data.item) : null;

          if (data.action === 'created' && clientItem) {
            setItems((prev) => {
              if (prev.some((p) => p.id === clientItem.id)) return prev;
              return [clientItem, ...prev];
            });
            pushNotif(`Family member added "${clientItem.name}" to kitchen! 🧺`, 'info');
          } else if (data.action === 'updated' && clientItem) {
            setItems((prev) => prev.map((p) => (p.id === clientItem.id ? clientItem : p)));
          } else if (data.action === 'stock' && clientItem) {
            setItems((prev) => prev.map((p) => (p.id === clientItem.id ? clientItem : p)));
            pushNotif(`Stock level for "${clientItem.name}" changed to ${clientItem.pantryState}`, 'info');
          } else if (data.action === 'deleted') {
            setItems((prev) => prev.filter((p) => p.id !== data.id));
          } else if (data.action === 'resolved' && clientItem) {
            setItems((prev) => prev.filter((p) => p.id !== clientItem.id));
            pushNotif(`Item "${clientItem.name}" marked as ${data.item.status}`, 'info');
          } else if (data.action === 'purged') {
            setItems([]);
          }
        } catch (err) {
          console.warn('Error handling SSE grocery_change:', err);
        }
      });

      es.addEventListener('note_change', (e) => {
        try {
          const data = JSON.parse(e.data);
          const clientNote = data.note ? toClientNote(data.note) : null;

          if (data.action === 'created' && clientNote) {
            setNotes((prev) => {
              if (prev.some((p) => p.id === clientNote.id)) return prev;
              return [clientNote, ...prev];
            });
            pushNotif(`New shopping note: "${clientNote.name}" 📝`, 'info');
          } else if (data.action === 'toggled' && clientNote) {
            setNotes((prev) => prev.map((p) => (p.id === clientNote.id ? clientNote : p)));
          } else if (data.action === 'deleted') {
            setNotes((prev) => prev.filter((p) => p.id !== data.noteId));
          } else if (data.action === 'moved_to_inventory') {
            setNotes((prev) => prev.filter((p) => p.id !== data.noteId));
          } else if (data.action === 'purged') {
            setNotes([]);
          }
        } catch (err) {
          console.warn('Error handling SSE note_change:', err);
        }
      });

      es.addEventListener('household_change', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.action === 'member_joined') {
            pushNotif(`${data.userName || 'A family member'} joined your Shared Kitchen! 🏡`, 'success');
            refreshAll();
          }
        } catch {}
      });

      es.onerror = () => {
        // SSE will reconnect automatically
      };
    } catch (err) {
      console.warn('SSE subscription failed:', err);
    }

    return () => {
      if (es) {
        es.close();
      }
    };
  }, [currentUid, refreshAll, pushNotif]);

  // ── Grocery CRUD ───────────────────────────────────────────────────────────
  const addItem = useCallback(async item => {
    const res = await addGrocery(item);
    if (res.data) {
      setItems(p => [...p, res.data]);
      pushNotif(`Added ${res.data.name} to kitchen stock!`, 'success');
    }
    return res.data;
  }, [pushNotif]);

  const addItems = useCallback(async newItems => {
    const results = [];
    for (const it of newItems) {
      const res = await addGrocery(it);
      if (res.data) results.push(res.data);
    }
    if (results.length) {
      setItems(p => [...p, ...results]);
      pushNotif(`Added ${results.length} item${results.length > 1 ? 's' : ''} to inventory!`, 'success');
    }
    return results;
  }, [pushNotif]);

  const updateItem = useCallback(async (id, updates) => {
    const res = await updateGrocery(id, updates);
    setItems(p => p.map(i => i.id === id ? { ...i, ...(res.data || updates) } : i));
  }, []);

  const deleteItem = useCallback(async id => {
    await deleteGrocery(id);
    setItems(p => p.filter(i => i.id !== id));
  }, []);

  const markConsumed = useCallback(async id => {
    const item = items.find(i => i.id === id);
    await resolveGrocery(id, 'CONSUMED');
    setItems(p => p.filter(i => i.id !== id));
    if (item) {
      setWasteLog(p => [...p, {
        id: `c${Date.now()}`,
        userId: currentUid,
        itemName: item.name,
        category: item.category || 'Produce',
        quantity: item.quantity || 1,
        unit: item.unit || 'kg',
        price: item.price || 0,
        status: 'consumed',
        date: todayKey(),
        week: 'This Week',
      }]);
    }
    pushNotif(`${item?.name || 'Item'} marked as consumed ✓`, 'success');
  }, [items, pushNotif, currentUid]);

  const markWasted = useCallback(async id => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    await resolveGrocery(id, 'WASTED');
    setItems(p => p.filter(i => i.id !== id));

    const s = getSettings();
    const curr = s.regional?.currency || 'INR';
    const priceStr = item.price > 0 ? ` (${formatCurrency(item.price, curr)})` : '';

    setWasteLog(p => [...p, {
      id: `w${Date.now()}`,
      userId: currentUid,
      itemName: item.name,
      category: item.category || 'Produce',
      quantity: item.quantity || 1,
      unit: item.unit || 'kg',
      price: item.price || 0,
      status: 'wasted',
      date: todayKey(),
      week: 'This Week',
    }]);
    pushNotif(`${item.name}${priceStr} marked as spoiled / wasted`, 'danger');
  }, [items, pushNotif, currentUid]);

  // ── Pantry toggle with history ─────────────────────────────────────────────
  const togglePantryState = useCallback(async (id, nextState) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const order = ['FULL', 'HALF', 'LOW'];
    const next  = order.includes(nextState)
      ? nextState
      : order[(Math.max(0, order.indexOf(item.pantryState)) + 1) % 3];
    if (next === item.pantryState) return;

    const res = await updateStockWithHistory(id, next);
    setItems(p => p.map(i => {
      if (i.id !== id) return i;
      return {
        ...i,
        ...(res.data || {}),
        pantryState: next,
      };
    }));

    if (next === 'LOW') {
      const s = getSettings();
      if (s?.automation?.autoRestockPantryLow) {
        addNote({
          name: item.name,
          category: item.category || 'Pantry',
          quantity: item.quantity || 1,
          unit: item.unit || 'kg',
        }).then(noteRes => {
          if (noteRes?.data) setNotes(p => [...p, noteRes.data]);
        });
        pushNotif(`${item.name} is running LOW — auto-bridged to Shopping Notes!`, 'warn');
      } else {
        pushNotif(`${item.name} is running LOW — restock soon!`, 'warn');
      }
    }
  }, [items, pushNotif]);

  // ── Restock ────────────────────────────────────────────────────────────────
  const addToRestock = useCallback(async item => {
    const res = await addNote({
      name: item.name,
      category: item.category,
      quantity: item.quantity || 1,
      unit: item.unit || 'kg',
    });
    if (res.data) setNotes(p => [...p, res.data]);
    pushNotif(`${item.name} added to shopping list!`, 'success');
  }, [pushNotif]);

  const addNoteManual = useCallback(async note => {
    const res = await addNote(note);
    if (res.data) setNotes(p => [...p, res.data]);
    pushNotif(`Added ${note.name} to shopping list!`, 'success');
  }, [pushNotif]);

  const toggleNoteCheck = useCallback(async id => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isBought: !n.isBought, done: !n.done } : n));
    try {
      await markNoteBought(id);
    } catch {}
  }, []);

  const moveNoteToInventory = useCallback(async (noteItem) => {
    const isProduce = noteItem.category === 'Produce' || noteItem.category === 'Fruits' || noteItem.category === 'Vegetables';
    const groceryPayload = {
      name: noteItem.name,
      track: isProduce ? 'produce' : 'pantry',
      panelType: isProduce ? 'PRODUCE' : 'PANTRY',
      category: noteItem.category || (isProduce ? 'Produce' : 'Pantry'),
      quantity: noteItem.quantity || 1,
      unit: noteItem.unit || (isProduce ? 'kg' : 'pcs'),
      pantryState: 'FULL',
      stockLevel: 'FULL',
      shelfLifeDays: isProduce ? 5 : 120,
    };

    try {
      const res = await addGrocery(groceryPayload);
      if (res?.data) {
        setItems(prev => [...prev, res.data]);
      }
      if (noteItem.id && !String(noteItem.id).startsWith('note-') && !String(noteItem.id).startsWith('demo-')) {
        await removeNote(noteItem.id);
      }
      setNotes(prev => prev.filter(n => n.id !== noteItem.id));
      pushNotif(`Moved ${noteItem.name} to kitchen inventory! ✓`, 'success');
      return res?.data;
    } catch (err) {
      console.error('Error moving note to inventory:', err);
      pushNotif(`Could not move ${noteItem.name} to inventory`, 'danger');
    }
  }, [pushNotif]);

  const moveAllCheckedToInventory = useCallback(async (checkedNotes) => {
    if (!checkedNotes || !checkedNotes.length) return;
    const addedGroceries = [];
    for (const note of checkedNotes) {
      const isProduce = note.category === 'Produce' || note.category === 'Fruits' || note.category === 'Vegetables';
      const groceryPayload = {
        name: note.name,
        track: isProduce ? 'produce' : 'pantry',
        panelType: isProduce ? 'PRODUCE' : 'PANTRY',
        category: note.category || (isProduce ? 'Produce' : 'Pantry'),
        quantity: note.quantity || 1,
        unit: note.unit || (isProduce ? 'kg' : 'pcs'),
        pantryState: 'FULL',
        stockLevel: 'FULL',
        shelfLifeDays: isProduce ? 5 : 120,
      };
      try {
        const res = await addGrocery(groceryPayload);
        if (res?.data) addedGroceries.push(res.data);
        if (note.id && !String(note.id).startsWith('note-') && !String(note.id).startsWith('demo-')) {
          await removeNote(note.id);
        }
      } catch (err) {
        console.warn('Error in batch move note:', err);
      }
    }
    if (addedGroceries.length > 0) {
      setItems(prev => [...prev, ...addedGroceries]);
      const checkedIds = new Set(checkedNotes.map(n => n.id));
      setNotes(prev => prev.filter(n => !checkedIds.has(n.id)));
      pushNotif(`Moved ${addedGroceries.length} items to kitchen inventory! 🎉`, 'success');
    }
  }, [pushNotif]);

  const buyNote = useCallback(async (noteId, newItem) => {
    const moved = await markNoteBought(noteId, newItem);
    setNotes(p => p.filter(n => n.id !== noteId));
    const migrated = moved.data;
    const looksLikeGrocery = migrated && (
      migrated.panelType || migrated.track || migrated.stockLevel ||
      migrated.pantryState || migrated.expiryDate || migrated.shelfLifeDays
    );
    const grocery = looksLikeGrocery ? migrated : (await addGrocery(newItem)).data;
    if (grocery) setItems(p => [...p, grocery]);
    pushNotif(`${newItem.name} added to inventory!`, 'success');
  }, [pushNotif]);

  const deleteNote = useCallback(async id => {
    await removeNote(id);
    setNotes(p => p.filter(n => n.id !== id));
  }, []);

  // ── AI Actions ─────────────────────────────────────────────────────────────
  const callGenerateRecipe = useCallback(async ingredients => {
    return await generateRecipe(ingredients);
  }, []);

  const callGetForecast = useCallback(async () => {
    return await getForecast();
  }, []);

  const callScanReceipt = useCallback(async (payload, geminiKey) => {
    return await scanReceipt(payload, geminiKey);
  }, []);

  return {
    items, notes, wasteLog, notifications,
    setItems, setNotes, setWasteLog, refreshAll,
    changeCurrency,
    addItem, addItems, updateItem, deleteItem,
    markConsumed, markWasted, togglePantryState,
    addToRestock, addNoteManual, buyNote, deleteNote,
    toggleNoteCheck, moveNoteToInventory, moveAllCheckedToInventory,
    pushNotif, dismissNotif,
    // AI
    generateRecipeFn: callGenerateRecipe,
    getForecastFn:    callGetForecast,
    scanReceiptFn:    callScanReceipt,
  };
}
