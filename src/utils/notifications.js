// src/utils/notifications.js
// Proactive Expiration Alerts & Morning Digest Utilities

import { getExpiryStatus } from '../components/Inventory/ExpiryBadge';

export function getNotificationPermissionStatus() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export async function requestDesktopNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

export function sendDesktopAlert(title, body, tag = 'grove-alert') {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;
  if (Notification.permission !== 'granted') return null;

  try {
    const notif = new Notification(title, {
      body,
      tag,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: false,
    });
    return notif;
  } catch (err) {
    console.warn('Desktop notification dispatch failed:', err);
    return null;
  }
}

export function getExpiringAndLowAlerts(items = []) {
  const activeItems = items.filter((i) => i.status === 'active' || i.status === 'ACTIVE');

  // Produce expiring in <= 3 days
  const expiringProduce = [];
  // Pantry staples marked LOW
  const lowPantry = [];

  activeItems.forEach((item) => {
    const isProduce = item.track === 'produce' || item.panelType === 'PRODUCE';
    if (isProduce && item.expiryDate) {
      const exp = getExpiryStatus(item.expiryDate);
      if (exp && (exp.status === 'urgent' || exp.status === 'warn' || exp.daysLeft <= 3)) {
        expiringProduce.push({
          ...item,
          daysLeft: exp.daysLeft,
          status: exp.status,
        });
      }
    } else if (!isProduce) {
      const stock = item.pantryState || item.stockLevel;
      if (stock === 'LOW') {
        lowPantry.push(item);
      }
    }
  });

  // Sort earliest expiry first
  expiringProduce.sort((a, b) => (a.daysLeft ?? 99) - (b.daysLeft ?? 99));

  return {
    expiringProduce,
    lowPantry,
    totalCount: expiringProduce.length + lowPantry.length,
  };
}

export function checkMorningDigestEligible(items = []) {
  if (typeof window === 'undefined') return null;

  const todayKey = new Date().toISOString().slice(0, 10);
  const lastDigestKey = localStorage.getItem('grove_last_digest_date');

  // If already seen today, skip automatic popup
  if (lastDigestKey === todayKey) return null;

  const { expiringProduce, lowPantry } = getExpiringAndLowAlerts(items);

  // If there are actionable alerts, return digest summary data
  if (expiringProduce.length > 0 || lowPantry.length > 0) {
    return {
      date: todayKey,
      expiringProduce,
      lowPantry,
    };
  }

  return null;
}

export function markDigestSeenToday() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('grove_last_digest_date', new Date().toISOString().slice(0, 10));
  }
}
