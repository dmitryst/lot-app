'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  navigateWithQueryParams,
  readQueryStringFromWindow,
  type QueryUpdates,
} from '@/lib/queryNavigation';

/**
 * Query string state synced with window.location.
 * Next.js useSearchParams() can lag behind after pushState — this hook is the source of truth for list pages.
 */
export function useQueryNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [queryString, setQueryString] = useState(readQueryStringFromWindow);

  // Sync from App Router only when it matches the address bar (direct link, full reload)
  useEffect(() => {
    const fromWindow = readQueryStringFromWindow();
    const fromRouter = searchParams.toString();

    if (fromWindow === fromRouter) {
      setQueryString(fromRouter);
    }
  }, [searchParams]);

  // Back / forward in browser history
  useEffect(() => {
    const handlePopState = () => {
      setQueryString(readQueryStringFromWindow());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const params = useMemo(() => new URLSearchParams(queryString), [queryString]);

  const updateQuery = useCallback(
    (updates: QueryUpdates, options?: { scroll?: boolean }) => {
      const nextQueryString = navigateWithQueryParams(pathname, updates, options);
      setQueryString(nextQueryString);
    },
    [pathname],
  );

  return { updateQuery, queryString, params };
}
