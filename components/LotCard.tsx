'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './LotCard.module.css';
import { Lot } from '../types';
import { formatMoney } from '../utils/format';

// Импортируем картинку как статический ресурс.
// Путь указывается относительно текущего файла.
import placeholderImage from '../public/placeholder.png';

function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(true);
    useEffect(() => {
        const handler = () => setIsDesktop(window.innerWidth >= 900);
        handler();
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);
    return isDesktop;
}

// --- ИКОНКИ ---
const IconArrowUp = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5" /><path d="m5 12 7-7 7 7" />
    </svg>
);
const IconArrowDown = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14" /><path d="m19 12-7 7-7-7" />
    </svg>
);
const PublishIcon = ({ status }: { status: 'idle' | 'loading' | 'success' | 'error' }) => {
    if (status === 'success') {
        return ( // Галочка при успехе
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#28a745" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
        );
    }
    if (status === 'loading') {
        return ( // Иконка загрузки (крутящаяся стрелка)
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader-2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
        );
    }
    if (status === 'error') {
        return ( // Крестик при ошибке
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-circle"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
        );
    }
    return ( // Облако для стандартного состояния
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload-cloud"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M12 12v6" /><path d="m15 15-3 3-3-3" /></svg>
    );
};

// --- ПРОПСЫ КОМПОНЕНТА ---
interface LotCardProps {
    lot: Lot;
    imageUrl?: string | null;
}

