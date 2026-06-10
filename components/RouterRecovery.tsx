'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const INACTIVITY_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Re-syncs Next.js App Router after tab hibernation or bfcache restore.
 * Without this, client-side navigation (e.g. pagination) can silently fail.
 */
export default function RouterRecovery() {
  const router = useRouter();
  const lastActiveRef = useRef(Date.now());

  useEffect(() => {
    const markActive = () => {
      lastActiveRef.current = Date.now();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        markActive();
        return;
      }

      const inactiveMs = Date.now() - lastActiveRef.current;
      if (inactiveMs >= INACTIVITY_THRESHOLD_MS) {
        router.refresh();
      }

      markActive();
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        router.refresh();
      }
      markActive();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [router]);

  return null;
}
