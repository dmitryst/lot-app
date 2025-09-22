import { MetadataRoute } from 'next';

async function getAllLotIds(): Promise<string[]> {
  const apiUrl = process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL;
  if (!apiUrl) return [];
  
  try {
    // Запрос к API для получения всех ID лотов
    const res = await fetch(`${apiUrl}/api/lots/all-ids`); 
    if (!res.ok) return [];
    const ids = await res.json();
    return ids;
  } catch (error) {
    console.error("Failed to fetch lot IDs for sitemap:", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://s-lot.ru';

  // Получаем все ID лотов
  const lotIds = await getAllLotIds();

  // Создаем URL для каждой страницы лота
  const lotUrls = lotIds.map((id) => ({
    url: `${baseUrl}/lot/${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    // ... другие статические страницы ...
    // { url: `${baseUrl}/about`, lastModified: new Date() },
    ...lotUrls, // Добавляем все страницы лотов
  ];
}
