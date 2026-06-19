import { Lot } from '@/types';
import { generateSlug } from '@/utils/slugify';
import {
  PASSENGER_CAR_CATEGORY,
  PASSENGER_CAR_CATEGORY_LABEL,
  buildPassengerCarPath,
} from '@/utils/vehiclePaths';

export type BreadcrumbCrumb = {
  label: string;
  href: string;
};

function joinUrl(baseUrl: string, path: string): string {
  if (!baseUrl) return path;
  return `${baseUrl.replace(/\/$/, '')}${path}`;
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

export function buildPassengerCarListingBreadcrumbs(
  options: { brand?: string; model?: string },
  baseUrl = '',
): BreadcrumbCrumb[] {
  const { brand, model } = options;

  const crumbs: BreadcrumbCrumb[] = [
    { label: 'Главная', href: joinUrl(baseUrl, '/') },
    {
      label: PASSENGER_CAR_CATEGORY_LABEL,
      href: joinUrl(baseUrl, buildPassengerCarPath()),
    },
  ];

  if (brand) {
    crumbs.push({
      label: brand,
      href: joinUrl(baseUrl, buildPassengerCarPath(brand)),
    });
  }

  if (brand && model) {
    crumbs.push({
      label: model,
      href: joinUrl(baseUrl, buildPassengerCarPath(brand, model)),
    });
  }

  return crumbs;
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
      label: PASSENGER_CAR_CATEGORY_LABEL,
      href: joinUrl(baseUrl, buildPassengerCarPath()),
    });

    if (brand) {
      crumbs.push({
        label: brand,
        href: joinUrl(baseUrl, buildPassengerCarPath(brand)),
      });
    }

    if (brand && model) {
      crumbs.push({
        label: model,
        href: joinUrl(baseUrl, buildPassengerCarPath(brand, model)),
      });
    }

    crumbs.push({ label: lotPageLabel, href: joinUrl(baseUrl, lotPagePath) });
    return crumbs;
  }

  crumbs.push({ label: lotPageLabel, href: joinUrl(baseUrl, lotPagePath) });
  return crumbs;
}

export function isPassengerCarCategoryLot(lot: Lot): boolean {
  return isPassengerCarLot(lot);
}

export { PASSENGER_CAR_CATEGORY, PASSENGER_CAR_CATEGORY_LABEL };
