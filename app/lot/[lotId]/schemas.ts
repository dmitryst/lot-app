// app/lot/[lotId]/schemas.ts
// Модуль для генерации JSON-LD схем для SEO оптимизации

import { Lot } from '../../../types';
import { generateSlug } from '../../../utils/slugify';

const BASE_URL = 'https://s-lot.ru';

/**
 * Генерирует правильный URL лота с slug
 */
export function generateLotUrl(lot: Lot, baseUrl: string = BASE_URL): string {
  const slug = generateSlug(lot.title || lot.description);
  return lot.publicId 
    ? `${baseUrl}/lot/${slug}-${lot.publicId}`
    : `${baseUrl}/lot/${lot.id}`;
}

/**
 * Очищает объект от undefined полей перед сериализацией
 */
function cleanSchema(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(cleanSchema);
  }
  if (obj !== null && typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanSchema(value);
      }
    }
    return cleaned;
  }
  return obj;
}

/**
 * Генерирует Product schema для лота
 */
function generateProductSchema(lot: Lot): any {
  const price = lot.startPrice ?? 0;
  const lotUrl = generateLotUrl(lot);
  const images = lot.images && lot.images.length > 0 
    ? lot.images.map(img => img.startsWith('http') ? img : `${BASE_URL}${img}`)
    : [lot.imageUrl || `${BASE_URL}/placeholder.png`];

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": lot.title || lot.description.substring(0, 100),
    "description": lot.description,
    "image": images,
    "category": lot.categories?.[0]?.name || "Имущество банкротов",
    "brand": {
      "@type": "Organization",
      "name": "s-lot.ru",
      "url": BASE_URL
    },
    "offers": {
      "@type": "Offer",
      "price": price,
      "priceCurrency": "RUB",
      "availability": "https://schema.org/InStock",
      "url": lotUrl,
      "priceValidUntil": lot.bidding?.tradePeriod || undefined,
      "seller": {
        "@type": "Organization",
        "name": lot.bidding?.platform || "Торговая площадка"
      }
    },
    "aggregateRating": lot.marketValue ? {
      "@type": "AggregateRating",
      "ratingValue": lot.priceConfidence === 'high' ? 5 : lot.priceConfidence === 'medium' ? 4 : 3,
      "reviewCount": 1,
      "bestRating": 5,
      "worstRating": 1
    } : undefined
  };
}

/**
 * Генерирует BreadcrumbList schema
 */
function generateBreadcrumbSchema(lot: Lot): any {
  const lotUrl = generateLotUrl(lot);
  const slug = generateSlug(lot.title || lot.description);
  
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Главная",
        "item": BASE_URL
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": lot.categories?.[0]?.name || "Лоты",
        "item": `${BASE_URL}/?category=${lot.categories?.[0]?.id || ''}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": lot.title || lot.description.substring(0, 50),
        "item": lotUrl
      }
    ]
  };
}

/**
 * Генерирует Event schema для торгов
 */
function generateEventSchema(lot: Lot): any | null {
  if (!lot.bidding?.tradePeriod) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": `Торги по лоту: ${lot.title || lot.description.substring(0, 50)}`,
    "description": `Аукцион по реализации имущества банкротов. ${lot.bidding?.type || 'Торги'}`,
    "startDate": lot.bidding?.bidAcceptancePeriod || undefined,
    "endDate": lot.bidding?.tradePeriod || undefined,
    "location": {
      "@type": "Place",
      "name": lot.bidding?.platform || "Электронная торговая площадка"
    },
    "organizer": lot.bidding?.arbitrationManager ? {
      "@type": "Organization",
      "name": lot.bidding.arbitrationManager.name
    } : undefined
  };
}

/**
 * Генерирует FAQPage schema
 */
function generateFAQSchema(lot: Lot): any {
  const price = lot.startPrice ?? 0;
  const formattedPrice = price.toLocaleString('ru-RU');

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Как участвовать в торгах по банкротству?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Для участия в торгах необходимо ознакомиться с имуществом, внести задаток на специальный счет торговой площадки и подать заявку через электронную площадку. Подробная инструкция доступна на странице лота."
        }
      },
      {
        "@type": "Question",
        "name": "Какая начальная цена лота?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Начальная цена данного лота составляет ${formattedPrice} рублей.`
        }
      },
      {
        "@type": "Question",
        "name": "Когда проходят торги?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": lot.bidding?.tradePeriod 
            ? `Период торгов: ${lot.bidding.tradePeriod}. Прием заявок: ${lot.bidding.bidAcceptancePeriod || 'уточняйте на площадке'}.`
            : "Информация о датах торгов указана на странице лота."
        }
      }
    ]
  };
}

/**
 * Генерирует все JSON-LD схемы для лота
 * @returns Массив очищенных схем (без undefined полей)
 */
export function generateLotSchemas(lot: Lot): any[] {
  const schemas = [
    generateProductSchema(lot),
    generateBreadcrumbSchema(lot),
    generateFAQSchema(lot),
    generateEventSchema(lot)
  ].filter(Boolean); // Удаляем null значения

  return schemas.map(cleanSchema);
}
