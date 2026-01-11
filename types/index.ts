type BiddingInfo = {
  type: string;
  bidAcceptancePeriod: string;
  viewingProcedure?: string;
  platform: string;
};

export type Lot = {
  id: string;
  publicId: number;
  url?: string;
  title: string | null;
  description: string;
  startPrice: number | null;
  step: number | null;
  deposit: number | null;
  isFavorite: boolean;
  bidding: BiddingInfo;
  imageUrl: string | null;
  coordinates: [number, number] | null,
  categories: {
    id: number;
    name: string;
  }[];
  priceSchedules: PriceSchedule[];
  images: string[];
};

export type PriceSchedule = {
  number: number;
  startDate: string;
  endDate: string;
  price: number | null;
  deposit: number | null;
  estimatedRank: number | null;
  potentialRoi: number | null;
};
