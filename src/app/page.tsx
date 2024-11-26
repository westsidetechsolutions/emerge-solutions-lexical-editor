'use client';

import dynamic from 'next/dynamic';

// Dynamically import the PlaygroundApp component with SSR disabled
const PlaygroundApp = dynamic(
  () => import('../lexical-playground/src/App'),
  { ssr: false }
);

export default function Home() {
  return (
    <main className="min-h-screen p-4">
      <PlaygroundApp />
    </main>
  );
}
