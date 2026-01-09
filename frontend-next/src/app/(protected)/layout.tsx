'use client';

import { ReactNode } from 'react';
import { Navbar } from '@/components/navbar';
import { IntroModal } from '@/components/intro-modal';
import { AgeGate } from '@/components/age-gate';
import { useAppStore } from '@/stores/app-store';

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { ageVerified } = useAppStore();

  return (
    <>
      {/* Age Gate - must pass before seeing anything */}
      <AgeGate />

      {/* Intro Modal - shows after age gate passes */}
      {ageVerified && <IntroModal />}

      {/* Navbar */}
      <Navbar />

      {/* Page Content */}
      <main className="min-h-[calc(100vh-60px)]">{children}</main>
    </>
  );
}
