'use client';

import { useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { navigateWithQueryParams, type QueryUpdates } from '@/lib/queryNavigation';

export function useQueryNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const updateQuery = useCallback(
    (updates: QueryUpdates, options?: { scroll?: boolean }) => {
      navigateWithQueryParams(pathname, updates, router, options);
    },
    [pathname, router],
  );

  return { updateQuery };
}
