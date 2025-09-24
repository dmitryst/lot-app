// app/lot/[lotId]/page.tsx
import type { Metadata } from 'next';
import { Lot } from '../../../types';
import LotDetailsClient from './LotDetailsClient';

type Props = {
    params: { lotId: string };
    searchParams: { [key: string]: string | string[] | undefined };
};

// Функция для получения данных лота по ID
async function getLotData(lotId: string): Promise<Lot | null> {
  const apiUrl = process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL;
  if (!apiUrl)
    return null;

  try {
    const res = await fetch(`${apiUrl}/api/lots/${lotId}`, { cache: 'no-store' });

    if (!res.ok)
      return null;

    return res.json();
  } catch (error) {
    console.error("Failed to fetch lot data:", error);
    return null;
  }
}

// ГЕНЕРАЦИЯ МЕТАДАННЫХ
export async function generateMetadata({ params, searchParams  }: Props): Promise<Metadata> {
  const lot = await getLotData(params.lotId);

  if (!lot) {
    return {
      title: 'Лот не найден',
      description: 'К сожалению, данный лот не был найден.',
    };
  }

  return {
    title: `Лот: ${lot.description.substring(0, 50)}...`,
    description: `Информация по лоту: ${lot.description}. Начальная цена: ${lot.startPrice} ₽.`,
    openGraph: {
      title: `Лот: ${lot.description.substring(0, 50)}...`,
      description: `Начальная цена: ${lot.startPrice} ₽.`,
      images: [lot.imageUrl || '/placeholder.png'],
    },
  };
}

export default async function Page({ params, searchParams  }: Props) {
  // Получаем данные на сервере
  const lot = await getLotData(params.lotId);

  // Передаем данные в клиентский компонент через пропсы
  return <LotDetailsClient lot={lot} />;
}
