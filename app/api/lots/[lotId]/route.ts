import { NextResponse } from 'next/server';
import { sequelize } from '@/lib/db';
import { Lot } from '@/models/Lot';
import { LotCategory } from '@/models/LotCategory';

// Типизация параметров из URL
interface RouteParams {
  params: {
    lotId: string;
  };
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { lotId } = params;
    await sequelize.authenticate();

    // Ищем лот по его первичному ключу (Id)
    const lot = await Lot.findByPk(lotId, {
      include: [{ model: LotCategory, as: 'categories' }],
    });

    if (!lot) {
      return NextResponse.json({ error: 'Лот не найден' }, { status: 404 });
    }

    return NextResponse.json(lot);
  } catch (error) {
    console.error('Ошибка при загрузке лота:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
