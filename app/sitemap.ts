import { MetadataRoute } from 'next';
import { generateSlug } from '../utils/slugify';

const BASE_URL = 'https://s-lot.ru';

// Генерируем список sitemap-файлов (id: 0, id: 1 ...)
export async function generateSitemaps() {
  // В идеале сделать запрос к API, чтобы узнать общее кол-во (count), 
  // но можно просто вернуть диапазон, так как знаем примерное число.
  // Для 50000 лотов и размера чанка 25000 нужно 2 части.
  return [{ id: 0 }, { id: 1 }, { id: 2 }]; 
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  // Для id=0 (первый чанк) можно добавить статические страницы
  const staticRoutes: MetadataRoute.Sitemap = [];
  if (id === 0) {
      staticRoutes.push({ // можно добавить другие статические страницы
          url: BASE_URL,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: 1,
      });
  }

  // Запрашиваем чанк данных из API
  const pageSize = 25000; // Безопасный размер (меньше лимита 50к)
  const page = Number(id) + 1; // API ожидает page начиная с 1
  
  const apiUrl = process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL;
  if (!apiUrl)
    return staticRoutes;

  try {
    const res = await fetch(`${apiUrl}/api/lots/sitemap-data?page=${page}&pageSize=${pageSize}`, { 
        next: { revalidate: 3600 } // Кэшируем на час
    });
    
    if (!res.ok)
      return staticRoutes;

    const lots: any[] = await res.json();

    if (!lots || lots.length === 0) {
        console.warn(`Warning: No lots found for page ${page} (sitemap id ${id})`);
    }

    const lotRoutes = lots.map((lot) => {
        // Формируем slugify ссылку
        const slug = generateSlug(lot.title);
        const url = `${BASE_URL}/lot/${slug}-${lot.publicId}`;
        
        return {
            url: url,
            lastModified: new Date(),  // new Date(lot.createdAt) когда будут даты
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        };
    });

    return [...staticRoutes, ...lotRoutes];

  } catch (error) {
    console.error(`Sitemap error for id ${id}:`, error);
    return staticRoutes;
  }
}
