type BiddingInfo = {
  Type: string;
  ViewingProcedure?: string;
};

export type Lot = {
  Id: string;
  Url?: string;
  StartPrice: string | null;
  Description: string;
  Step: string | null;
  Deposit: string | null;
  isFavorite: boolean;
  Bidding: BiddingInfo;
  categories: {
    Id: number;
    Name: string;
  }[];
};
