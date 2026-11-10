// src/components/Inventory/InventoryPage.jsx
// Exact visual match to Image 3 (Grove View Inventory Management Mockup)
import React, { useState, useMemo } from 'react';
import {
  Plus, Search, Check, Trash2, ChefHat,
} from 'lucide-react';
import AddItemDrawer from '../AddItem/AddItemDrawer';
import AiRecipeModal from '../AiRecipeModal';
import UserProfileChip from '../Layout/UserProfileChip';
import NotificationBellDropdown from '../Notifications/NotificationBellDropdown';
import { getExpiryStatus } from './ExpiryBadge';

const FOOD_EMOJIS = {
  Bananas: '🍌',
  Banana: '🍌',
  Milk: '🥛',
  'Whole Milk': '🥛',
  Spinach: '🥬',
  'Baby Spinach': '🥬',
  Cereal: '🥣',
  Oatmeal: '🥣',
  Tomatoes: '🍅',
  Tomato: '🍅',
  Bread: '🍞',
  'Sourdough Bread': '🍞',
  Avocados: '🥑',
  Avocado: '🥑',
  Eggs: '🥚',
  Rice: '🍚',
  'Basmati Rice': '🍚',
  'Olive Oil': '🫒',
  Flour: '🌾',
  'Wheat Flour': '🌾',
  Apples: '🍎',
  Chicken: '🍗',
};

