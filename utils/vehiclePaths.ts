import { generateSlug } from '@/utils/slugify';

export const PASSENGER_CAR_CATEGORY = 'Легковой автомобиль';
export const PASSENGER_CAR_CATEGORY_LABEL = 'Легковые автомобили с торгов';
export const PASSENGER_CARS_BASE_PATH = '/legkovye-avtomobili';

export type VehicleFilterOptions = {
  brands: string[];
  modelsByBrand: Record<string, string[]>;
};

export function vehicleNameToSlug(name: string): string {
  return generateSlug(name);
}

export function resolveVehicleNameBySlug(slug: string, names: string[]): string | null {
  const normalizedSlug = slug.toLowerCase();

  return (
    names.find((name) => vehicleNameToSlug(name) === normalizedSlug)
    ?? names.find((name) => name.toLowerCase() === normalizedSlug)
    ?? null
  );
}

export function buildPassengerCarPath(brand?: string, model?: string): string {
  if (!brand) {
    return PASSENGER_CARS_BASE_PATH;
  }

  const brandSlug = vehicleNameToSlug(brand);
  if (!model) {
    return `${PASSENGER_CARS_BASE_PATH}/${brandSlug}`;
  }

  return `${PASSENGER_CARS_BASE_PATH}/${brandSlug}/${vehicleNameToSlug(model)}`;
}

export async function fetchVehicleFilterOptions(): Promise<VehicleFilterOptions> {
  const apiUrl = process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL;
  if (!apiUrl) {
    return { brands: [], modelsByBrand: {} };
  }

  try {
    const res = await fetch(`${apiUrl}/api/lots/vehicle-filter-options`, {
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      return { brands: [], modelsByBrand: {} };
    }

    const data = await res.json();
    return {
      brands: data.brands ?? [],
      modelsByBrand: data.modelsByBrand ?? {},
    };
  } catch {
    return { brands: [], modelsByBrand: {} };
  }
}

export function getModelsForBrand(
  brand: string,
  modelsByBrand: Record<string, string[]>,
): string[] {
  return (
    modelsByBrand[brand]
    ?? Object.entries(modelsByBrand).find(([key]) => key.toLowerCase() === brand.toLowerCase())?.[1]
    ?? []
  );
}

export async function resolvePassengerCarRoute(
  brandSlug?: string,
  modelSlug?: string,
): Promise<{
  brand?: string;
  model?: string;
  notFound: boolean;
}> {
  if (!brandSlug) {
    return { notFound: false };
  }

  const catalog = await fetchVehicleFilterOptions();
  const brand = resolveVehicleNameBySlug(brandSlug, catalog.brands);

  if (!brand) {
    return { notFound: true };
  }

  if (!modelSlug) {
    return { brand, notFound: false };
  }

  const models = getModelsForBrand(brand, catalog.modelsByBrand);
  const model = resolveVehicleNameBySlug(modelSlug, models);

  if (!model) {
    return { notFound: true };
  }

  return { brand, model, notFound: false };
}
