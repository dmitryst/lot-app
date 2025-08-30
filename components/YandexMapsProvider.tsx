// components/YandexMapsProvider.tsx

'use client';

import { YMaps } from '@pbe/react-yandex-maps';

export default function YandexMapsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY }}>
      {children}
    </YMaps>
  );
}
