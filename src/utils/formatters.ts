/**
 * Formats a USD price with appropriate precision, especially for micro-cap memecoins.
 * Returns "N/A" if value is null or undefined.
 * Confirmed zero returns "$0.00".
 */
export function formatUsdPrice(price: number | string | null | undefined): string {
  if (price === null || price === undefined || price === '') {
    return 'N/A';
  }

  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return 'N/A';
  if (num === 0) return '$0.00';

  if (num >= 1000) {
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  if (num >= 1) {
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  }

  if (num >= 0.01) {
    return '$' + num.toFixed(4);
  }

  // Micro-cap prices (e.g. 0.0000345)
  if (num < 0.00000001) {
    return '< $0.00000001';
  }

  // Format with up to 8 decimal places
  const str = num.toFixed(8);
  // Remove trailing zeros
  const trimmed = str.replace(/\.?0+$/, '');
  return '$' + trimmed;
}

/**
 * Formats financial volumes, market caps, or liquidity values (e.g. $1.25M, $340.5K, $2.10B).
 */
export function formatCurrencyCompact(value: number | null | undefined, prefix = '$'): string {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  if (isNaN(value)) return 'N/A';
  if (value === 0) return `${prefix}0.00`;

  const absVal = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absVal >= 1_000_000_000) {
    return `${sign}${prefix}${(absVal / 1_000_000_000).toFixed(2)}B`;
  }
  if (absVal >= 1_000_000) {
    return `${sign}${prefix}${(absVal / 1_000_000).toFixed(2)}M`;
  }
  if (absVal >= 1_000) {
    return `${sign}${prefix}${(absVal / 1_000).toFixed(1)}K`;
  }
  return `${sign}${prefix}${absVal.toFixed(2)}`;
}

/**
 * Formats integer counts (e.g., transactions, holders).
 */
export function formatCount(count: number | null | undefined): string {
  if (count === null || count === undefined) {
    return 'N/A';
  }
  if (isNaN(count)) return 'N/A';
  if (count === 0) return '0';

  if (count >= 1_000_000) {
    return (count / 1_000_000).toFixed(2) + 'M';
  }
  if (count >= 1_000) {
    return (count / 1_000).toFixed(1) + 'K';
  }
  return count.toLocaleString('en-US');
}

/**
 * Formats percentage change with explicit sign (+ / -).
 */
export function formatPercentChange(percent: number | null | undefined): {
  text: string;
  isPositive: boolean;
  isNegative: boolean;
  isNeutral: boolean;
} {
  if (percent === null || percent === undefined || isNaN(percent)) {
    return { text: 'N/A', isPositive: false, isNegative: false, isNeutral: true };
  }

  if (percent === 0) {
    return { text: '0.00%', isPositive: false, isNegative: false, isNeutral: true };
  }

  const isPositive = percent > 0;
  const isNegative = percent < 0;
  const sign = isPositive ? '+' : '';
  const text = `${sign}${percent.toFixed(2)}%`;

  return { text, isPositive, isNegative, isNeutral: false };
}

/**
 * Formats relative time (e.g., "5m ago", "2h ago", "4d ago").
 */
export function formatRelativeTime(timestampMs: number | null | undefined): string {
  if (!timestampMs || isNaN(timestampMs)) {
    return 'N/A';
  }

  const now = Date.now();
  const diffSec = Math.floor((now - timestampMs) / 1000);

  if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

/**
 * Formats exact timestamp to readable localized string.
 */
export function formatDateTime(timestampMs: number | null | undefined): string {
  if (!timestampMs || isNaN(timestampMs)) return 'N/A';
  return new Date(timestampMs).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Truncates a blockchain address (e.g. 0x1234...abcd or DezX...B263).
 */
export function truncateAddress(address: string | null | undefined, chars = 4): string {
  if (!address) return 'N/A';
  const clean = address.trim();
  if (clean.length <= chars * 2 + 2) return clean;
  return `${clean.slice(0, chars + 2)}...${clean.slice(-chars)}`;
}
