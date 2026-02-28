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

enum AccessLevel {
    Anonymous = 0,
    Limited = 1,
    Full = 2,
}

interface GeoLot {
    id: string;
    title: string;
    startPrice: number;
    latitude: number;
    longitude: number;
}

interface MapLotsResponse {
    lots: GeoLot[];
    totalCount: number;
    accessLevel: AccessLevel;
}

export default function MapPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [showPaywall, setShowPaywall] = useState(false);
    const [accessInfo, setAccessInfo] = useState({ hasFullAccess: false, totalCount: 0 });

    const [mapData, setMapData] = useState<MapLotsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    const [isInfoPanelClosed, setIsInfoPanelClosed] = useState(false);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

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
                const res = await fetch(apiUrl, { credentials: 'include' }); // Важно для отправки cookie
                if (res.status === 401) {
                    router.push('/login');
                    return;
                }
                if (!res.ok) {
                    throw new Error(`Ошибка сервера: ${res.status}`);
                }

                const data: MapLotsResponse = await res.json();
                setMapData(data);
            } catch (error) {
                console.error("Ошибка при загрузке лотов:", error);
                setMapData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchGeoLots();
    }, [selectedCategories]);

    // Функция для рендеринга информационных плашек
    const renderInfoPanel = () => {
        // Если плашка закрыта пользователем, не рендерим её
        if (loading || !mapData || isInfoPanelClosed) return null;

        // Вспомогательная функция для рендера кнопки закрытия
        const renderCloseBtn = () => (
            <button
                className={styles.closeInfoPanelBtn}
                onClick={() => setIsInfoPanelClosed(true)}
                aria-label="Закрыть уведомление"
            >
                ✕
            </button>
        );

        switch (mapData.accessLevel) {
            case AccessLevel.Anonymous:
                return (
                    <div className={`${styles.infoPanel} ${styles.warning}`}>
                        <span className={styles.infoText}>
                            Вы видите только {mapData.lots.length} из {mapData.totalCount} объектов.
                            <Link href="/login?returnUrl=/map">Войдите</Link> или <Link href="/login/register?returnUrl=/map">зарегистрируйтесь</Link>, чтобы увидеть все.
                        </span>
                        {renderCloseBtn()}
                    </div>
                );

            case AccessLevel.Limited:
                return (
                    <div className={`${styles.infoPanel} ${styles.danger}`}>
                        <span className={styles.infoText}>
                            Ваша подписка неактивна. Отображено {mapData.lots.length} из {mapData.totalCount} объектов.
                            <Link href="/subscribe">Оформите подписку</Link>, чтобы получить полный доступ.
                        </span>
                        {renderCloseBtn()}
                    </div>
                );

            case AccessLevel.Full:
                // Для пользователей с полным доступом можно ничего не показывать или показать нейтральное сообщение
                return (
                    <div className={`${styles.infoPanel} ${styles.success}`}>
                        <span className={styles.infoText}>
                            PRO-доступ активен. Отображено {mapData.lots.length} объектов.
                        </span>
                        {renderCloseBtn()}
                    </div>
                );

            default:
                return null;
        }
    };

    // --- ИКОНКИ ---
    const IconArrowUp = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', color: '#28a745' }}>
            <path d="M12 19V5" /><path d="m5 12 7-7 7 7" />
        </svg>
    );

    const IconArrowDown = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', color: '#dc3545' }}>
            <path d="M12 5v14" /><path d="m19 12-7 7-7-7" />
        </svg>
    );

    // Функция генерации HTML для иконок, так как Яндекс.Карты принимают строку
    const getDirectionIconHtml = (type?: string) => {
        if (type === 'Публичное предложение' || type === 'Аукцион с понижением') {
            return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom;"><path d="M12 5v14"></path><path d="m19 12-7 7-7-7"></path></svg>`;
        }
        return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom;"><path d="M12 19V5"></path><path d="m5 12 7-7 7 7"></path></svg>`;
    };

    // Функция для сокращения заголовка для clusterCaption
    const getShortTitle = (title: string): string => {
        if (!title) return '';

        const commaIndex = title.indexOf(',');

        if (commaIndex !== -1 && commaIndex <= 25) {
            // Если запятая есть и она в пределах первых 25 символов — обрезаем до нее
            return title.substring(0, commaIndex);
        }

        // Если запятой нет или она дальше 25 символов
        const shortText = title.substring(0, 25);
        return shortText;
    };

    return (
        <div className={styles.mapContainer}>
            {/* Кнопка-иконка для мобильных экранов (появляется только на мобилках) */}
            <button
                className={styles.mobileFilterToggle}
                onClick={() => setIsMobileFiltersOpen(true)}
                aria-label="Открыть фильтры"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
            </button>

            {/* Затемнение фона при открытом меню на мобилках */}
            {isMobileFiltersOpen && (
                <div
                    className={styles.mobileOverlay}
                    onClick={() => setIsMobileFiltersOpen(false)}
                />
            )}

            {/* Объединяем фильтры и плашку для десктопа */}
            <div className={styles.topControlsContainer}>
                {/* Панель фильтров */}
                <div className={`${styles.filterBar} ${isMobileFiltersOpen ? styles.open : ''}`}>

                    {/* Шапка, которая будет видна только на мобильных устройствах */}
                    <div className={styles.mobileHeader}>
                        <h3>Категории</h3>
                        <button
                            className={styles.closeButton}
                            onClick={() => setIsMobileFiltersOpen(false)}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Контейнер для самих кнопок */}
                    <div className={styles.filterButtonsContainer}>
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
                </div>

                {/* баннер-уведомление */}
                {renderInfoPanel()}
            </div>

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
                        // Используем готовый пресет для синих кластеров
                        preset: 'islands#invertedBlueClusterIcons',
                        // Группируем объекты с одинаковыми координатами
                        groupByCoordinates: true,
                        // Отключаем зум по клику, чтобы сразу открывался список
                        clusterDisableClickZoom: true,
                        // Указываем внешний вид списка: 'cluster#balloonCarousel' (карусель) или 'cluster#balloonAccordion' (аккордеон)
                        clusterBalloonContentLayout: 'cluster#balloonAccordion',
                        // Отключаем стандартный заголовок балуна для карусели, 
                        // чтобы clusterCaption отображался только в навигации, а не дублировался над телом
                        clusterBalloonItemContentLayout: 'cluster#balloonAccordionItemContent',
                        // Ограничиваем ширину балуна карусели
                        clusterBalloonMaxWidth: 330
                    }}
                    // Подключаем модули балуна для кластера
                    modules={['clusterer.addon.balloon', 'clusterer.addon.hint']}
                >
                    {mapData?.lots.map(lot => {
                        // Форматируем цену
                        const formattedPrice = new Intl.NumberFormat('ru-RU').format(lot.startPrice) + ' ₽';
                        // HTML для стрелки направления цены
                        const arrowHtml = getDirectionIconHtml((lot as any).bidding?.type);

                        return (
                            <Placemark
                                key={lot.id}
                                geometry={[lot.latitude, lot.longitude]}
                                modules={['geoObject.addon.balloon', 'geoObject.addon.hint']}
                                properties={{
                                    // Это будет отображаться в списке сверху (навигации карусели)
                                    clusterCaption: `<strong>${getShortTitle(lot.title)}</strong>`,

                                    // Содержимое карточки (без дублирования заголовка)
                                    // Заголовок делаем ссылкой синего цвета
                                    balloonContentBody: `
                        <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.5; padding: 5px 0; overflow-x: hidden; word-break: break-word; hyphens: auto; white-space: normal;"">
                            <a href="/lot/${lot.id}" target="_blank" style="font-weight: bold; color: #0056b3; text-decoration: none; display: block; margin-bottom: 8px;">
                                ${lot.title}
                            </a>
                            <div style="color: #333; margin-bottom: 5px;">
                                Начальная цена: <strong>${formattedPrice}</strong> ${arrowHtml}
                            </div>
                        </div>
                    `,
                                    hintContent: lot.title,
                                }}
                                options={{
                                    preset: 'islands#blueDotIcon',
                                    // Ограничиваем ширину одиночного балуна
                                    balloonMaxWidth: 300
                                }}
                            />
                        );
                    })}
                </Clusterer>
            </Map>
        </div>
    );
}
