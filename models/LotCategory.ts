import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../lib/db';
import { Lot } from './Lot';

export class LotCategory extends Model {
  public Id!: number;
  public Name!: string;
  public LotId!: string;
}

LotCategory.init(
  {
    Id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    LotId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Lots',
        key: 'Id',
      },
    },
  },
  {
    sequelize,
    modelName: 'LotCategory',
    tableName: 'LotCategories',
    timestamps: false,
  }
);
