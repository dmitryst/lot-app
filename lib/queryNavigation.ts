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

export function readQueryStringFromWindow(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return new URLSearchParams(window.location.search).toString();
}

/**
 * Updates query params via History API and returns the new query string.
 * Does not rely on Next.js router — useSearchParams() may stay stale after pushState.
 */
export function navigateWithQueryParams(
  pathname: string,
  updates: QueryUpdates,
  options?: { scroll?: boolean },
): string {
  const params = applyQueryUpdates(new URLSearchParams(window.location.search), updates);
  const url = buildQueryUrl(pathname, params);
  const currentUrl = window.location.pathname + window.location.search;

  if (currentUrl === url) {
    return params.toString();
  }

  window.history.pushState(null, '', url);

  if (options?.scroll !== false) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return params.toString();
}