export default function LotCard({ lot, imageUrl }: LotCardProps) {
    //console.log('Lot structure:', lot);

    // Состояние для отслеживания статуса копирования
    const [publishStatus, setPublishStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const isPublishButtonEnabled = process.env.NEXT_PUBLIC_FEATURE_PUBLISH_BUTTON_ENABLED === 'true';

    // стейт для раскрытия инвест-блока
    const [isInvestmentExpanded, setIsInvestmentExpanded] = useState(false);

    const isDesktop = useIsDesktop();

    // Обработчик нажатия на кнопку "Опубликовать"
    const handlePublishToProd = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (publishStatus === 'loading' || publishStatus === 'success') {
            // Если уже идет загрузка или успешно, игнорируем повторные нажатия
            return;
        }

        setPublishStatus('loading'); // Устанавливаем статус загрузки

        try {
            const apiUrl = process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL;

            if (!apiUrl) {
                throw new Error('URL бэкенда не настроен. Проверьте переменную NEXT_PUBLIC_CSHARP_BACKEND_URL.');
            }

            const response = await fetch(`${apiUrl}/api/lots/${lot.id}/copy-to-prod`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                // Если ответ не 2xx, значит произошла ошибка
                const errorData = await response.json();
                console.error('Ошибка при публикации лота:', errorData.message || response.statusText);
                throw new Error(errorData.message || 'Неизвестная ошибка публикации');
            }

            setPublishStatus('success'); // Успешно опубликовано

        } catch (error) {
            console.error('Ошибка сети или обработки ответа:', error);
            setPublishStatus('error');
        } finally {
            // через несколько секунд вернуть статус idle, чтобы можно было попробовать снова
            setTimeout(() => setPublishStatus('idle'), 3000);
        }
    };

    // --- Формирование изображения ---
    // Приоритет:
    // 1. Статическая карта (если есть координаты)
    // 2. Первое фото из массива lot.images
    // 3. Основное изображение (imageUrl из пропсов)
    // 4. Плейсхолдер

    let finalImageUrl: string | any = imageUrl || placeholderImage;
    let useNextImage = true;
    let objectFitMode: 'cover' | 'contain' = 'cover';

    // Проверяем координаты
    const hasCoordinates = lot.coordinates &&
        Array.isArray(lot.coordinates) &&
        lot.coordinates.length === 2 &&
        typeof lot.coordinates[0] === 'number' &&
        typeof lot.coordinates[1] === 'number';

    if (hasCoordinates) {
        const [latitude, longitude] = lot.coordinates!;
        // Формируем URL для Яндекс.Карты Static API
        finalImageUrl = `https://static-maps.yandex.ru/1.x/?pt=${longitude},${latitude},pm2bll&z=14&l=map&size=450,400`;
        useNextImage = false; // Для внешнего URL отключаем оптимизацию next/image (или настраиваем remotePatterns)
    }
    // Если координат нет, проверяем массив фотографий
    else if (lot.images && lot.images.length > 0 && lot.images[0]) {
        finalImageUrl = lot.images[0];
        useNextImage = false;
    }

    // Если в итоге используется плейсхолдер, меняем режим масштабирования
    if (finalImageUrl === placeholderImage) {
        objectFitMode = 'contain';
    }

    // Считаем взвешенную цену: 70% веса на Min (пессимизм), 30% на Max
    let displayPrice: number | null = null;
    if (lot.marketValueMin && lot.marketValueMax) {
        displayPrice = (lot.marketValueMin * 0.7) + (lot.marketValueMax * 0.3);
    } else if (lot.marketValueMin) {
        displayPrice = lot.marketValueMin;
    }

    // Считаем апсайд от displayPrice
    let upsidePercent: number | null = null;
    if (displayPrice && lot.startPrice && lot.startPrice > 0) {
        upsidePercent = ((displayPrice - lot.startPrice) / lot.startPrice) * 100;
    }


    const getUpsideClass = (percent: number) => {
        if (percent > 20) return styles.upsidePositive;
        if (percent < -5) return styles.upsideNegative;
        return styles.upsideNeutral;
    }

    // Цвет уверенности
    const getConfidenceClass = (conf?: string | null) => {
        switch (conf?.toLowerCase()) {
            case 'high': return styles.confidenceHigh;
            case 'medium': return styles.confidenceMedium;
            case 'low': return styles.confidenceLow;
            default: return styles.confidenceMedium; // Fallback
        }
    };

    const getConfidenceLabel = (conf?: string | null) => {
        switch (conf?.toLowerCase()) {
            case 'high': return 'Высокая точность оценки';
            case 'medium': return 'Средняя точность';
            case 'low': return 'Низкая точность (мало данных)';
            default: return 'Точность оценки';
        }
    };

    return (
        <div className={styles.lotCardContainer}>

            {/* Блок для изображения (1/3 ширины) */}
            <div className={styles.imageWrapper}>

                {/* Бейдж региона */}
                {lot.propertyRegionName && (
                    <div className={styles.regionBadge}>
                        {lot.propertyRegionName}
                    </div>
                )}

                {useNextImage ? (
                    <Image
                        src={finalImageUrl}
                        alt={`Изображение для лота: ${lot.description}`}
                        layout="fill"
                        objectFit={objectFitMode}
                        className={styles.lotImage}
                    />
                ) : (
                    <img
                        src={finalImageUrl}
                        alt={lot.title || 'Карта расположения'}
                        className={styles.lotImage}
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                )}
            </div>

            <div className={styles.contentWrapper}>

                <div className={styles.cardContent}>
                    <h3>
                        {lot.title ? lot.title : lot.description}
                    </h3>

                    {lot.publicId && (
                        <div className={styles.lotNumber}>
                            Лот № {lot.publicId}
                        </div>
                    )}

                    <p className={styles.priceDetail}>
                        Начальная цена:
                        <span className={styles.priceValue}>{formatMoney(lot.startPrice)}</span>
                        {lot.bidding.type === 'Публичное предложение' ? (
                            <span className={styles.iconDown}><IconArrowDown /></span>
                        ) : (
                            <span className={styles.iconUp}><IconArrowUp /></span>
                        )}
                    </p>

                    {/* {lot.step && (
                        <p className={styles.priceDetail}>
                            Шаг цены:
                            <span className={styles.priceValue}>{formatMoney(lot.step)}</span>
                        </p>
                    )}

                    {lot.deposit && (
                        <p className={styles.priceDetail}>
                            Задаток:
                            <span className={styles.priceValue}>{formatMoney(lot.deposit)}</span>
                        </p>
                    )} */}

                    {/* Блок рыночной оценки AI */}
                    {(displayPrice || lot.investmentSummary) && (
                        <div className={styles.priceRow}>
                            <span className={styles.priceLabel}>Оценка AI:</span>

                            {displayPrice ? (
                                <>
                                    {/* Точка уверенности (оставляем, это полезный сигнал) */}
                                    <div
                                        className={`${styles.confidenceDot} ${getConfidenceClass(lot.priceConfidence)}`}
                                        title={getConfidenceLabel(lot.priceConfidence)}
                                    />

                                    {/* Показываем одну цифру с тильдой */}
                                    <span className={styles.priceValue} style={{ fontSize: '1rem' }}>
                                        ~{formatMoney(displayPrice)}
                                    </span>

                                    {/* Апсайд теперь понятен - он от этой цифры */}
                                    {upsidePercent !== null && (
                                        <span className={`${styles.upsideBadge} ${getUpsideClass(upsidePercent)}`}>
                                            {upsidePercent > 0 ? '+' : ''}{upsidePercent.toFixed(0)}%
                                        </span>
                                    )}
                                </>
                            ) : (
                                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Нет оценки</span>
                            )}

                            {/* Кнопка раскрытия */}
                            {lot.investmentSummary && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsInvestmentExpanded(!isInvestmentExpanded);
                                    }}
                                    className={styles.expandButton}
                                    title={isInvestmentExpanded ? "Скрыть детали" : "Показать детали оценки"}
                                    aria-label={isInvestmentExpanded ? "Скрыть детали" : "Показать детали оценки"}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"/>
                                        <path d="M12 16v-4"/>
                                        <path d="M12 8h.01"/>
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Раскрывающийся текст анализа */}
                    {lot.investmentSummary && isInvestmentExpanded && (
                        <div className={styles.investmentSummary}>
                            {lot.investmentSummary}
                        </div>
                    )}

                    {isDesktop && lot.categories && lot.categories.length > 0 && (
                        <div className={styles.categoriesContainer}>
                            {lot.categories.map((cat) => (
                                <span key={cat.id} className={styles.categoryTag}>
                                    {cat.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.cardFooter}>
                    <div className={styles.actionsWrapper}>
                        {/* 
                        КНОПКА "ПОДРОБНЕЕ" ПРОСТО ВИЗУАЛЬНЫЙ ЭЛЕМЕНТ.
                        Клик по ней вызовет onNavigate родительского div.*/}
                        <div className={styles.buyButton}>Подробнее</div>

                        {/* --- КНОПКА "ОПУБЛИКОВАТЬ В PROD" --- */}
                        {isPublishButtonEnabled && (
                            <button
                                className={`${styles.publishButton} ${publishStatus !== 'idle' ? styles[publishStatus] : ''}`}
                                onClick={handlePublishToProd}
                                disabled={publishStatus === 'loading' || publishStatus === 'success'}
                            >
                                <PublishIcon status={publishStatus} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
