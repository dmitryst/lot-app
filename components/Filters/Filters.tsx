// components/Filters/Filters.tsx
'use client';

import { useState, useEffect } from 'react';
import { BIDDING_TYPES, CATEGORIES_TREE } from '@/app/data/constants';
import CategorySelect from '@/components/CategorySelect';
import styles from './Filters.module.css';
import ClearableInput from '@/components/ui/ClearableInput';

interface FiltersProps {
    categories: string[];
    biddingType: string;
    priceFrom: string;
    priceTo: string;
    searchQuery: string;
    isSharedOwnership: string | null;
    onUpdate: (updates: Record<string, any>) => void;
}

// Иконка лупы для передачи в ClearableInput
const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

export default function Filters({
    categories,
    biddingType,
    priceFrom,
    priceTo,
    searchQuery,
    isSharedOwnership,
    onUpdate,
}: FiltersProps) {
    // Локальное состояние для инпутов
    const [localSearch, setLocalSearch] = useState(searchQuery);
    const [localPriceFrom, setLocalPriceFrom] = useState(priceFrom);
    const [localPriceTo, setLocalPriceTo] = useState(priceTo);
    const [localCategories, setLocalCategories] = useState(categories);
    const [localBiddingType, setLocalBiddingType] = useState(biddingType);
    const [localIsSharedOwnership, setLocalIsSharedOwnership] = useState(isSharedOwnership);

    // Синхронизация с URL (на случай навигации браузера Вперед/Назад)
    useEffect(() => {
        setLocalSearch(searchQuery);
        setLocalPriceFrom(formatNumber(priceFrom));
        setLocalPriceTo(formatNumber(priceTo));
        setLocalCategories(categories);
        setLocalBiddingType(biddingType);
        setLocalIsSharedOwnership(isSharedOwnership);
    }, [searchQuery, priceFrom, priceTo, categories, biddingType, isSharedOwnership]);

    // --- Основная функция поиска ---
    const handleApplyFilters = () => {
        onUpdate({
            searchQuery: localSearch,
            priceFrom: localPriceFrom.replace(/\D/g, ''),
            priceTo: localPriceTo.replace(/\D/g, ''),
            categories: localCategories,
            biddingType: localBiddingType,
            isSharedOwnership: localIsSharedOwnership,
            page: 1, // Всегда сбрасываем на первую страницу при поиске
        });
    };

    // --- Handlers ---

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalSearch(val);
    };

    // Добавляем обработку Enter в полях ввода
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleApplyFilters();
        }
    };

    const handlePriceFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Получаем сырое значение (удаляем пробелы и все лишнее)
        const rawValue = e.target.value.replace(/\D/g, '');

        // Форматируем для отображения в инпуте (1 000)
        const formattedValue = formatNumber(rawValue);
        setLocalPriceFrom(formattedValue);
    };

    const handlePriceToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, '');

        const formattedValue = formatNumber(rawValue);
        setLocalPriceTo(formattedValue);
    };

    const handleBiddingTypeClick = (type: string) => {
        setLocalBiddingType(type);
    };

    const handleCategoryChange = (newSelected: string[]) => {
        setLocalCategories(newSelected);
    };

    // Хендлер для переключения долевой собственности
    const handleSharedOwnershipClick = (value: string | null) => {
        setLocalIsSharedOwnership(value);
    };

    // --- HANDLERS ДЛЯ ОЧИСТКИ ---

    const handleClearSearch = () => setLocalSearch('');
    const handleClearPriceFrom = () => setLocalPriceFrom('');
    const handleClearPriceTo = () => setLocalPriceTo('');

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
                <label className={styles.filterLabel}>Поиск лотов по словам</label>
                <ClearableInput
                    type="text"
                    placeholder="Например: квартира в Москве"
                    value={localSearch}
                    onChange={handleSearchChange}
                    onClear={handleClearSearch}
                    onKeyDown={handleKeyDown}
                    icon={<SearchIcon />}
                />
            </div>

            {/* Категории */}
            <div className={`${styles.filterGroup} ${styles.categoriesArea}`}>
                <label className={styles.filterLabel}>Категории</label>
                <CategorySelect
                    categories={CATEGORIES_TREE}
                    selectedCategories={localCategories}
                    onChange={handleCategoryChange}
                    onApply={handleApplyFilters}
                />
            </div>

            {/* Вид торгов */}
            <div className={`${styles.filterGroup} ${styles.typeArea}`}>
                <label className={styles.filterLabel}>Вид торгов</label>
                <div className={styles.filterOptions}>
                    <button
                        onClick={() => handleBiddingTypeClick('Все')}
                        className={localBiddingType  === 'Все' ? styles.activeFilter : styles.filterButton}
                    >
                        Все
                    </button>
                    {BIDDING_TYPES.map((type) => (
                        <button
                            key={type}
                            onClick={() => handleBiddingTypeClick(type)}
                            className={localBiddingType  === type ? styles.activeFilter : styles.filterButton}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- Тип собственности (доли) --- */}
            <div className={`${styles.filterGroup} ${styles.ownershipArea}`}>
                <label className={styles.filterLabel}>Собственность</label>
                <div className={styles.filterOptions}>
                    {/* Кнопка "Все" */}
                    <button
                        onClick={() => handleSharedOwnershipClick(null)}
                        className={!localIsSharedOwnership  ? styles.activeFilter : styles.filterButton}
                    >
                        Все
                    </button>

                    {/* Кнопка "Целиком" (isSharedOwnership = false) */}
                    <button
                        onClick={() => handleSharedOwnershipClick('false')}
                        className={localIsSharedOwnership  === 'false' ? styles.activeFilter : styles.filterButton}
                    >
                        Целиком
                    </button>

                    {/* Кнопка "Только доли" (isSharedOwnership = true) */}
                    <button
                        onClick={() => handleSharedOwnershipClick('true')}
                        className={localIsSharedOwnership === 'true' ? styles.activeFilter : styles.filterButton}
                    >
                        Только доли
                    </button>
                </div>
            </div>

            {/* Цена */}
            <div className={`${styles.filterGroup} ${styles.priceArea}`}>
                <label className={styles.filterLabel}>Начальная цена, ₽</label>
                <div className={styles.priceFilterInputs}>
                    <ClearableInput
                        type="text"
                        placeholder="От"
                        value={localPriceFrom}
                        onChange={handlePriceFromChange}
                        onClear={handleClearPriceFrom}
                        onKeyDown={handleKeyDown}
                    />
                    <span className={styles.priceSeparator}>—</span>
                    <ClearableInput
                        type="text"
                        placeholder="До"
                        value={localPriceTo}
                        onChange={handlePriceToChange}
                        onClear={handleClearPriceTo}
                        onKeyDown={handleKeyDown}
                    />
                </div>
            </div>

            {/* Кнопка НАЙТИ */}
            <div className={styles.actionArea}>
                <button className={styles.searchButton} onClick={handleApplyFilters}>
                    Найти лоты
                </button>
            </div>
        </div>
    );
}
