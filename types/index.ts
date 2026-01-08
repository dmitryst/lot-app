type BiddingInfo = {
  type: string;
  bidAcceptancePeriod: string;
  viewingProcedure?: string;
};

export type Lot = {
  id: string;
  publicId: number;
  url?: string;
  title: string | null;
  description: string;
  startPrice: string | null;
  step: string | null;
  deposit: string | null;
  isFavorite: boolean;
  bidding: BiddingInfo;
  imageUrl: string | null;
  coordinates: [number, number] | null,
  categories: {
    id: number;
    name: string;
  }[];
};
