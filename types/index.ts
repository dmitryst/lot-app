export type Lot = {
  Id: string;
  Url: string;
  StartPrice: string | null;
  Step: string | null;
  Deposit: string | null;
  Description: string;
  BiddingType: string;
  ViewingProcedure: string;
  categories: {
    Id: number;
    Name: string;
    LotId: string;
  }[];
};