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
    Id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    Name: DataTypes.STRING,
    LotId: DataTypes.STRING,
  },
  {
    tableName: 'LotCategories',
    sequelize,
    timestamps: false,
  }
);

Lot.hasMany(LotCategory, { foreignKey: 'LotId', sourceKey: 'Id', as: 'categories' });
LotCategory.belongsTo(Lot, { foreignKey: 'LotId', targetKey: 'Id' });
