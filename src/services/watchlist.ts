import { WatchlistItem, PriceAlert, SupportedChain } from '../types/crypto';

const WATCHLIST_STORAGE_KEY = 'oceanscan_watchlist_v1';
const ALERTS_STORAGE_KEY = 'oceanscan_alerts_v1';

export function getWatchlist(): WatchlistItem[] {
  try {
    const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWatchlist(items: WatchlistItem[]): void {
  try {
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save watchlist to localStorage', e);
  }
}

export function addToWatchlist(item: WatchlistItem): WatchlistItem[] {
  const current = getWatchlist();
  const exists = current.some(
    (w) => w.pairAddress.toLowerCase() === item.pairAddress.toLowerCase()
  );
  if (exists) return current;

  const updated = [item, ...current];
  saveWatchlist(updated);
  return updated;
}

export function removeFromWatchlist(pairAddress: string): WatchlistItem[] {
  const current = getWatchlist();
  const updated = current.filter(
    (w) => w.pairAddress.toLowerCase() !== pairAddress.toLowerCase()
  );
  saveWatchlist(updated);
  return updated;
}

export function isInWatchlist(pairAddress: string): boolean {
  if (!pairAddress) return false;
  const current = getWatchlist();
  return current.some(
    (w) => w.pairAddress.toLowerCase() === pairAddress.toLowerCase()
  );
}

// ----------------- Alerts -----------------

export function getAlerts(): PriceAlert[] {
  try {
    const raw = localStorage.getItem(ALERTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAlerts(alerts: PriceAlert[]): void {
  try {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
  } catch (e) {
    console.error('Failed to save alerts to localStorage', e);
  }
}

export function addAlert(
  data: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered' | 'triggeredAt'>
): PriceAlert[] {
  const current = getAlerts();
  const newAlert: PriceAlert = {
    ...data,
    id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: Date.now(),
    triggered: false,
  };
  const updated = [newAlert, ...current];
  saveAlerts(updated);
  return updated;
}

export function removeAlert(id: string): PriceAlert[] {
  const current = getAlerts();
  const updated = current.filter((a) => a.id !== id);
  saveAlerts(updated);
  return updated;
}

export function resetAlert(id: string): PriceAlert[] {
  const current = getAlerts();
  const updated = current.map((a) =>
    a.id === id ? { ...a, triggered: false, triggeredAt: undefined, triggeredPrice: undefined } : a
  );
  saveAlerts(updated);
  return updated;
}

/**
 * Checks price alerts against verified prices map.
 * Returns newly triggered alerts only.
 * Updates alert triggered state in localStorage so the same crossing does not re-alert.
 */
export function evaluatePriceAlerts(
  alerts: PriceAlert[],
  pricesByPair: Record<string, number>
): {
  updatedAlerts: PriceAlert[];
  newlyTriggered: PriceAlert[];
} {
  const newlyTriggered: PriceAlert[] = [];

  const updatedAlerts = alerts.map((alert) => {
    if (!alert.isActive) return alert;

    const currentPrice = pricesByPair[alert.pairAddress.toLowerCase()] ?? pricesByPair[alert.pairAddress];
    if (currentPrice === undefined || isNaN(currentPrice) || currentPrice <= 0) {
      return alert;
    }

    let isTriggeredNow = false;

    if (alert.condition === 'ABOVE') {
      if (currentPrice >= alert.targetPriceUsd) {
        isTriggeredNow = true;
      }
    } else if (alert.condition === 'BELOW') {
      if (currentPrice <= alert.targetPriceUsd) {
        isTriggeredNow = true;
      }
    }

    // Trigger condition
    if (isTriggeredNow && !alert.triggered) {
      const triggeredAlert: PriceAlert = {
        ...alert,
        triggered: true,
        triggeredAt: Date.now(),
        triggeredPrice: currentPrice,
      };
      newlyTriggered.push(triggeredAlert);
      return triggeredAlert;
    }

    // Reset condition: if price moves back across threshold, allow re-arming
    if (!isTriggeredNow && alert.triggered) {
      // Condition has reset back
      return {
        ...alert,
        triggered: false,
        triggeredAt: undefined,
        triggeredPrice: undefined,
      };
    }

    return alert;
  });

  return { updatedAlerts, newlyTriggered };
}
