import {
  buildPassengerCarListingMetadata,
  PassengerCarListingPage,
} from './PassengerCarListingPage';

type Props = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export async function generateMetadata({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const page = Math.max(1, Number(resolvedSearchParams.page) || 1);
  return buildPassengerCarListingMetadata(undefined, undefined, page);
}

export default function Page({ searchParams }: Props) {
  return (
    <PassengerCarListingPage
      searchParams={searchParams}
    />
  );
}
