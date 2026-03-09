'use client';
// src/app/page.tsx

import { SplitScreenLayout } from '@/components/layout/SplitScreenLayout';

function ErrorFallback() {
  return (
    <main className="h-screen bg-slate-950 flex items-center justify-center text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">BidDeed.AI</h1>
        <p className="text-slate-400">Loading failed. Try refreshing.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-[#F59E0B] text-black rounded-lg font-semibold"
        >
          Refresh
        </button>
      </div>
    </main>
  );
}

export default function Home() {
  try {
    return (
      <main className="h-screen overflow-hidden">
        <SplitScreenLayout />
      </main>
    );
  } catch {
    return <ErrorFallback />;
  }
}
