import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency values
 */
export function formatCurrency(
  value: number,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
}

/**
 * Format percentage values
 */
export function formatPercent(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format time for display
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/New_York',
  });
}

/**
 * Get decision color classes
 */
export function getDecisionColor(decision: 'BID' | 'REVIEW' | 'SKIP') {
  const colors = {
    BID: {
      bg: 'bg-green-500/20',
      border: 'border-green-500',
      text: 'text-green-400',
    },
    REVIEW: {
      bg: 'bg-amber-500/20',
      border: 'border-amber-500',
      text: 'text-amber-400',
    },
    SKIP: {
      bg: 'bg-red-500/20',
      border: 'border-red-500',
      text: 'text-red-400',
    },
  };
  return colors[decision];
}

/**
 * Calculate bid/judgment ratio
 */
export function calculateBidRatio(openingBid: number, finalJudgment: number): number {
  if (finalJudgment === 0) return 0;
  return Math.round((openingBid / finalJudgment) * 100);
}

/**
 * Get decision from bid ratio
 */
export function getDecisionFromRatio(ratio: number): 'BID' | 'REVIEW' | 'SKIP' {
  if (ratio >= 75) return 'BID';
  if (ratio >= 60) return 'REVIEW';
  return 'SKIP';
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length)}...`;
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
