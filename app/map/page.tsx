'use client';

import { useState, useEffect } from 'react';
import { Map, Placemark, Clusterer } from '@pbe/react-yandex-maps';
import styles from './map.module.css';

interface GeoLot {
    id: string;
    title: string;
    startPrice: number;
    latitude: number;
    longitude: number;
}

export default function MapPage() {
    const [lots, setLots] = useState<GeoLot[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGeoLots = async () => {
            setLoading(true);
            const apiUrl = `${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/lots/with-coordinates`;

            try {
                const res = await fetch(apiUrl);
                if (!res.ok) throw new Error('Не удалось загрузить лоты для карты');
                const data: GeoLot[] = await res.json();
                setLots(data);
            } catch (error) {
                console.error("Ошибка при загрузке лотов:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGeoLots();
    }, []);

    return (
        <div className={styles.mapContainer}>
            {loading && <div className={styles.loader}>Загрузка карты и объектов...</div>}
            <Map
                defaultState={{
                    center: [55.751574, 37.573856],
                    zoom: 9,
                }}
                width="100%"
                height="100%"
            >
                <Clusterer
                    options={{
                        preset: 'islands#invertedBlueClusterIcons', // Используем готовый пресет для синих кластеров
                        groupByCoordinates: false, // Группируем по координатам, а не по индексам
                    }}
                >
                    {lots.map(lot => (
                        <Placemark
                            key={lot.id}
                            geometry={[lot.latitude, lot.longitude]}
                            modules={['geoObject.addon.balloon', 'geoObject.addon.hint']}
                            properties={{
                                // Используем поля из интерфейса GeoLot
                                balloonContentBody: `
                <strong>${lot.title}</strong>
                <br/>
                Начальная цена: ${new Intl.NumberFormat('ru-RU').format(lot.startPrice)} ₽
                <br/>
                <a href="/lot/${lot.id}" target="_blank">Подробнее</a>
              `,
                                hintContent: lot.title,
                            }}
                            options={{
                                preset: 'islands#blueDotIcon'
                            }}
                        />
                    ))}
                </Clusterer>
            </Map>
        </div>
    );
}
