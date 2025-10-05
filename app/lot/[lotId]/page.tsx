// app/lot/[lotId]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Lot } from '../../../types';
import LotDetailsClient from './LotDetailsClient';

// --- SEO ОПТИМИЗАЦИЯ: Компонент для структурированных данных JSON-LD ---
// Этот скрипт помогает Яндексу и Google точно понять, что продается на странице.
function JsonLd({ lot }: { lot: Lot }) {
  const price = lot.startPrice ?? 0;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": lot.description,
    "description": `Лот на торгах по банкротству: ${lot.description}. Начальная цена: ${price.toLocaleString('ru-RU')} ₽.`,
    "image": lot.imageUrl || 'https://s-lot.ru/placeholder.png',
    "offers": {
      "@type": "Offer",
      "price": price,
      "priceCurrency": "RUB",
      "availability": "https://schema.org/InStock", // Товар доступен для торгов
      "url": `https://s-lot.ru/lot/${lot.id}`
    },
    "brand": {
      "@type": "Organization",
      "name": "s-lot.ru"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

type Props = {
  params: Promise<{ lotId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Функция для получения данных лота по ID
async function getLotData(lotId: string): Promise<Lot | null> {
  const apiUrl = process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL;
  const url = `${apiUrl}/api/lots/${lotId}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok)
      return null;

    return res.json();
  } catch (error) {
    console.error(`Не удалось загрузить данные для лота ${lotId}:`, error);
    return null;
  }
}

// ГЕНЕРАЦИЯ МЕТАДАННЫХ
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lotId } = await params;
  const lot = await getLotData(lotId);

  if (!lot) {
    return {
      title: 'Лот не найден',
      description: 'К сожалению, данный лот не был найден.',
    };
  }

  // Формируем заголовок и описание, богатые ключевыми словами
  const title = `Купить: ${lot.description.substring(0, 70)}... | Торги по банкротству s-lot.ru`;
  const price = lot.startPrice ?? 0;
  const description = `Лот на торгах: ${lot.description}. Начальная цена: ${price.toLocaleString('ru-RU')} ₽. Местоположение: ${lot.region || 'Московская область'}. Участие в торгах с s-lot.ru.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://s-lot.ru/lot/${lot.id}`,
    },
    openGraph: {
      title,
      description,
      url: `https://s-lot.ru/lot/${lot.id}`,
      siteName: 's-lot.ru',
      images: [{ url: lot.imageUrl || '/placeholder.png' }],
      locale: 'ru_RU',
      type: 'website',
    },
  };
}

export default async function Page({ params }: Props) {
  const { lotId } = await params;
  const lot = await getLotData(lotId);

  if (!lot) {
    notFound();
  }

  return (
    <>
      {/* Вставляем скрипт с микроразметкой в начало страницы */}
      <JsonLd lot={lot} />

      {/* Клиентский компонент для отображения лота */}
      <LotDetailsClient lot={lot} />
    </>
  );
}