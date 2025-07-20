import { DataTypes, Model, HasManyCreateAssociationMixin } from 'sequelize';
import { sequelize } from '../lib/db';
import { LotCategory } from './LotCategory';

export class Lot extends Model {
  public Id!: string;
  public Url!: string;
  public StartPrice!: string;
  public Step!: string;
  public Deposit!: string;
  public Description!: string;
  public ViewingProcedure!: string;

  public categories?: LotCategory[];
}

Lot.init(
  {
    Id: { type: DataTypes.STRING, primaryKey: true },
    Url: DataTypes.STRING,
    StartPrice: DataTypes.STRING,
    Step: DataTypes.STRING,
    Deposit: DataTypes.STRING,
    Description: DataTypes.STRING,
    ViewingProcedure: DataTypes.STRING,
  },
  {
    tableName: 'Lots',
    sequelize,
    timestamps: false,
  }
);
