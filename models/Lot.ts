import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';
import { Bidding } from './Bidding';
import { LotCategory } from './LotCategory';

interface LotAttributes {
  Id: string;
  LotNumber?: string;
  StartPrice?: number;
  Step?: number;
  Deposit?: number;
  Description?: string;
  CreatedAt: Date;
  BiddingId: string;
}

export class Lot extends Model<LotAttributes> {}

Lot.init(
  {
    Id: { type: DataTypes.UUID, primaryKey: true },
    LotNumber: { type: DataTypes.TEXT },
    StartPrice: { type: DataTypes.DECIMAL },
    Step: { type: DataTypes.DECIMAL },
    Deposit: { type: DataTypes.DECIMAL },
    Description: { type: DataTypes.TEXT },
    CreatedAt: { type: DataTypes.DATE, allowNull: false },
    BiddingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Bidding',
        key: 'Id',
      },
    },
  },
  {
    sequelize,
    modelName: 'Lot',
    tableName: 'Lots',
    timestamps: false,
  }
);
