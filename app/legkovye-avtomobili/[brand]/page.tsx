import {
  buildPassengerCarListingMetadata,
  PassengerCarListingPage,
} from '../PassengerCarListingPage';

type Props = {
  params: Promise<{ brand: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props) {
  const { brand } = await params;
  const resolvedSearchParams = await searchParams;
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1);
  return buildPassengerCarListingMetadata(brand, undefined, page);
}

export default async function Page({ params, searchParams }: Props) {
  const { brand } = await params;

  return (
    <PassengerCarListingPage
      brandSlug={brand}
      searchParams={searchParams}
    />
  );
}
