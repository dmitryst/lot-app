// app/favorites/calendar/page.tsx
'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Lot } from '@/types';

// Импортируем стили макета и локальные стили календаря
import pageStyles from '../../page.module.css';
import styles from './calendar.module.css';

export default function FavoritesCalendarWrapper() {
    return (
        <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка календаря...</div>}>
            <FavoritesCalendarPage />
        </Suspense>
    );
}

function FavoritesCalendarPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [lots, setLots] = useState<Lot[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    /**
     * Парсит дату. Ищет ВСЕ даты формата ДД.ММ.ГГГГ в строке.
     * Время игнорируется, так как для календаря оно не требуется, 
     * а опечатки/скрытые символы во времени часто ломают парсинг.
     */
    const parseRussianDate = (dateStr: string): Date | null => {
        if (!dateStr) return null;

        // Ищем только паттерн ДД.ММ.ГГГГ
        const regex = /(\d{1,2})\.(\d{1,2})\.(\d{4})/g;

        let match;
        let lastDate: Date | null = null;

        // Перебираем все найденные даты, цикл остановится на самой последней
        while ((match = regex.exec(dateStr)) !== null) {
            const [_, d, m, y] = match;
            // Устанавливаем время на 00:00, для сетки календаря этого достаточно
            lastDate = new Date(Number(y), Number(m) - 1, Number(d));
        }

        return lastDate;
    };

    /**
     * Логика определения даты начала торгов:
     */
    const getLotStartDate = (lot: Lot): Date | null => {
        // 1. Публичное предложение
        if (lot.bidding?.type === "Публичное предложение") {
            const scheduleDate = lot.priceSchedules?.[0]?.startDate;
            if (!scheduleDate) return null;
            return parseRussianDate(scheduleDate) || new Date(scheduleDate);
        }

        // 2. Аукционы (берем дату из bidAcceptancePeriod)
        const period = lot.bidding?.bidAcceptancePeriod;
        if (period) {
            const parsedDate = parseRussianDate(period);

            // --- ДИАГНОСТИКА ---
            // Если дата все еще отображается неверно, раскомментируйте строку ниже,
            // откройте консоль браузера (F12) и посмотрите, что реально приходит в period:
            // console.log(`Лот ID ${lot.publicId}: period="${period}", type="${lot.bidding?.type}", parsedDate=`, parsedDate);

            if (parsedDate) {
                return parsedDate;
            }
        }

        // Резервный вариант
        return lot.createdAt ? new Date(lot.createdAt) : null;
    };

    /**
     * Извлекает цену лота в зависимости от типа торгов и возвращает отформатированную строку
     */
    const getLotPriceInfo = (lot: any) => {
        const bidding = lot.bidding || {};
        const biddingType = bidding.type;
        const isPublicOffer = biddingType === "Публичное предложение";

        let rawPrice = null;

        if (isPublicOffer) {
            const schedules = lot.priceSchedules || lot.PriceSchedules;
            // Оператор ?? позволяет взять 0, если цена равна нулю, но пропустит null/undefined
            rawPrice = schedules?.[0]?.price ?? schedules?.[0]?.Price;
        } else {
            rawPrice = lot.startPrice ?? lot.StartPrice;
        }

        // Форматируем число (например: "1 500 000 ₽")
        const formattedPrice = rawPrice != null
            ? Number(rawPrice).toLocaleString('ru-RU') + ' ₽'
            : 'Цена не указана';

        return { formattedPrice, isPublicOffer };
    };

    /**
     * Форматирует заголовок: перенос строки каждые 50 символов, не более 4 строк.
     */
    const formatLotTitle = (title: string | null) => {
        if (!title) return '';
        const maxLength = 50;
        const maxLines = 4;
        const lines = [];

        for (let i = 0; i < title.length && lines.length < maxLines; i += maxLength) {
            lines.push(title.substring(i, i + maxLength));
        }

        return lines.join('\n');
    };

    const fetchFavoriteLots = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/favorites?page=1&pageSize=100`, {
                method: 'GET',
                credentials: 'include',
            });

            if (res.ok) {
                const data = await res.json();
                setLots(data.items || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push(`/login?returnUrl=/favorites/calendar`);
            return;
        }
        fetchFavoriteLots();
    }, [user, authLoading, router, fetchFavoriteLots]);

    // Параметры текущего месяца для сетки
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanksArray = Array.from({ length: startOffset }, (_, i) => i);

    const monthNames = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];

    const realToday = new Date();

    if (authLoading || loading) {
        return (
            <main className={pageStyles.main}>
                <section className={pageStyles.contentArea}>
                    <div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка избранного...</div>
                </section>
            </main>
        );
    }

    return (
        <main className={pageStyles.main}>
            <section className={pageStyles.contentArea}>
                <div className={styles.headerRow}>
                    <h1 className={styles.pageTitle}>Календарь торгов</h1>
                    <div className={styles.controls}>
                        <button
                            className={styles.navBtn}
                            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                        >
                            &larr;
                        </button>
                        <span className={styles.monthLabel}>{monthNames[month]} {year}</span>
                        <button
                            className={styles.navBtn}
                            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                        >
                            &rarr;
                        </button>
                    </div>
                </div>

                <div className={styles.calendarGrid}>
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
                        <div key={d} className={styles.weekday}>{d}</div>
                    ))}

                    {blanksArray.map(b => (
                        <div key={`blank-${b}`} className={styles.emptyCell} />
                    ))}

                    {daysArray.map(day => {
                        // Определяем, является ли этот день "сегодняшним"
                        const isToday = 
                            day === realToday.getDate() && 
                            month === realToday.getMonth() && 
                            year === realToday.getFullYear();

                        // Фильтруем лоты, дата которых совпадает с этим днем
                        const dayLots = lots.filter(lot => {
                            const d = getLotStartDate(lot);
                            return d &&
                                d.getDate() === day &&
                                d.getMonth() === month &&
                                d.getFullYear() === year;
                        });

                        return (
                            <div key={day} className={`${styles.dayCell} ${isToday ? styles.todayCell : ''}`}>

                                {/* Оборачиваем цифру в контейнер для красивого позиционирования */}
                                <div className={styles.dayNumContainer}>
                                    <span className={`${styles.dayNum} ${isToday ? styles.todayNum : ''}`}>
                                        {day}
                                    </span>
                                </div>
                                
                                <div className={styles.events}>
                                    {dayLots.map(lot => {
                                        // Получаем отформатированную цену и флаг публичного предложения
                                        const { formattedPrice, isPublicOffer } = getLotPriceInfo(lot);

                                        return (
                                            <Link href={`/lot/${lot.id}`} key={lot.id} className={styles.lotBadge}>
                                                {lot.imageUrl && (
                                                    <img src={lot.imageUrl} alt="" className={styles.lotThumb} />
                                                )}

                                                <div className={styles.lotText}>
                                                    <span className={styles.lotId}>ID: {lot.publicId}</span>
                                                    <span className={styles.lotTitle}>
                                                        {formatLotTitle(lot.title)}
                                                    </span>

                                                    {/* блок с ценой и стрелочкой */}
                                                    <div className={styles.lotPriceRow}>
                                                        <span className={styles.lotPrice}>{formattedPrice}</span>
                                                        {isPublicOffer ? (
                                                            <span className={styles.arrowDown} title="Публичное предложение (снижение цены)">↓</span>
                                                        ) : (
                                                            <span className={styles.arrowUp} title="Аукцион (повышение цены)">↑</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        </main>
    );
}