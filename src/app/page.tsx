'use client';

import { SplitScreenLayout } from '@/components/layout/SplitScreenLayout';
import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { useBidDeedRuntime } from '@/lib/langgraph/runtime';

export default function Home() {
  const runtime = useBidDeedRuntime();

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <main className="h-screen overflow-hidden">
        <SplitScreenLayout />
      </main>
    </AssistantRuntimeProvider>
  );
}
