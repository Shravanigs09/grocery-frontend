// src/components/Restock/RestockPage.jsx
// Exact visual match to Image 4 (Grovio Shopping List Mockup) with Full Inventory Sync
import React, { useState, useMemo } from 'react';
import {
  Search,
  Mic,
  Camera,
  Check,
  Plus,
  ArrowRight,
  Trash2,
  Package,
} from 'lucide-react';
import VoiceInputButton from '../AddItem/VoiceInputButton';
import ReceiptScanModal from '../AddItem/ReceiptScanModal';
import BatchVoiceAddModal from '../AddItem/BatchVoiceAddModal';
import NotificationBellDropdown from '../Notifications/NotificationBellDropdown';
import { detectFoodDetails } from '../../utils/foodDetection';
import { playConfirmationChime } from '../../utils/sound';

const QUICK_CATEGORIES = [
  { label: 'All', value: 'All' },
  { label: 'Produce 🥬', value: 'Produce' },
  { label: 'Dairy 🥛', value: 'Dairy' },
  { label: 'Bakery 🍞', value: 'Bakery' },
  { label: 'Pantry 🌾', value: 'Pantry' },
];

const FOOD_EMOJIS = {
  Spinach: '🥬',
  Bananas: '🍌',
  Banana: '🍌',
  Milk: '🥛',
  'Whole Milk': '🥛',
  Bread: '🍞',
  Oats: '🥣',
  Tomatoes: '🍅',
  Eggs: '🥚',
  Rice: '🍚',
  Apples: '🍎',
  Chicken: '🍗',
};

