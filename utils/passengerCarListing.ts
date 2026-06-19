import { Lot } from '@/types';
import { PAGE_SIZE } from '@/app/data/constants';
import { PASSENGER_CAR_CATEGORY } from '@/utils/vehiclePaths';

export type PassengerCarListingResult = {
  items: Lot[];
  totalCount: number;
  totalPages: number;
  page: number;
};

export async function fetchPassengerCarLots(options: {
  brand?: string;
  model?: string;
  page?: number;
  pageSize?: number;
  searchParams?: Record<string, string>;
}): Promise<PassengerCarListingResult> {
  const apiUrl = process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL;
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? PAGE_SIZE;

  if (!apiUrl) {
    return { items: [], totalCount: 0, totalPages: 0, page };
  }

  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  params.append('categories', PASSENGER_CAR_CATEGORY);

  if (options.brand) {
    params.set('attr_brand', options.brand);
  }

  if (options.model) {
    params.set('attr_model', options.model);
  }

  Object.entries(options.searchParams ?? {}).forEach(([key, value]) => {
    if (!value || key === 'page') return;
    params.set(key, value);
  });

  try {
    const res = await fetch(`${apiUrl}/api/lots/list?${params.toString()}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return { items: [], totalCount: 0, totalPages: 0, page };
    }

    const data = await res.json();
    return {
      items: data.items ?? [],
      totalCount: data.totalCount ?? 0,
      totalPages: data.totalPages ?? 0,
      page,
    };
  } catch {
    return { items: [], totalCount: 0, totalPages: 0, page };
  }
}
