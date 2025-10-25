type BiddingInfo = {
  type: string;
  viewingProcedure?: string;
};

export type Lot = {
  id: string;
  url?: string;
  startPrice: string | null;
  title: string | null;
  description: string;
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
