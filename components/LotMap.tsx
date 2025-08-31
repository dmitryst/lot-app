// components/LotMap.tsx

'use client';

import { Map, Placemark } from "@pbe/react-yandex-maps";

interface LotMapProps {
  coordinates: [number, number];
}

export default function LotMap({ coordinates }: LotMapProps) {
  return (
    <Map
      defaultState={{
        center: coordinates,
        zoom: 14,
        controls: [
            "zoomControl",  // Отвечает за отображение кнопок приближения и отдаления (+ / -).
            "fullscreenControl", // Добавляет кнопку, которая позволяет развернуть карту на весь экран
            // "geolocationControl", // Кнопка для определения местоположения пользователя
            // "typeSelector", // Переключатель типа карты (схема, спутник, гибрид)
            // "rulerControl" // Линейка для измерения расстояний
        ],
      }}
      modules={["control.ZoomControl", "control.FullscreenControl"]}
      width="100%"
      height="400px"
    >
      <Placemark geometry={coordinates} />
    </Map>
  );
}
