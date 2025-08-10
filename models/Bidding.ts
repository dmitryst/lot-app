import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';

interface BiddingAttributes {
  Id: string;
  AnnouncedAt?: Date;
  Type: string;
  BidAcceptancePeriod?: string;
  BankruptMessageId: string;
  ViewingProcedure?: string;
  CreatedAt: Date;
}

export class Bidding extends Model<BiddingAttributes> {}

Bidding.init(
  {
    Id: { type: DataTypes.UUID, primaryKey: true },
    AnnouncedAt: { type: DataTypes.DATE },
    Type: { type: DataTypes.TEXT, allowNull: false },
    BidAcceptancePeriod: { type: DataTypes.TEXT },
    BankruptMessageId: { type: DataTypes.UUID, allowNull: false },
    ViewingProcedure: { type: DataTypes.TEXT },
    CreatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    modelName: 'Bidding',
    tableName: 'Biddings',
    timestamps: false,
  }
);
