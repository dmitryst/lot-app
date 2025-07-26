import { NextResponse, NextRequest } from 'next/server';
import { sequelize } from '@/lib/db';
import { Lot } from '@/models/Lot';
import { LotCategory } from '@/models/LotCategory';

export async function GET(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    // Разделяем путь по '/' (например, ['', 'api', 'lots', '123'])
    const segments = pathname.split('/');
    // Берем последний сегмент, который и является нашим ID
    const lotId = segments[segments.length - 1];

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
