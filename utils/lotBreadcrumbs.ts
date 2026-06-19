import { Lot } from '@/types';
import { generateSlug } from '@/utils/slugify';

export type BreadcrumbCrumb = {
  label: string;
  href: string;
};

export const PASSENGER_CAR_CATEGORY = 'Легковой автомобиль';

function joinUrl(baseUrl: string, path: string): string {
  if (!baseUrl) return path;
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

export function buildLotListPath(categories: string[], attrs: Record<string, string> = {}): string {
  const params = new URLSearchParams();
  categories.forEach((category) => params.append('categories', category));
  Object.entries(attrs).forEach(([key, value]) => {
    if (value) params.set(`attr_${key}`, value);
  });

  const query = params.toString();
  return query ? `/?${query}` : '/';
}

function isPassengerCarLot(lot: Lot): boolean {
  return lot.categories?.some((category) => category.name === PASSENGER_CAR_CATEGORY) ?? false;
}

export function getLotPagePath(lot: Lot): string {
  const slug = lot.slug ?? generateSlug(lot.title || lot.description);
  return lot.publicId ? `/lot/${slug}-${lot.publicId}` : `/lot/${lot.id}`;
}

function getLotPageLabel(lot: Lot): string {
  if (lot.title) return lot.title;

  const maxLength = 50;
  if (lot.description.length <= maxLength) return lot.description;
  return `${lot.description.substring(0, maxLength)}...`;
}

export function buildLotBreadcrumbs(lot: Lot, baseUrl = ''): BreadcrumbCrumb[] {
  const lotPagePath = getLotPagePath(lot);
  const lotPageLabel = getLotPageLabel(lot);

  const crumbs: BreadcrumbCrumb[] = [
    { label: 'Главная', href: joinUrl(baseUrl, '/') },
  ];

  if (isPassengerCarLot(lot)) {
    const brand = lot.attributes?.brand;
    const model = lot.attributes?.model;

    crumbs.push({
      label: PASSENGER_CAR_CATEGORY,
      href: joinUrl(baseUrl, buildLotListPath([PASSENGER_CAR_CATEGORY])),
    });

    if (brand) {
      crumbs.push({
        label: brand,
        href: joinUrl(baseUrl, buildLotListPath([PASSENGER_CAR_CATEGORY], { brand })),
      });
    }

    if (brand && model) {
      crumbs.push({
        label: model,
        href: joinUrl(baseUrl, buildLotListPath([PASSENGER_CAR_CATEGORY], { brand, model })),
      });
    }

    crumbs.push({ label: lotPageLabel, href: joinUrl(baseUrl, lotPagePath) });
    return crumbs;
  }

  crumbs.push({ label: lotPageLabel, href: joinUrl(baseUrl, lotPagePath) });
  return crumbs;
}
