// Server Component — page.tsx intentionally has no 'use client'
// This enables Next.js 16 instant navigation validation
// Opting out of instant-navigation validation per Next.js 16 docs
export const instant = false;

import { AppShell } from '@/components/AppShell';

export default function HomePage() {
  return <AppShell />;
}
