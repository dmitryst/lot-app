import { NextResponse } from 'next/server';
import { sequelize } from '@/lib/db';
import { Lot } from '@/models/Lot';
import { Bidding } from '@/models/Bidding';
import { LotCategory } from '@/models/LotCategory';
import '@/models/associations';

export async function GET() {
  try {
    await sequelize.authenticate();

    const lots = await Lot.findAll({
      include: [
        // Подключаем связанные данные из Biddings
        {
          model: Bidding,
          as: 'Bidding', // Используем алиас, заданный в модели
          attributes: ['Type', 'ViewingProcedure'], // Забираем только нужные поля
        },
        // Подключаем категории
        {
          model: LotCategory,
          as: 'categories',
          attributes: ['Id', 'Name'],
        },
      ],
      order: [['CreatedAt', 'DESC']],
    });

    return NextResponse.json(lots);
  } catch (error) {
    console.error('Ошибка загрузки лотов:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
