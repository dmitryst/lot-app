type ArbitrationManager = {
  name: string;
  inn?: string | null;
  snils?: string | null;
  ogrn?: string | null;
};

type BiddingInfo = {
  type: string;
  bidAcceptancePeriod: string;
  tradePeriod: string;
  viewingProcedure?: string;
  platform: string;
  arbitrationManager?: ArbitrationManager | null;
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
  propertyRegionName?: string | null;
  marketValue?: number | null;
  marketValueMin?: number | null;
  marketValueMax?: number | null;
  priceConfidence?: string | null;
  investmentSummary?: string | null;
  categories: {
    id: number;
    name: string;
  }[];
  priceSchedules: PriceSchedule[];
  images: string[];
  documents?: LotDocument[];
};

export type LotDocument = {
  id: string;
  url: string;
  title: string;
  extension?: string | null;
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