function getEmoji(name = '') {
  for (const [key, emoji] of Object.entries(FOOD_EMOJIS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return emoji;
  }
  return '🥬';
}

// Fallback demo items if user inventory is empty
const DEMO_INVENTORY_ITEMS = [
  { id: 'inv-1', name: 'Bananas', categoryType: 'produce', categoryLabel: 'Fresh Produce', daysLeft: '1 Day Left', status: 'Urgent', statusColor: '#ef4444', statusBg: '#fee2e2' },
  { id: 'inv-2', name: 'Milk', categoryType: 'pantry', categoryLabel: 'Pantry Staples', stockLevel: 'FULL', status: 'Good', statusColor: '#10b981', statusBg: '#dcfce7' },
  { id: 'inv-3', name: 'Spinach', categoryType: 'produce', categoryLabel: 'Fresh Produce', daysLeft: '2 Days Left', status: 'Urgent', statusColor: '#ef4444', statusBg: '#fee2e2' },
  { id: 'inv-4', name: 'Cereal', categoryType: 'pantry', categoryLabel: 'Pantry Staples', stockLevel: 'HALF', status: 'Good', statusColor: '#10b981', statusBg: '#dcfce7' },
  { id: 'inv-5', name: 'Tomatoes', categoryType: 'produce', categoryLabel: 'Fresh Produce', daysLeft: '5 Days Left', status: 'Good', statusColor: '#10b981', statusBg: '#dcfce7' },
  { id: 'inv-6', name: 'Bread', categoryType: 'pantry', categoryLabel: 'Pantry Staples', stockLevel: 'LOW', status: 'Urgent', statusColor: '#ef4444', statusBg: '#fee2e2' },
];

export default function InventoryPage({
  items = [],
  onAdd,
  onConsume,
  onWaste,
  onDelete,
  onUpdate,
  onTogglePantry,
  onAddToRestock,
  generateRecipeFn,
  onOpenMorningDigest,
}) {
  // Tab state: 'all' | 'produce' | 'pantry'
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);

  const activeItems = useMemo(() => items.filter((i) => i.status === 'active'), [items]);

  // Combine real items and format them
  const formattedItems = useMemo(() => {
    if (activeItems.length > 0) {
      return activeItems.map((item) => {
        const isProduce = item.track === 'produce';
        const exp = isProduce ? getExpiryStatus(item.expiryDate) : null;
        const daysLeftStr = isProduce
          ? (exp?.daysLeft === 0 ? 'Expires Today' : `${exp?.daysLeft} Day${exp?.daysLeft !== 1 ? 's' : ''} Left`)
          : null;

        let status = 'Good';
        let statusColor = '#10b981';
        let statusBg = '#dcfce7';

        if (isProduce && exp?.status === 'urgent') {
          status = 'Urgent';
          statusColor = '#ef4444';
          statusBg = '#fee2e2';
        } else if (!isProduce && item.pantryState === 'LOW') {
          status = 'Urgent';
          statusColor = '#ef4444';
          statusBg = '#fee2e2';
        }

        return {
          id: item.id,
          name: item.name,
          categoryType: isProduce ? 'produce' : 'pantry',
          categoryLabel: isProduce ? 'Fresh Produce' : 'Pantry Staples',
          daysLeft: daysLeftStr,
          stockLevel: item.pantryState || 'FULL',
          status,
          statusColor,
          statusBg,
          rawItem: item,
        };
      });
    }
    return [];
  }, [activeItems]);

  // Filter by Tab and Search
  const filteredItems = useMemo(() => {
    return formattedItems.filter((i) => {
      const matchTab =
        tab === 'all' ||
        (tab === 'produce' && i.categoryType === 'produce') ||
        (tab === 'pantry' && i.categoryType === 'pantry');
      const matchSearch =
        !search || i.name.toLowerCase().includes(search.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [formattedItems, tab, search]);

  // Expiring items for Zero-Waste Recipe generator
  const expiringItems = useMemo(() => {
    const list = formattedItems.filter((i) => i.status === 'Urgent' || i.status === 'Soon');
    if (list.length > 0) {
      return list.map((i) => ({
        id: i.id,
        _id: i.id,
        name: i.name,
        daysLeft: i.daysLeft ? parseInt(i.daysLeft, 10) || 1 : 1,
        status: i.status === 'Urgent' ? 'urgent' : 'warn',
      }));
    }
    return [
      { id: 'inv-1', _id: 'inv-1', name: 'Bananas', daysLeft: 1, status: 'urgent' },
      { id: 'inv-3', _id: 'inv-3', name: 'Spinach', daysLeft: 2, status: 'urgent' },
    ];
  }, [formattedItems]);

  const handlePantryStateClick = (itemId, newState) => {
    if (onUpdate) {
      onUpdate(itemId, { pantryState: newState });
    } else if (onTogglePantry) {
      onTogglePantry(itemId);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* ── Top Header Strip ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: 'var(--text, #1e293b)',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Inventory Management
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted, #64748b)', margin: '4px 0 0' }}>
            Manage your household kitchen stock and expiry levels
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <NotificationBellDropdown
            items={items}
            onOpenRescueRecipes={() => setShowRecipeModal(true)}
            onOpenMorningDigest={onOpenMorningDigest}
          />
          <UserProfileChip />
        </div>
      </div>

      {/* ── Sub-Controls: Filter Tabs + Search + Add Item Button ────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {/* Filter Pills (All Items, Fresh Produce, Pantry Staples) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--surface-2, #eef2f6)',
            borderRadius: 12,
            padding: 3,
            gap: 2,
          }}
        >
          {[
            { id: 'all', label: 'All Items' },
            { id: 'produce', label: 'Fresh Produce' },
            { id: 'pantry', label: 'Pantry Staples' },
          ].map((t) => {
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  border: 'none',
                  background: isActive ? 'var(--surface, #ffffff)' : 'transparent',
                  color: isActive ? 'var(--text, #1e293b)' : 'var(--text-muted, #64748b)',
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  padding: '7px 16px',
                  borderRadius: 9,
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Right Search Bar + Add Item Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search
              size={15}
              color="var(--text-dim, #94a3b8)"
              style={{ position: 'absolute', left: 12 }}
            />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: 180,
                height: 38,
                padding: '0 12px 0 34px',
                borderRadius: 10,
                border: '1px solid var(--border, #e2e8f0)',
                background: 'var(--surface, #ffffff)',
                fontSize: 13,
                color: 'var(--text, #1e293b)',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowRecipeModal(true)}
            style={{
              height: 38,
              padding: '0 14px',
              borderRadius: 10,
              background: 'var(--green-glow, #f0fdf4)',
              color: 'var(--green, #166534)',
              border: '1px solid var(--border, #bbf7d0)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease',
            }}
          >
            <ChefHat size={15} />
            <span>Rescue Recipes 🍳 ({expiringItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDrawer(true)}
            style={{
              height: 38,
              padding: '0 16px',
              borderRadius: 10,
              background: 'var(--green, #16a34a)',
              color: '#ffffff',
              border: 'none',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 6px var(--green-glow, rgba(22, 163, 74, 0.25))',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={16} />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* ── Main Detailed Inventory Table Card (Image 3) ────────────────── */}
      <div
        style={{
          background: 'var(--surface, #ffffff)',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 22px 14px' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text, #1e293b)', margin: 0 }}>
            Detailed Inventory Table
          </h2>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-soft, #f1f5f9)', color: 'var(--text-muted, #64748b)', fontSize: 12.5 }}>
              <th style={{ padding: '12px 22px', fontWeight: 600, width: '28%' }}>Item Name</th>
              <th style={{ padding: '12px 18px', fontWeight: 600, width: '22%' }}>Category</th>
              <th style={{ padding: '12px 18px', fontWeight: 600, width: '24%' }}>Stock / Days Left</th>
              <th style={{ padding: '12px 18px', fontWeight: 600, width: '13%' }}>Status</th>
              <th style={{ padding: '12px 22px', fontWeight: 600, width: '13%', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🧺</div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text, #1e293b)' }}>Your kitchen inventory is empty</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>Add items to your account using the "+ Add Item" button or move items from your shopping list.</div>
                </td>
              </tr>
            ) : (
              filteredItems.map((row, index) => {
              const isProduce = row.categoryType === 'produce';
              return (
                <tr
                  key={row.id || index}
                  style={{
                    borderBottom: '1px solid var(--border-soft, #f8fafc)',
                    transition: 'background 0.1s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2, #fafbfc)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Item Name */}
                  <td style={{ padding: '14px 22px', color: 'var(--text, #1e293b)', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{getEmoji(row.name)}</span>
                      <span>{row.name}</span>
                    </div>
                  </td>

                  {/* Category */}
                  <td style={{ padding: '14px 18px', color: 'var(--text-muted, #64748b)' }}>
                    {row.categoryLabel}
                  </td>

                  {/* Stock / Days Left */}
                  <td style={{ padding: '14px 18px' }}>
                    {isProduce ? (
                      <span style={{ color: 'var(--text, #1e293b)', fontWeight: 500 }}>
                        {row.daysLeft}
                      </span>
                    ) : (
                      /* 3-State Segmented Control Capsule (FULL / HALF / LOW) */
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          background: 'var(--surface-2, #f1f5f9)',
                          borderRadius: 20,
                          padding: 2,
                          gap: 1,
                        }}
                      >
                        {['FULL', 'HALF', 'LOW'].map((lvl) => {
                          const active = row.stockLevel === lvl;
                          return (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => handlePantryStateClick(row.id, lvl)}
                              style={{
                                border: 'none',
                                background: active ? 'var(--text, #334155)' : 'transparent',
                                color: active ? 'var(--bg, #ffffff)' : 'var(--text-muted, #64748b)',
                                color: active ? '#ffffff' : '#64748b',
                                fontSize: 10,
                                fontWeight: active ? 800 : 600,
                                padding: '3px 9px',
                                borderRadius: 16,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {lvl}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 12px',
                        borderRadius: 999,
                        background: row.statusBg,
                        color: row.statusColor,
                        fontSize: 11.5,
                        fontWeight: 700,
                      }}
                    >
                      {row.status}
                    </span>
                  </td>

                  {/* Actions: (✓) Consumed and (🗑) Discarded */}
                  <td style={{ padding: '14px 22px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {/* Consumed Button */}
                      <button
                        type="button"
                        onClick={() => onConsume && onConsume(row.id)}
                        title="Mark Consumed"
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          border: '1px solid #e2e8f0',
                          background: '#ffffff',
                          color: '#16a34a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#dcfce7';
                          e.currentTarget.style.borderColor = '#16a34a';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                      >
                        <Check size={14} />
                      </button>

                      {/* Discarded Button */}
                      <button
                        type="button"
                        onClick={() => onWaste ? onWaste(row.id) : (onDelete && onDelete(row.id))}
                        title="Mark Discarded / Spoiled"
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          border: '1px solid #e2e8f0',
                          background: '#ffffff',
                          color: '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#fee2e2';
                          e.currentTarget.style.borderColor = '#ef4444';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>

      {/* Manual Add Drawer */}
      {showDrawer && (
        <AddItemDrawer
          isOpen={showDrawer}
          onClose={() => setShowDrawer(false)}
          onAdd={onAdd}
        />
      )}

      {/* Rescue My Fridge AI Recipe Modal */}
      {showRecipeModal && (
        <AiRecipeModal
          isOpen={showRecipeModal}
          onClose={() => setShowRecipeModal(false)}
          expiringItems={expiringItems}
          generateRecipeFn={generateRecipeFn}
          onConsume={onConsume}
        />
      )}
    </div>
  );
}
