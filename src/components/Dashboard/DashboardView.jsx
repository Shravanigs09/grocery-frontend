// src/components/Dashboard/DashboardView.jsx
// Exact visual match to Image 2 (Grove View Dashboard Mockup)
import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  Plus, Mic, Camera, ChefHat, Sparkles,
} from 'lucide-react';
import { getExpiryStatus } from '../Inventory/ExpiryBadge';
import AddItemDrawer from '../AddItem/AddItemDrawer';
import ReceiptScanModal from '../AddItem/ReceiptScanModal';
import BatchVoiceAddModal from '../AddItem/BatchVoiceAddModal';
import AiRecipeModal from '../AiRecipeModal';
import UserProfileChip from '../Layout/UserProfileChip';
import NotificationBellDropdown from '../Notifications/NotificationBellDropdown';
import VoiceInputButton from '../AddItem/VoiceInputButton';
import { detectFoodDetails, parseQuantityAndUnit } from '../../utils/foodDetection';

const FOOD_EMOJI = {
  Vegetables: '🥬',
  Dairy: '🥛',
  Fruit: '🍌',
  Meat: '🥩',
  Bakery: '🍞',
  Pantry: '🌾',
  Produce: '🥑',
  General: '🛒',
};

// Helper to extract date key (YYYY-MM-DD) from waste log entry
function getWasteEntryDateKey(entry) {
  if (!entry) return null;
  const raw = entry.date || entry.resolvedDate || entry.updatedAt || entry.createdAt;
  if (!raw) return null;
  if (typeof raw === 'string') {
    if (raw.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
      return raw.slice(0, 10);
    }
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  } else if (raw instanceof Date && !isNaN(raw.getTime())) {
    return raw.toISOString().slice(0, 10);
  }
  return null;
}

