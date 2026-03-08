'use client';
// src/app/page.tsx

import { SplitScreenLayout } from '@/components/layout/SplitScreenLayout';

export default function Home() {
  return (
    <main className="h-screen overflow-hidden">
      <SplitScreenLayout />
    </main>
  );
}
