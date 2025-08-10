import { Bidding } from './Bidding';
import { Lot } from './Lot';
import { LotCategory } from './LotCategory';

// Связь "один ко многим": у одних Торгов (Bidding) может быть много Лотов (Lot)
Bidding.hasMany(Lot, { foreignKey: 'BiddingId', as: 'Lots' });
Lot.belongsTo(Bidding, { foreignKey: 'BiddingId', as: 'Bidding' });

// Связь "один ко многим": у одного Лота (Lot) может быть много Категорий (LotCategory)
Lot.hasMany(LotCategory, { foreignKey: 'LotId', as: 'categories' });
LotCategory.belongsTo(Lot, { foreignKey: 'LotId' });