function getEmoji(name = '') {
  for (const [key, emoji] of Object.entries(FOOD_EMOJIS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return emoji;
  }
  return '🛒';
}

// Fallback baseline items from Image 4 if user notes are empty
const INITIAL_DEMO_CHECKLIST = [
  { id: 'note-1', name: 'Spinach', category: 'Produce', quantity: 1, unit: 'kg', isBought: true },
  { id: 'note-2', name: 'Oats', category: 'Pantry', quantity: 1, unit: 'pack', isBought: false },
  { id: 'note-3', name: 'Bananas', category: 'Produce', quantity: 1, unit: 'bunch', isBought: true },
  { id: 'note-4', name: 'Milk', category: 'Dairy', quantity: 1, unit: 'L', isBought: false },
  { id: 'note-5', name: 'Checklilks', category: 'Pantry', quantity: 1, unit: 'pcs', isBought: false },
  { id: 'note-6', name: 'Tomatoes', category: 'Produce', quantity: 1.5, unit: 'kg', isBought: false },
];

export default function RestockPage({
  notes = [],
  items = [],
  onBuy,
  onToggleCheck,
  onMoveToInventory,
  onMoveAllChecked,
  onAddNote,
  onDeleteNote,
  onAddGrocery,
  onNavigateTab,
  onOpenRescueRecipes,
  onOpenMorningDigest,
}) {
  const [quickAddInput, setQuickAddInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [qtyValue, setQtyValue] = useState(1);
  const [qtyUnit, setQtyUnit] = useState('pcs');
  const [showReceiptScan, setShowReceiptScan] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [localChecked, setLocalChecked] = useState({});
  const [dismissedDemos, setDismissedDemos] = useState(new Set());
  const [recentlyMovedItem, setRecentlyMovedItem] = useState(null);

  // Auto-populated Restock Suggestions (Pantry items marked as LOW)
  const lowPantrySuggestions = useMemo(() => {
    const fromItems = items.filter(
      (i) => (i.track === 'pantry' || i.panelType === 'PANTRY') && (i.pantryState === 'LOW' || i.stockLevel === 'LOW') && (i.status === 'active' || i.status === 'ACTIVE')
    );
    if (fromItems.length > 0) {
      return fromItems.map((i) => ({ name: i.name, id: i.id || i._id }));
    }
    return [];
  }, [items]);

  // Combined notes list
  const displayNotes = useMemo(() => {
    if (notes.length > 0) {
      return notes.map((n) => ({
        id: n.id || n._id,
        _id: n._id || n.id,
        name: n.name,
        category: n.category || 'Pantry',
        quantity: n.quantity || 1,
        unit: n.unit || 'pcs',
        isBought: localChecked[n.id || n._id] !== undefined ? localChecked[n.id || n._id] : (n.isBought || n.done || false),
      }));
    }
    return [];
  }, [notes, localChecked, dismissedDemos]);

  // Filtered by Category Tab if not 'All'
  const filteredNotes = useMemo(() => {
    if (selectedCategory === 'All') return displayNotes;
    return displayNotes.filter((n) => {
      if (selectedCategory === 'Produce') return n.category === 'Produce' || n.category === 'Fruits' || n.category === 'Vegetables';
      return n.category === selectedCategory;
    });
  }, [displayNotes, selectedCategory]);

  const checkedItems = useMemo(() => {
    return displayNotes.filter((n) => n.isBought);
  }, [displayNotes]);

  // Handle Quick Add Submit
  const handleQuickAddSubmit = (e) => {
    e?.preventDefault();
    const clean = quickAddInput.trim();
    if (!clean) return;

    const detected = detectFoodDetails(clean);
    const categoryToUse = selectedCategory !== 'All' ? selectedCategory : (detected.category === 'Vegetables' || detected.category === 'Fruit' ? 'Produce' : detected.category || 'Pantry');

    if (onAddNote) {
      onAddNote({
        name: detected.cleanName || clean,
        category: categoryToUse,
        targetPanel: categoryToUse === 'Produce' ? 'PRODUCE' : 'PANTRY',
        quantity: qtyValue || detected.quantity || 1,
        unit: qtyUnit || detected.defaultUnit || 'pcs',
      });
    }

    setQuickAddInput('');
  };

  // Toggle Checkbox
  const toggleCheckbox = (noteId) => {
    setLocalChecked((prev) => ({
      ...prev,
      [noteId]: !prev[noteId],
    }));

    if (onToggleCheck) {
      onToggleCheck(noteId);
    }
  };

  // Move Single Note to Kitchen Inventory
  const handleMoveToInventory = (noteItem) => {
    playConfirmationChime();

    if (onMoveToInventory) {
      onMoveToInventory(noteItem);
    } else if (onAddGrocery) {
      const isProduce = noteItem.category === 'Produce' || noteItem.category === 'Fruits' || noteItem.category === 'Vegetables';
      onAddGrocery({
        name: noteItem.name,
        track: isProduce ? 'produce' : 'pantry',
        panelType: isProduce ? 'PRODUCE' : 'PANTRY',
        category: noteItem.category || 'Pantry',
        stockLevel: 'FULL',
        pantryState: 'FULL',
        shelfLifeDays: isProduce ? 5 : 120,
      });
      if (onDeleteNote && noteItem.id) {
        onDeleteNote(noteItem.id);
      }
    }

    // If demo item, track dismissal locally
    if (String(noteItem.id).startsWith('note-')) {
      setDismissedDemos((prev) => new Set([...prev, noteItem.id]));
    }

    setRecentlyMovedItem(noteItem.name);
    setTimeout(() => {
      setRecentlyMovedItem(null);
    }, 4500);
  };

  // Batch: Move All Checked Items to Kitchen
  const handleMoveAllChecked = () => {
    if (!checkedItems.length) return;
    playConfirmationChime();

    if (onMoveAllChecked) {
      onMoveAllChecked(checkedItems);
    } else {
      checkedItems.forEach((item) => handleMoveToInventory(item));
    }

    // Dismiss any demo items that were checked
    const demoIds = checkedItems.filter((i) => String(i.id).startsWith('note-')).map((i) => i.id);
    if (demoIds.length > 0) {
      setDismissedDemos((prev) => new Set([...prev, ...demoIds]));
    }

    setRecentlyMovedItem(`${checkedItems.length} checked items`);
    setTimeout(() => {
      setRecentlyMovedItem(null);
    }, 4500);
  };

  // Delete a note
  const handleDelete = (noteId) => {
    if (String(noteId).startsWith('note-')) {
      setDismissedDemos((prev) => new Set([...prev, noteId]));
    } else if (onDeleteNote) {
      onDeleteNote(noteId);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* ── Top Bar: Search / Quick Add + Bell + Avatar (Image 4) ────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* Large Rounded Search & Add Input */}
        <form
          onSubmit={handleQuickAddSubmit}
          style={{
            flex: 1,
            maxWidth: 640,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Search
            size={16}
            color="#94a3b8"
            style={{ position: 'absolute', left: 16 }}
          />
          <input
            type="text"
            placeholder="Add item to buy (e.g. Tomatoes, Milk, Sourdough Bread)..."
            value={quickAddInput}
            onChange={(e) => setQuickAddInput(e.target.value)}
            style={{
              width: '100%',
              height: 48,
              padding: '0 150px 0 44px',
              borderRadius: 24,
              border: '1px solid var(--border, #e2e8f0)',
              background: 'var(--surface, #ffffff)',
              fontSize: 13.5,
              color: 'var(--text, #1e293b)',
              outline: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          />

          {/* Quick Voice, Camera & Add Button inside Input */}
          <div
            style={{
              position: 'absolute',
              right: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <button
              type="button"
              onClick={() => setShowBatchModal(true)}
              title="Speak or Paste multiple groceries"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: 'none',
                background: '#f1f5f9',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Mic size={15} />
            </button>

            <button
              type="button"
              onClick={() => setShowReceiptScan(true)}
              title="Scan Receipt / Photo"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: 'none',
                background: '#f1f5f9',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Camera size={15} />
            </button>

            <button
              type="submit"
              disabled={!quickAddInput.trim()}
              style={{
                height: 34,
                padding: '0 14px',
                borderRadius: 20,
                border: 'none',
                background: quickAddInput.trim() ? '#166534' : '#cbd5e1',
                color: '#ffffff',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: quickAddInput.trim() ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'background 0.15s ease',
              }}
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          </div>
        </form>

        {/* Far Right: Notification Bell & Profile Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <NotificationBellDropdown
            items={items}
            onOpenRescueRecipes={onOpenRescueRecipes}
            onAddNote={onAddNote}
            onOpenMorningDigest={onOpenMorningDigest}
          />

          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            A
          </div>
        </div>
      </div>

      {/* ── Category Quick Filter Chips ──────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {QUICK_CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelectedCategory(cat.value)}
              style={{
                padding: '5px 12px',
                borderRadius: 99,
                border: isActive ? '1.5px solid #16a34a' : '1px solid #e2e8f0',
                background: isActive ? '#dcfce7' : '#ffffff',
                color: isActive ? '#15803d' : '#64748b',
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── Confirmation Toast Banner when an item is added to Inventory ── */}
      {recentlyMovedItem && (
        <div
          style={{
            marginBottom: 20,
            padding: '12px 18px',
            borderRadius: 14,
            background: '#dcfce7',
            border: '1px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Check size={18} color="#166534" />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#166534', margin: 0 }}>
                {recentlyMovedItem} added to Kitchen Inventory!
              </p>
              <p style={{ fontSize: 12, color: '#15803d', margin: '2px 0 0' }}>
                Stock level and shelf life dates have been activated.
              </p>
            </div>
          </div>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('inventory')}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: 'none',
                background: '#166534',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>View in Inventory</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      )}

      {/* ── Card 1: Restock Suggestions (Image 4) ───────────────────────── */}
      <div
        style={{
          background: '#f5f2eb', // Warm sand background matching Image 4
          border: '1px solid #e8e2d5',
          borderRadius: 16,
          padding: '20px 24px',
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text, #1e293b)', margin: 0 }}>
              Restock Suggestions
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted, #64748b)', margin: '4px 0 0' }}>
              Recommending pantry items currently marked as{' '}
              <span style={{ color: '#ea580c', fontWeight: 600 }}>LOW</span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              lowPantrySuggestions.forEach((s) => {
                if (onAddNote) {
                  onAddNote({
                    name: s.name,
                    quantity: 1,
                    unit: 'pcs',
                    category: 'Pantry',
                    targetPanel: 'PANTRY',
                  });
                }
              });
            }}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              border: '1px solid var(--border, #d4cdbf)',
              background: 'var(--surface, #ffffff)',
              color: 'var(--text, #1e293b)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Plus size={13} />
            <span>Add to List</span>
          </button>
        </div>

        {/* Suggestion Item Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          {lowPantrySuggestions.map((sug) => (
            <div
              key={sug.id || sug.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 13.5,
                color: 'var(--text, #1e293b)',
                fontWeight: 500,
              }}
            >
              <span>
                {sug.name}{' '}
                <span style={{ color: '#ea580c', fontSize: 12 }}>(LOW)</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  if (onAddNote) {
                    onAddNote({
                      name: sug.name,
                      quantity: 1,
                      unit: 'pcs',
                      category: 'Pantry',
                      targetPanel: 'PANTRY',
                    });
                  }
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--border, #d4cdbf)',
                  background: 'var(--surface-2, #ffffff)',
                  color: 'var(--text, #1e293b)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                + Add
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Card 2: Shopping Checklist (Image 4) ─────────────────────────── */}
      <div
        style={{
          background: 'var(--surface, #ffffff)',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          overflow: 'hidden',
        }}
      >
        {/* Checklist Header with Batch Action */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-soft, #f1f5f9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text, #1e293b)', margin: 0 }}>
              Shopping Checklist
            </h2>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 99,
                background: 'var(--surface-2, #f1f5f9)',
                color: 'var(--text-muted, #64748b)',
              }}
            >
              {filteredNotes.length} item{filteredNotes.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Batch: Add All Checked to Kitchen Button */}
          {checkedItems.length > 0 && (
            <button
              type="button"
              onClick={handleMoveAllChecked}
              style={{
                padding: '8px 16px',
                borderRadius: 99,
                border: 'none',
                background: 'var(--green, #166534)',
                color: '#ffffff',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px var(--green-glow, rgba(22, 101, 52, 0.25))',
                animation: 'scaleIn 0.2s ease',
              }}
            >
              <Check size={14} strokeWidth={3} />
              <span>Add All Checked to Kitchen ({checkedItems.length}) ✓</span>
            </button>
          )}
        </div>

        {/* List of items */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filteredNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted, #64748b)' }}>
              <Package size={36} color="var(--text-dim, #cbd5e1)" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text, #334155)', margin: 0 }}>
                Shopping list is empty
              </p>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted, #64748b)', margin: '4px 0 0' }}>
                Type an item above or tap Restock Suggestions to add groceries.
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const emoji = getEmoji(note.name);
              return (
                <div
                  key={note.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 24px',
                    borderTop: '1px solid var(--border-soft, #f1f5f9)',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2, #fafbfc)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Checkbox + Name + Emoji */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                    <button
                      type="button"
                      onClick={() => toggleCheckbox(note.id)}
                      title={note.isBought ? 'Mark unbought' : 'Mark bought'}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 4,
                        border: note.isBought ? 'none' : '1.5px solid var(--border, #cbd5e1)',
                        background: note.isBought ? 'var(--green, #5b7042)' : 'var(--surface, #ffffff)', // Sage olive check from mockup
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#ffffff',
                        padding: 0,
                        flexShrink: 0,
                      }}
                    >
                      {note.isBought && <Check size={13} strokeWidth={3} />}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span style={{ fontSize: 16 }}>{emoji}</span>
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: note.isBought ? 'var(--text-dim, #94a3b8)' : 'var(--text, #1e293b)',
                          textDecoration: note.isBought ? 'line-through' : 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {note.name}
                      </span>
                    </div>
                  </div>

                  {/* Category Badge + Move to Inventory Button + Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: 'var(--text-muted, #64748b)',
                        background: 'var(--surface-2, #f1f5f9)',
                        padding: '3px 10px',
                        borderRadius: 99,
                      }}
                    >
                      {note.category}
                    </span>

                    {/* Move to Inventory / Add to Kitchen button */}
                    <button
                      type="button"
                      onClick={() => handleMoveToInventory(note)}
                      title="Move item to kitchen inventory"
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        border: '1px solid #bbf7d0',
                        background: '#f0fdf4',
                        color: '#166534',
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#dcfce7')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#f0fdf4')}
                    >
                      <span>Move to Inventory</span>
                      <Check size={13} strokeWidth={2.5} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(note.id)}
                      title="Delete from list"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: 'none',
                        background: 'transparent',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#fee2e2';
                        e.currentTarget.style.color = '#ef4444';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#94a3b8';
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Photo Receipt Scanning Modal ── */}
      {showReceiptScan && (
        <ReceiptScanModal
          isOpen={showReceiptScan}
          onClose={() => setShowReceiptScan(false)}
          onAddItems={(scannedItems) => {
            scannedItems.forEach((it) => {
              if (onAddNote) {
                onAddNote({
                  name: it.name,
                  category: it.category || 'Produce',
                  quantity: it.quantity || 1,
                  unit: it.unit || 'pcs',
                });
              }
            });
          }}
        />
      )}

      {/* ── Batch Voice Dictation Modal ── */}
      {showBatchModal && (
        <BatchVoiceAddModal
          isOpen={showBatchModal}
          onClose={() => setShowBatchModal(false)}
          onAddItems={(voiceItems) => {
            voiceItems.forEach((it) => {
              if (onAddNote) {
                onAddNote({
                  name: it.name,
                  category: it.category || 'Pantry',
                  quantity: it.quantity || 1,
                  unit: it.unit || 'pcs',
                });
              }
            });
          }}
        />
      )}
    </div>
  );
}
