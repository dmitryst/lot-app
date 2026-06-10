import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export type QueryUpdates = Record<string, string | number | null | string[] | undefined>;

export function applyQueryUpdates(baseParams: URLSearchParams, updates: QueryUpdates): URLSearchParams {
  const params = new URLSearchParams(baseParams.toString());

  Object.entries(updates).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      params.delete(key);
      value.forEach(item => params.append(key, item));
    } else if (value === null || value === undefined || value === '' || value === 'Все') {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
  });

  return params;
}

export function buildQueryUrl(pathname: string, params: URLSearchParams): string {
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/**
 * Updates query params reliably even when Next.js App Router is stale
 * after a tab was inactive (router.push may silently no-op).
 */
export function navigateWithQueryParams(
  pathname: string,
  updates: QueryUpdates,
  router: AppRouterInstance,
  options?: { scroll?: boolean },
): void {
  const params = applyQueryUpdates(new URLSearchParams(window.location.search), updates);
  const url = buildQueryUrl(pathname, params);
  const currentUrl = window.location.pathname + window.location.search;

  if (currentUrl === url) {
    return;
  }

  // pushState always updates the address bar; refresh re-syncs useSearchParams / RSC.
  window.history.pushState(null, '', url);
  router.refresh();

  if (options?.scroll !== false) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
