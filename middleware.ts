import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  PASSENGER_CAR_CATEGORY,
  PASSENGER_CARS_BASE_PATH,
  vehicleNameToSlug,
} from '@/utils/vehiclePaths';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname !== '/') {
    return NextResponse.next();
  }

  const categories = request.nextUrl.searchParams.getAll('categories');
  if (!categories.includes(PASSENGER_CAR_CATEGORY) || categories.length !== 1) {
    return NextResponse.next();
  }

  const brand = request.nextUrl.searchParams.get('attr_brand')?.trim();
  const model = request.nextUrl.searchParams.get('attr_model')?.trim();

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = PASSENGER_CARS_BASE_PATH;

  if (brand) {
    redirectUrl.pathname += `/${vehicleNameToSlug(brand)}`;
  }

  if (brand && model) {
    redirectUrl.pathname += `/${vehicleNameToSlug(model)}`;
  }

  redirectUrl.searchParams.delete('categories');
  redirectUrl.searchParams.delete('attr_brand');
  redirectUrl.searchParams.delete('attr_model');

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: '/',
};