// Clean custom tooltip for live waste chart
function CustomWasteTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        style={{
          background: 'var(--surface, #ffffff)',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: 8,
          padding: '8px 12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          fontSize: 12,
        }}
      >
        <div style={{ fontWeight: 700, color: 'var(--text, #1e293b)', marginBottom: 4 }}>
          {data.day} ({data.displayDate})
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          <span>Consumed: {data.consumed}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontWeight: 600, marginTop: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171', display: 'inline-block' }} />
          <span>Spoiled: {data.spoiled}</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function DashboardView({
  items = [],
  notes = [],
  wasteLog = [],
  onAdd,
  onAddMultiple,
  onConsume,
  onWaste,
  onDelete,
  onNavigateTab,
  generateRecipeFn,
  onOpenMorningDigest,
}) {
  const [showDrawer, setShowDrawer] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [showBatchVoiceModal, setShowBatchVoiceModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [timeframe, setTimeframe] = useState('Weekly');

  // ── 100% Real Metrics Calculation (No Mock/Fallback Defaults) ─────────────
  const activeItems = useMemo(() => items.filter((i) => i.status === 'active'), [items]);
  const produceItems = useMemo(() => activeItems.filter((i) => i.track === 'produce'), [activeItems]);
  const pantryItems = useMemo(() => activeItems.filter((i) => i.track === 'pantry'), [activeItems]);

  const produceCount = produceItems.length;
  const pantryCount = pantryItems.length;
  const totalStockCount = activeItems.length;

  // Real Preservation Score & Waste Counts
  const consumedCount = useMemo(
    () => wasteLog.filter((w) => String(w.status).toLowerCase() === 'consumed').length,
    [wasteLog]
  );
  const spoiledCount = useMemo(
    () => wasteLog.filter((w) => String(w.status).toLowerCase() === 'wasted').length,
    [wasteLog]
  );
  const totalDecided = consumedCount + spoiledCount;
  const preservationScore = totalDecided > 0
    ? Math.round((consumedCount / totalDecided) * 100)
    : 100;

  // Earliest Expiry (real item checking & plural formatting)
  const sortedProduce = useMemo(() => {
    return [...produceItems].sort((a, b) => {
      const d1 = new Date(a.expiryDate || '2099-01-01');
      const d2 = new Date(b.expiryDate || '2099-01-01');
      return d1 - d2;
    });
  }, [produceItems]);

  const earliestItem = sortedProduce[0];
  const earliestExpiryStatus = earliestItem ? getExpiryStatus(earliestItem.expiryDate) : null;
  const earliestExpiryDays = earliestExpiryStatus?.daysLeft;
  const earliestExpiryText = earliestItem
    ? (earliestExpiryDays === 0
        ? 'Today'
        : earliestExpiryDays < 0
          ? 'Expired'
          : `${earliestExpiryDays} Day${earliestExpiryDays === 1 ? '' : 's'}`)
    : 'All Fresh';
  const earliestExpiryName = earliestItem ? earliestItem.name : 'No items';

  // Expiring items candidate list for Zero-Waste Recipe generator
  const expiringProduceList = useMemo(() => {
    const list = produceItems.filter((item) => {
      const exp = getExpiryStatus(item.expiryDate);
      return exp && (exp.status === 'urgent' || exp.status === 'warn' || exp.daysLeft <= 3);
    });
    if (list.length > 0) {
      return list.map((it) => {
        const exp = getExpiryStatus(it.expiryDate);
        return {
          id: it.id || it._id,
          _id: it._id || it.id,
          name: it.name,
          daysLeft: exp?.daysLeft ?? 2,
          status: exp?.status || 'urgent',
        };
      });
    }
    return [];
  }, [produceItems]);

  // Wastage Tracker Real Daily Bar Chart Data
  const chartData = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    let daysList = [];

    if (timeframe === 'Past 7 Days') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateKey = d.toISOString().slice(0, 10);
        daysList.push({
          day: d.toLocaleDateString('en-US', { weekday: 'short' }),
          dateKey,
          displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          isToday: i === 0,
        });
      }
    } else {
      // Weekly: Mon through Sun of the current week
      const currentDay = now.getDay(); // 0 = Sun, 1 = Mon ...
      const distanceToMon = (currentDay + 6) % 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - distanceToMon);

      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      daysList = dayNames.map((name, idx) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + idx);
        const dateKey = d.toISOString().slice(0, 10);
        return {
          day: name,
          dateKey,
          displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          isToday: dateKey === todayStr,
        };
      });
    }

    return daysList.map((dayObj) => {
      const matched = wasteLog.filter((w) => {
        const entryDate = getWasteEntryDateKey(w);
        if (entryDate) return entryDate === dayObj.dateKey;
        // Fallback for items marked today with no explicit timestamp
        if (dayObj.isToday && (w.week === 'This Week' || !w.week)) return true;
        return false;
      });

      const consumed = matched.filter((w) => String(w.status).toLowerCase() === 'consumed').length;
      const spoiled = matched.filter((w) => String(w.status).toLowerCase() === 'wasted').length;

      return {
        day: dayObj.day,
        dateKey: dayObj.dateKey,
        displayDate: dayObj.displayDate,
        consumed,
        spoiled,
      };
    });
  }, [wasteLog, timeframe]);

  const totalPeriodConsumed = useMemo(() => chartData.reduce((acc, d) => acc + d.consumed, 0), [chartData]);
  const totalPeriodSpoiled = useMemo(() => chartData.reduce((acc, d) => acc + d.spoiled, 0), [chartData]);
  const totalPeriodDecided = totalPeriodConsumed + totalPeriodSpoiled;

  const maxDailyCount = useMemo(() => {
    const highest = Math.max(0, ...chartData.map((d) => Math.max(d.consumed, d.spoiled)));
    return Math.max(4, highest + 1);
  }, [chartData]);

  // Format active recent items
  const recentTableItems = useMemo(() => {
    if (activeItems.length > 0) {
      return activeItems.slice(0, 6).map((item) => {
        const isProduce = item.track === 'produce';
        const exp = isProduce ? getExpiryStatus(item.expiryDate) : null;
        const daysLeftStr = isProduce
          ? (exp?.daysLeft === 0 ? 'Today' : `${exp?.daysLeft} Day${exp?.daysLeft !== 1 ? 's' : ''}`)
          : (item.pantryState || 'Stable');

        let status = 'Good';
        let statusColor = '#10b981';
        let statusBg = '#dcfce7';

        if (exp?.status === 'urgent') {
          status = 'Urgent';
          statusColor = '#ef4444';
          statusBg = '#fee2e2';
        } else if (exp?.status === 'warn') {
          status = 'Soon';
          statusColor = '#f59e0b';
          statusBg = '#fef3c7';
        } else if (!isProduce) {
          status = item.pantryState === 'LOW' ? 'Urgent' : 'Good';
          statusColor = item.pantryState === 'LOW' ? '#ef4444' : '#10b981';
          statusBg = item.pantryState === 'LOW' ? '#fee2e2' : '#dcfce7';
        }

        return {
          id: item.id,
          name: item.name,
          emoji: FOOD_EMOJI[item.category] || '🥬',
          category: isProduce ? 'Produce' : 'Pantry',
          daysLeft: daysLeftStr,
          status,
          statusColor,
          statusBg,
        };
      });
    }
    return [];
  }, [activeItems]);

  const handleVoiceQuickAdd = (text) => {
    if (!text) return;
    const clean = text.replace(/^(add|buy|get)\s+/i, '').trim();
    if (!clean) return;
    const detected = detectFoodDetails(clean);
    const parsedQty = parseQuantityAndUnit(clean);
    onAdd({
      name: detected.cleanName || clean,
      track: detected.track || 'produce',
      category: detected.category || 'Vegetables',
      shelfLifeDays: detected.shelfLifeDays || 5,
      quantity: parsedQty.quantity || 1,
      unit: parsedQty.unit || detected.defaultUnit || 'kg',
      price: detected.estimatedPrice || 0,
    });
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
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: 'var(--text, #1e293b)',
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          Dashboard
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <NotificationBellDropdown
            items={items}
            onOpenRescueRecipes={() => setShowRecipeModal(true)}
            onOpenMorningDigest={onOpenMorningDigest}
          />
          <UserProfileChip />
        </div>
      </div>

      {/* ── 3 Top Stat Metric Cards (Image 2) ───────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 20,
          marginBottom: 24,
        }}
      >
        {/* Card 1: Items Stocked */}
        <div
          style={{
            background: 'var(--surface, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: 16,
            padding: '22px 20px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>
            Items Stocked
          </div>
          <div
            style={{
              fontSize: 34,
              fontWeight: 800,
              color: 'var(--text, #0f172a)',
              letterSpacing: '-0.02em',
              margin: '8px 0 4px',
            }}
          >
            {totalStockCount}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted, #64748b)' }}>
            {produceCount} Produce • {pantryCount} Pantry
          </div>
        </div>

        {/* Card 2: Kitchen Freshness & Preservation Score */}
        <div
          style={{
            background: 'var(--surface, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: 16,
            padding: '22px 20px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>
            Preservation Score
          </div>
          <div
            style={{
              fontSize: 34,
              fontWeight: 800,
              color: preservationScore >= 80 ? 'var(--text, #0f172a)' : '#dc2626',
              letterSpacing: '-0.02em',
              margin: '8px 0 4px',
            }}
          >
            {preservationScore}%
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted, #64748b)' }}>
            {totalDecided === 0 ? (
              <span>0 Spoiled • 100% Fresh Kitchen</span>
            ) : (
              <span>{consumedCount} Consumed • {spoiledCount} Spoiled</span>
            )}
          </div>
        </div>

        {/* Card 3: Earliest Expiry */}
        <div
          style={{
            background: 'var(--surface, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: 16,
            padding: '22px 20px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            position: 'relative',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted, #64748b)' }}>
            Earliest Expiry
          </div>
          <div
            style={{
              fontSize: 34,
              fontWeight: 800,
              color: 'var(--text, #0f172a)',
              letterSpacing: '-0.02em',
              margin: '8px 0 4px',
            }}
          >
            {earliestExpiryText}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted, #64748b)' }}>
              {earliestExpiryName}
            </span>
            {earliestItem && (
              <button
                type="button"
                onClick={() => setShowRecipeModal(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px',
                  borderRadius: 99,
                  background: 'var(--green-glow, #dcfce7)',
                  border: '1px solid var(--border, #bbf7d0)',
                  color: 'var(--green, #15803d)',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <ChefHat size={11} /> Rescue 🍳
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Zero-Waste Smart Rescue Banner ─────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(90deg, var(--green-glow, #f0fdf4) 0%, var(--surface, #ffffff) 100%)',
          border: '1px solid var(--border, #bbf7d0)',
          borderRadius: 14,
          padding: '12px 18px',
          marginBottom: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'var(--green-glow, #dcfce7)',
              color: 'var(--green, #166534)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ChefHat size={18} />
          </div>
          <div>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--green, #166534)', margin: 0 }}>
              {expiringProduceList.length > 0
                ? `Rescue My Fridge: ${expiringProduceList.map((i) => i.name).slice(0, 3).join(', ')} expire soon!`
                : 'Your fridge produce is fresh & safe 🌿'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted, #15803d)', margin: '2px 0 0' }}>
              {expiringProduceList.length > 0
                ? 'Turn your expiring produce into a 15-minute meal before it goes to waste.'
                : 'No urgent items expiring. Keep tracking to minimize household food decay.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowRecipeModal(true)}
          style={{
            padding: '7px 16px',
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
            boxShadow: '0 2px 6px var(--green-glow, rgba(22, 101, 52, 0.2))',
          }}
        >
          <Sparkles size={13} />
          What can I cook? 🍳
        </button>
      </div>

      {/* ── Middle Row: Wastage Tracker + Easy Add Item ─────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.9fr 1.1fr',
          gap: 20,
          marginBottom: 24,
        }}
      >
        {/* Left: Wastage Tracker Bar Chart */}
        <div
          style={{
            background: 'var(--surface, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: 16,
            padding: '20px 22px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text, #1e293b)', margin: 0 }}>
                Wastage Tracker
              </h2>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 99,
                  background: spoiledCount === 0 ? 'var(--green-glow, #dcfce7)' : '#fee2e2',
                  color: spoiledCount === 0 ? 'var(--green, #15803d)' : '#b91c1c',
                }}
              >
                {spoiledCount === 0 ? '🌱 Zero Waste' : `⚠️ ${spoiledCount} Spoiled`}
              </span>
            </div>

            {/* Interactive Timeframe Selector */}
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              style={{
                padding: '4px 10px',
                borderRadius: 8,
                border: '1px solid var(--border, #cbd5e1)',
                background: 'var(--surface-2, #ffffff)',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text, #334155)',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="Weekly">This Week (Mon-Sun)</option>
              <option value="Past 7 Days">Past 7 Days</option>
            </select>
          </div>

          {/* Bar Chart or Zero-Waste Live Empty State */}
          {wasteLog.length === 0 ? (
            <div
              style={{
                height: 170,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 12,
                background: 'var(--surface-2, #f8fafc)',
                border: '1px dashed var(--border, #cbd5e1)',
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 26, marginBottom: 4 }}>🌱</div>
              <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text, #1e293b)' }}>
                Zero Food Waste in Your Kitchen!
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted, #64748b)', maxWidth: 280, marginTop: 2 }}>
                All active items are 100% fresh. When items are consumed or spoiled, daily trends appear here.
              </div>
            </div>
          ) : (
            <div style={{ width: '100%', height: 170 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-soft, #f1f5f9)" />
                  <XAxis
                    dataKey="day"
                    axisLine={{ stroke: 'var(--border, #e2e8f0)' }}
                    tickLine={false}
                    tick={{ fill: 'var(--text-muted, #64748b)', fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    tick={{ fill: 'var(--text-dim, #94a3b8)', fontSize: 10 }}
                    domain={[0, maxDailyCount]}
                  />
                  <Tooltip content={<CustomWasteTooltip />} />
                  <Bar dataKey="consumed" fill="#22c55e" radius={[3, 3, 0, 0]} barSize={16} />
                  <Bar dataKey="spoiled" fill="#f87171" radius={[3, 3, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Chart Legend & Period Summary */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginTop: 12,
              paddingTop: 10,
              borderTop: '1px solid var(--border-soft, #f1f5f9)',
              fontSize: 11.5,
              fontWeight: 500,
              color: 'var(--text-muted, #64748b)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#22c55e', display: 'inline-block' }} />
                <span><strong style={{ color: 'var(--text, #1e293b)' }}>{totalPeriodConsumed}</strong> Consumed</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: '#f87171', display: 'inline-block' }} />
                <span><strong style={{ color: 'var(--text, #1e293b)' }}>{totalPeriodSpoiled}</strong> Spoiled</span>
              </div>
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text, #0f172a)' }}>
              {totalPeriodDecided > 0
                ? `${Math.round((totalPeriodConsumed / totalPeriodDecided) * 100)}% Preserved`
                : '100% Preserved'}
            </div>
          </div>
        </div>

        {/* Right: Easy Add Item (3 Stacked Clean Buttons) */}
        <div
          style={{
            background: 'var(--surface, #ffffff)',
            border: '1px solid var(--border, #e2e8f0)',
            borderRadius: 16,
            padding: '20px 22px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text, #1e293b)', margin: '0 0 16px' }}>
            Easy Add Item
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, justifyContent: 'center' }}>
            {/* Button 1: Add Grocery */}
            <button
              type="button"
              onClick={() => setShowDrawer(true)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid var(--border, #cbd5e1)',
                background: 'var(--surface-2, #ffffff)',
                color: 'var(--text, #1e293b)',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--green, #16a34a)';
                e.currentTarget.style.background = 'var(--surface, #f8fafc)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border, #cbd5e1)';
                e.currentTarget.style.background = 'var(--surface-2, #ffffff)';
              }}
            >
              <Plus size={16} />
              <span>Add Grocery</span>
            </button>

            {/* Button 2: Speak Item */}
            <button
              type="button"
              onClick={() => setShowBatchVoiceModal(true)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid var(--border, #cbd5e1)',
                background: 'var(--surface-2, #ffffff)',
                color: 'var(--text, #1e293b)',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--green, #16a34a)';
                e.currentTarget.style.background = 'var(--surface, #f8fafc)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border, #cbd5e1)';
                e.currentTarget.style.background = 'var(--surface-2, #ffffff)';
              }}
            >
              <Mic size={16} />
              <span>Speak Item</span>
            </button>

            {/* Button 3: Scan Photo */}
            <button
              type="button"
              onClick={() => setShowScanModal(true)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid var(--border, #cbd5e1)',
                background: 'var(--surface-2, #ffffff)',
                color: 'var(--text, #1e293b)',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--green, #16a34a)';
                e.currentTarget.style.background = 'var(--surface, #f8fafc)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border, #cbd5e1)';
                e.currentTarget.style.background = 'var(--surface-2, #ffffff)';
              }}
            >
              <Camera size={16} />
              <span>Scan Photo</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Bottom Card: Recent Items Table (Image 2) ───────────────────── */}
      <div
        style={{
          background: 'var(--surface, #ffffff)',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: 16,
          padding: '20px 22px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text, #1e293b)', margin: 0 }}>
            Recent Items
          </h2>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('inventory')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--green, #16a34a)',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              View all inventory →
            </button>
          )}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-soft, #f1f5f9)', color: 'var(--text-muted, #64748b)', fontSize: 12 }}>
              <th style={{ padding: '10px 14px', fontWeight: 600, width: '35%' }}>Item</th>
              <th style={{ padding: '10px 14px', fontWeight: 600, width: '25%' }}>Category</th>
              <th style={{ padding: '10px 14px', fontWeight: 600, width: '25%' }}>Days Left</th>
              <th style={{ padding: '10px 14px', fontWeight: 600, width: '15%', textAlign: 'right' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentTableItems.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '36px 14px', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>🥬</div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text, #1e293b)' }}>No groceries tracked in this account yet</div>
                  <div style={{ fontSize: 12, marginTop: 3 }}>Use the Quick Add above or "+ Add Item" to stock your kitchen.</div>
                </td>
              </tr>
            ) : (
              recentTableItems.map((row) => (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: '1px solid var(--border-soft, #f8fafc)',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <td style={{ padding: '12px 14px', color: 'var(--text, #1e293b)', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 17 }}>{row.emoji}</span>
                      <span>{row.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-muted, #64748b)' }}>
                    {row.category}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text, #1e293b)' }}>
                    {row.daysLeft}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Manual Add Drawer */}
      {showDrawer && (
        <AddItemDrawer
          isOpen={showDrawer}
          onClose={() => setShowDrawer(false)}
          onAdd={onAdd}
          onAddMultiple={onAddMultiple}
        />
      )}

      {/* Receipt / Photo Scan Modal */}
      {showScanModal && (
        <ReceiptScanModal
          isOpen={showScanModal}
          onClose={() => setShowScanModal(false)}
          onAddItems={onAddMultiple}
        />
      )}

      {/* Batch Multi-Item Voice & Paste Modal */}
      {showBatchVoiceModal && (
        <BatchVoiceAddModal
          isOpen={showBatchVoiceModal}
          onClose={() => setShowBatchVoiceModal(false)}
          onAddItems={(newItems) => {
            if (onAddMultiple) {
              onAddMultiple(newItems);
            } else {
              newItems.forEach((it) => onAdd && onAdd(it));
            }
          }}
        />
      )}

      {/* Rescue My Fridge AI Recipe Modal */}
      {showRecipeModal && (
        <AiRecipeModal
          isOpen={showRecipeModal}
          onClose={() => setShowRecipeModal(false)}
          expiringItems={expiringProduceList}
          generateRecipeFn={generateRecipeFn}
          onConsume={onConsume}
        />
      )}
    </div>
  );
}
