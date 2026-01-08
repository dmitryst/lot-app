// app/lot/[lotId]/page.tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Lot } from '../../../types';
import LotDetailsClient from './LotDetailsClient';
import { CATEGORIES_TREE } from '../../data/constants'; 

// --- SEO ОПТИМИЗАЦИЯ: Компонент для структурированных данных JSON-LD ---
// Этот скрипт помогает Яндексу и Google точно понять, что продается на странице.
function JsonLd({ lot }: { lot: Lot }) {
  const price = lot.startPrice ?? 0;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": lot.title || lot.description.substring(0, 100),
    "description": lot.description,
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

// Динамическая генерация ключевых слов ---
const generateKeywords = (lot: Lot): string => {
  // Базовые ключевые слова для любой страницы
  const baseKeywords = [
    'торги по банкротству', 'аукционы по банкротству', 'имущество банкротов', 'аукцион',
    'электронные торги', 'купить на торгах', 'купить со скидкой', 'имущество должников', 's-lot.ru'
  ];

  // Ключевые слова на основе категорий
  const categoryKeywords: string[] = [];
  const lotCategory = lot.categories?.[0]; // Берем самую специфичную категорию

  if (lotCategory) {
    const categoryName = lotCategory.name.toLowerCase();
    // Добавляем запросы для конкретной категории
    categoryKeywords.push(
      `купить ${categoryName} с торгов`,
      `${categoryName} с торгов по банкротству`,
      `${categoryName} аукцион по банкротству`
    );

    // Ищем родительскую категорию и добавляем запросы для нее
    const parentCategory = CATEGORIES_TREE.find(cat => cat.children?.some(child => child.name === categoryName));
    if (parentCategory) {
      const parentCategoryName = parentCategory.name.toLowerCase();
      categoryKeywords.push(
        `купить ${parentCategoryName} с торгов`,
        `${parentCategoryName} с торгов по банкротству`,
        `${parentCategoryName} аукцион по банкротству`
      );
    }
  }

  // Ключевые слова из данных самого лота
  const lotSpecificKeywords = lot.title ? lot.title.split(' ').filter(word => word.length > 2) : [];
  // TODO: добавить КН
  // if (lot.cadastralNumber) {
  //   lotSpecificKeywords.push(lot.cadastralNumber);
  // }

  // Объединяем все, удаляем дубликаты и возвращаем строку
  const allKeywords = [...baseKeywords, ...categoryKeywords, ...lotSpecificKeywords];
  
  return [...new Set(allKeywords)].join(', ');
};

// Функция для получения данных лота по ID
async function getLotData(slugOrId: string): Promise<Lot | null> {
  const publicId = extractIdFromSlug(slugOrId);
  const apiUrl = process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL;
  const url = `${apiUrl}/api/lots/${publicId}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok)
      return null;

    return res.json();
  } catch (error) {
    console.error(`Не удалось загрузить данные для лота ${publicId}:`, error);
    return null;
  }
}

function extractIdFromSlug(slug: string): string {
  // Ищем дефис и цифры в конце строки
  const match = slug.match(/-(\d+)$/);
  if (match) {
    return match[1]; // Возвращает "45368"
  }
  return slug;
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
  const price = lot.startPrice ?? 0;
  const formattedPrice = price.toLocaleString('ru-RU').replace(/\s/g, ' ');

  const lotTitle = lot.title || lot.description.substring(0, 70);

  const title = `Купить ${lotTitle} на торгах по банкротству за ${formattedPrice} ₽ — s-lot.ru`;
  const description = `${lot.description}. Начальная цена: ${formattedPrice} ₽. Открытый аукцион по реализации имущества банкротов. Участвуйте в торгах на s-lot.ru!`;
  
  const keywords = generateKeywords(lot);

  return {
    title,
    description,
    keywords,
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