import {
  buildPassengerCarListingMetadata,
  PassengerCarListingPage,
} from '../../PassengerCarListingPage';

type Props = {
  params: Promise<{ brand: string; model: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props) {
  const { brand, model } = await params;
  const resolvedSearchParams = await searchParams;
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1);
  return buildPassengerCarListingMetadata(brand, model, page);
}

export default async function Page({ params, searchParams }: Props) {
  const { brand, model } = await params;

  return (
    <PassengerCarListingPage
      brandSlug={brand}
      modelSlug={model}
      searchParams={searchParams}
    />
  );
}
