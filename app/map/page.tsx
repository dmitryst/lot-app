// Файл: app/map/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { Map, Placemark, Clusterer } from '@pbe/react-yandex-maps';
import styles from './map.module.css';
import { CATEGORIES_TREE } from '../data/constants';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Находим узел "Недвижимость" и получаем его дочерние категории
const realEstateNode = CATEGORIES_TREE.find(node => node.name === 'Недвижимость');
const PROPERTY_CATEGORIES = realEstateNode?.children?.map(child => child.name) || [];

interface GeoLot {
    id: string;
    title: string;
    startPrice: number;
    latitude: number;
    longitude: number;
}

export default function MapPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [showPaywall, setShowPaywall] = useState(false);
    const [accessInfo, setAccessInfo] = useState({ hasFullAccess: false, totalCount: 0 });

    const [lots, setLots] = useState<GeoLot[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    // Обработчик изменения фильтров
    const handleCategoryToggle = (category: string) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    useEffect(() => {
        const fetchGeoLots = async () => {
            setLoading(true);

            const params = new URLSearchParams();
            selectedCategories.forEach(cat => params.append('categories', cat));

            const queryString = params.toString();
            const apiUrl = `${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/lots/with-coordinates?${queryString}`;

            try {
                const res = await fetch(apiUrl, {credentials: 'include'}); // Важно для отправки cookie
                if (res.status === 401) {
                    router.push('/login');
                    return;
                }
                if (!res.ok) {
                    throw new Error(`Ошибка сервера: ${res.status}`);
                }

                const data = await res.json();

                setLots(data.lots);
                setAccessInfo({ hasFullAccess: data.hasFullAccess, totalCount: data.totalCount });
            } catch (error) {
                console.error("Ошибка при загрузке лотов:", error);
                setLots([]);
            } finally {
                setLoading(false);
            }
        };

        fetchGeoLots();
    }, [selectedCategories, router]);

    return (
        <div className={styles.mapContainer}>
            {/* фильтры */}
            <div className={styles.filterBar}>
                {PROPERTY_CATEGORIES.map(category => (
                    <button
                        key={category}
                        onClick={() => handleCategoryToggle(category)}
                        className={`${styles.filterButton} ${selectedCategories.includes(category) ? styles.active : ''}`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* баннер-уведомление */}
            {!loading && !accessInfo.hasFullAccess && (
                <div className={styles.promoBanner}>
                    Отображается {lots.length} из {accessInfo.totalCount} объектов. 
                    Для полного доступа <Link href="/subscribe">оформите подписку</Link>.
                </div>
            )}

            {/* карта */}
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
                                    <div>
                                        <strong>${lot.title}</strong>
                                        <br/>
                                        Начальная цена: ${new Intl.NumberFormat('ru-RU').format(lot.startPrice)} ₽
                                        <br/>
                                        <a href="/lot/${lot.id}" target="_blank">Подробнее</a>
                                    </div>
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
