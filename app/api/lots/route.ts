import { NextResponse } from 'next/server';
import { sequelize } from '@/lib/db';
import { Lot } from '@/models/Lot';
import { LotCategory } from '@/models/LotCategory';

export async function GET() {
  try {
    await sequelize.authenticate();

    const lots = await Lot.findAll({
      include: [{ model: LotCategory, as: 'categories' }],
    });

    return NextResponse.json(lots);
  } catch (error) {
    console.error('Ошибка загрузки лотов:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
