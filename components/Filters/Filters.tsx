// components/Filters/Filters.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import debounce from 'lodash.debounce';
import { BIDDING_TYPES, CATEGORIES_TREE, DEBOUNCE_DELAY } from '@/app/data/constants';
import CategorySelect from '@/components/CategorySelect';
import styles from './Filters.module.css';

interface FiltersProps {
    categories: string[];
    biddingType: string;
    priceFrom: string;
    priceTo: string;
    searchQuery: string;
    onUpdate: (updates: Record<string, any>) => void;
}

export default function Filters({
    categories,
    biddingType,
    priceFrom,
    priceTo,
    searchQuery,
    onUpdate,
}: FiltersProps) {
    // Локальное состояние для инпутов (чтобы ввод не тормозил)
    const [localSearch, setLocalSearch] = useState(searchQuery);
    const [localPriceFrom, setLocalPriceFrom] = useState(priceFrom);
    const [localPriceTo, setLocalPriceTo] = useState(priceTo);

    // Синхронизация локального стейта с пропсами (если URL изменился извне, например Back/Forward)
    useEffect(() => {
        setLocalSearch(searchQuery);
        setLocalPriceFrom(formatNumber(priceFrom));
        setLocalPriceTo(formatNumber(priceTo));
    }, [searchQuery, priceFrom, priceTo]);

    // --- Debounced Updaters ---

    // Дебаунс для поиска
    const debouncedSearchUpdate = useMemo(
        () =>
            debounce((val: string) => {
                onUpdate({ searchQuery: val, page: 1 });
            }, DEBOUNCE_DELAY),
        [onUpdate]
    );

    // Дебаунс для цены
    const debouncedPriceUpdate = useMemo(
        () =>
            debounce((from: string, to: string) => {
                onUpdate({
                    priceFrom: from,    // Сюда приходят уже чистые числа - 1000, а не 1 000
                    priceTo: to,
                    page: 1,
                });
            }, DEBOUNCE_DELAY),
        [onUpdate]
    );

    // --- Handlers ---

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalSearch(val);
        debouncedSearchUpdate(val);
    };

    const handlePriceFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Получаем сырое значение (удаляем пробелы и все лишнее)
        const rawValue = e.target.value.replace(/\D/g, '');

        // Форматируем для отображения в инпуте (1 000)
        const formattedValue = formatNumber(rawValue);
        setLocalPriceFrom(formattedValue);

        // В дебаунс отправляем СЫРОЕ значение текущего поля
        // и СЫРОЕ значение соседнего поля (очищаем localPriceTo от пробелов)
        const rawPriceTo = localPriceTo.replace(/\D/g, '');
        debouncedPriceUpdate(rawValue, rawPriceTo);
    };

    const handlePriceToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, '');

        const formattedValue = formatNumber(rawValue);
        setLocalPriceTo(formattedValue);

        const rawPriceFrom = localPriceFrom.replace(/\D/g, '');
        debouncedPriceUpdate(rawPriceFrom, rawValue);
    };

    const handleBiddingTypeClick = (type: string) => {
        // Для кнопок дебаунс не нужен, обновляем сразу
        onUpdate({ biddingType: type, page: 1 });
    };

    const handleCategoryChange = useCallback((newSelected: string[]) => {
        onUpdate({ categories: newSelected, page: 1 });
    }, [onUpdate]);

    const formatNumber = (value: string) => {
        if (value === null || value === undefined || value === '')
            return '';
        const strVal = String(value); // Приводим к строке на всякий случай
        // Удаляем все нечисловые символы
        const cleanValue = strVal.replace(/\D/g, '');
        // Добавляем пробелы каждые 3 цифры
        return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };

    return (
        <div className={styles.filtersWrapper}>

            {/* Поиск */}
            <div className={`${styles.filterGroup} ${styles.searchArea}`}>
                <label className={styles.filterLabel}>Поиск по словам</label>
                <input
                    type="text"
                    className={styles.priceInput}
                    placeholder="Например: квартира в Москве"
                    value={localSearch}
                    onChange={handleSearchChange}
                />
            </div>

            {/* Категории */}
            <div className={`${styles.filterGroup} ${styles.categoriesArea}`}>
                <label className={styles.filterLabel}>Категории</label>
                <CategorySelect
                    categories={CATEGORIES_TREE}
                    selectedCategories={categories}
                    onChange={handleCategoryChange}
                />
            </div>

            {/* Вид торгов */}
            <div className={`${styles.filterGroup} ${styles.typeArea}`}>
                <label className={styles.filterLabel}>Вид торгов</label>
                <div className={styles.filterOptions}>
                    <button
                        onClick={() => handleBiddingTypeClick('Все')}
                        className={biddingType === 'Все' ? styles.activeFilter : styles.filterButton}
                    >
                        Все
                    </button>
                    {BIDDING_TYPES.map((type) => (
                        <button
                            key={type}
                            onClick={() => handleBiddingTypeClick(type)}
                            className={biddingType === type ? styles.activeFilter : styles.filterButton}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Цена */}
            <div className={`${styles.filterGroup} ${styles.priceArea}`}>
                <label className={styles.filterLabel}>Начальная цена, ₽</label>
                <div className={styles.priceFilterInputs}>
                    <input
                        type="text"
                        className={styles.priceInput}
                        placeholder="От"
                        value={localPriceFrom}
                        onChange={handlePriceFromChange}
                    />
                    <span className={styles.priceSeparator}>—</span>
                    <input
                        type="text"
                        className={styles.priceInput}
                        placeholder="До"
                        value={localPriceTo}
                        onChange={handlePriceToChange}
                    />
                </div>
            </div>
        </div>
    );
}
