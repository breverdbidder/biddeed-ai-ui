import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        body: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Consolas', 'monospace'],
      },
      colors: {
        // BidDeed.AI Brand
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Primary Trust Blue
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Decision Colors
        decision: {
          bid: '#22c55e',
          'bid-bg': 'rgba(34, 197, 94, 0.2)',
          review: '#f59e0b',
          'review-bg': 'rgba(245, 158, 11, 0.2)',
          skip: '#ef4444',
          'skip-bg': 'rgba(239, 68, 68, 0.2)',
        },
        // Risk Gradient
        risk: {
          low: '#86efac',
          medium: '#fde047',
          high: '#fca5a5',
        },
        // Agent Status
        agent: {
          active: '#8b5cf6',
          completed: '#22c55e',
          pending: '#64748b',
          error: '#ef4444',
        },
        // Pipeline Stages
        stage: {
          discovery: '#06b6d4',
          scraping: '#8b5cf6',
          title: '#f59e0b',
          lien: '#ef4444',
          tax: '#22c55e',
          demographics: '#3b82f6',
          ml: '#ec4899',
          maxbid: '#10b981',
          decision: '#f97316',
          report: '#6366f1',
          disposition: '#14b8a6',
          archive: '#6b7280',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
