'use client';
// src/components/ui/ThemeToggle.tsx — Sun/Moon toggle button

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggle, mounted } = useTheme();

  // Prevent hydration mismatch — render placeholder until mounted
  if (!mounted) {
    return (
      <button className="relative w-9 h-9 rounded-lg flex items-center justify-center bg-slate-200 dark:bg-slate-800 transition-colors">
        <div className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="relative w-9 h-9 rounded-lg flex items-center justify-center bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all duration-300 group"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
    >
      {/* Sun icon — visible in dark mode */}
      <Sun
        className={`w-4 h-4 absolute transition-all duration-300 ${
          theme === 'dark'
            ? 'opacity-100 rotate-0 scale-100 text-amber-400'
            : 'opacity-0 rotate-90 scale-0 text-amber-400'
        }`}
      />
      {/* Moon icon — visible in light mode */}
      <Moon
        className={`w-4 h-4 absolute transition-all duration-300 ${
          theme === 'light'
            ? 'opacity-100 rotate-0 scale-100 text-slate-600'
            : 'opacity-0 -rotate-90 scale-0 text-slate-600'
        }`}
      />
    </button>
  );
}
