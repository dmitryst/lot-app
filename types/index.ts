type BiddingInfo = {
  type: string;
  viewingProcedure?: string;
};

export type Lot = {
  id: string;
  url?: string;
  startPrice: string | null;
  description: string;
  step: string | null;
  deposit: string | null;
  isFavorite: boolean;
  bidding: BiddingInfo;
  categories: {
    id: number;
    name: string;
  }[];
};
