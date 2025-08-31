// app/api/lots/[lotId]/route.ts

import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    const segments = pathname.split('/');
    const lotId = segments[segments.length - 1];

    if (!lotId || lotId === '[lotId]') { // Доп. проверка на случай ошибки
      return NextResponse.json({ error: 'ID лота не предоставлен' }, { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL;
    if (!backendUrl) {
      console.error('URL бэкенда (NEXT_PUBLIC_CSHARP_BACKEND_URL) не настроен.');
      return NextResponse.json(
        { error: 'Внутренняя ошибка конфигурации сервера.' },
        { status: 500 }
      );
    }

    const apiUrl = `${backendUrl}/api/lots/${lotId}`;

    const apiResponse = await fetch(apiUrl, {
      // Кэшируем ответы этого API-маршрута на сервере на 1 час (3600 сек). 
      // Если за этот час придет 100 запросов на один и тот же лот, реальный запрос к
      // бэкенду будет сделан только один раз, что значительно снизит нагрузку.
      next: { revalidate: 3600 },
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return NextResponse.json(
        { error: errorData.message || 'Ошибка при запросе к бэкенду' },
        { status: apiResponse.status }
      );
    }

    const lotData = await apiResponse.json();

    return NextResponse.json(lotData);

  } catch (error) {
    console.error('Критическая ошибка в API-маршруте:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера.' },
      { status: 500 }
    );
  }
}
