'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { LotItem } from '@/components/LotItem';
import Pagination from '@/components/Pagination';
import Filters from '@/components/Filters/Filters';
import { PAGE_SIZE } from '@/app/data/constants';
import {
  PASSENGER_CAR_CATEGORY,
  buildPassengerCarPath,
} from '@/utils/vehiclePaths';
import { Lot } from '@/types';
import { useAuth } from '@/context/AuthContext';
import styles from './listing.module.css';

type PassengerCarListingClientProps = {
  brand?: string;
  model?: string;
  initialLots: Lot[];
  initialTotalPages: number;
  initialPage: number;
  initialTotalCount: number;
};

function extractExtraSearchParams(searchParams: URLSearchParams): Record<string, string> {
  const extras: Record<string, string> = {};

  searchParams.forEach((value, key) => {
    if (key === 'page') return;
    extras[key] = value;
  });

  return extras;
}

function buildListingApiParams(options: {
  page: number;
  brand?: string;
  model?: string;
  searchParams: URLSearchParams;
}): URLSearchParams {
  const params = new URLSearchParams();
  params.set('page', String(options.page));
  params.set('pageSize', String(PAGE_SIZE));
  params.append('categories', PASSENGER_CAR_CATEGORY);

  if (options.brand) {
    params.set('attr_brand', options.brand);
  }

  if (options.model) {
    params.set('attr_model', options.model);
  }

  options.searchParams.forEach((value, key) => {
    if (key === 'page' || key === 'categories' || key === 'attr_brand' || key === 'attr_model') {
      return;
    }

    params.set(key, value);
  });

  return params;
}

export default function PassengerCarListingClient({
  brand,
  model,
  initialLots,
  initialTotalPages,
  initialPage,
  initialTotalCount,
}: PassengerCarListingClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const page = Math.max(1, Number(searchParams.get('page')) || initialPage);
  const searchParamsKey = searchParams.toString();

  const [lots, setLots] = useState(initialLots);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [loading, setLoading] = useState(false);

  const filterState = useMemo(() => {
    const dynamicFilters: Record<string, string> = {};
    if (brand) dynamicFilters.brand = brand;
    if (model) dynamicFilters.model = model;

    searchParams.forEach((value, key) => {
      if (key.startsWith('attr_')) {
        dynamicFilters[key.substring(5)] = value;
      }
    });

    return {
      categories: [PASSENGER_CAR_CATEGORY],
      biddingType: searchParams.get('biddingType') || 'Все',
      priceFrom: searchParams.get('priceFrom') || '',
      priceTo: searchParams.get('priceTo') || '',
      searchQuery: searchParams.get('searchQuery') || '',
      isSharedOwnership: searchParams.get('isSharedOwnership'),
      regions: searchParams.getAll('regions'),
      dynamicFilters,
    };
  }, [brand, model, searchParamsKey]);

  useEffect(() => {
    sessionStorage.setItem('isFromFavorites', 'false');
    sessionStorage.setItem(
      'lotListUrl',
      searchParamsKey ? `${pathname}?${searchParamsKey}` : pathname,
    );
  }, [pathname, searchParamsKey]);

  useEffect(() => {
    if (authLoading) return;

    const isInitialView = page === initialPage && searchParamsKey === '';

    // SSR-данные без cookie админа; для админа всегда подгружаем с API
    if (isInitialView && !user?.isAdmin) {
      setLots(initialLots);
      setTotalPages(initialTotalPages);
      setTotalCount(initialTotalCount);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadLots = async () => {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL;
      if (!apiUrl) {
        setLoading(false);
        return;
      }

      const params = buildListingApiParams({ page, brand, model, searchParams });

      try {
        const res = await fetch(`${apiUrl}/api/lots/list?${params.toString()}`, {
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error('Failed to load lots');
        }

        const data = await res.json();
        if (cancelled) return;

        setLots(data.items ?? []);
        setTotalPages(data.totalPages ?? 0);
        setTotalCount(data.totalCount ?? 0);
      } catch {
        if (!cancelled) {
          setLots([]);
          setTotalPages(0);
          setTotalCount(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadLots();

    return () => {
      cancelled = true;
    };
  }, [
    page,
    brand,
    model,
    initialPage,
    initialLots,
    initialTotalPages,
    initialTotalCount,
    searchParamsKey,
    searchParams,
    authLoading,
    user?.isAdmin,
  ]);

  const onPageChange = useCallback((nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) {
      params.delete('page');
    } else {
      params.set('page', String(nextPage));
    }

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const handleFiltersUpdate = useCallback((updates: Record<string, unknown>) => {
    const nextBrand = String(updates['attr_brand'] ?? updates.brand ?? brand ?? '').trim();
    const nextModel = String(updates['attr_model'] ?? updates.model ?? model ?? '').trim();
    const queryParams = new URLSearchParams();

    Object.entries(updates).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) {
        return;
      }

      if (key === 'categories' || key === 'attr_brand' || key === 'attr_model' || key === 'brand' || key === 'model' || key === 'page') {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => queryParams.append(key, String(item)));
        return;
      }

      queryParams.set(key, String(value));
    });

    const nextPath = buildPassengerCarPath(
      nextBrand || undefined,
      nextBrand && nextModel ? nextModel : undefined,
    );
    const query = queryParams.toString();
    router.push(query ? `${nextPath}?${query}` : nextPath);
  }, [brand, model, router]);

  return (
    <section className={styles.content}>
      <aside className={styles.filtersSidebar}>
        <Filters
          categories={filterState.categories}
          biddingType={filterState.biddingType}
          priceFrom={filterState.priceFrom}
          priceTo={filterState.priceTo}
          searchQuery={filterState.searchQuery}
          isSharedOwnership={filterState.isSharedOwnership}
          regions={filterState.regions}
          dynamicFilters={filterState.dynamicFilters}
          onUpdate={handleFiltersUpdate}
        />
      </aside>

      <div className={styles.results}>
        {!loading && !authLoading && totalCount > 0 && (
          <p className={styles.count}>Найдено лотов: {totalCount}</p>
        )}

        {(loading || authLoading) ? (
          <p className={styles.loadingMessage}>Загрузка лотов...</p>
        ) : lots.length > 0 ? (
          <>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />

            <div className={styles.lotsGrid}>
              {lots.map((lot) => (
                <LotItem key={lot.id} lot={lot} />
              ))}
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </>
        ) : (
          <p className={styles.emptyMessage}>По вашему запросу лотов не найдено.</p>
        )}
      </div>
    </section>
  );
}
