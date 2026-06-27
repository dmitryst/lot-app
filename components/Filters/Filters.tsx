// components/Filters/Filters.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { BIDDING_TYPES, CATEGORIES_TREE, REGIONS_TREE, getDynamicFiltersForCategories } from '@/app/data/constants';
import CategorySelect from '@/components/CategorySelect';
import RegionSelect from '@/components/RegionSelect';
import FilterSingleSelect from '@/components/FilterSingleSelect';
import { useVehicleFilterOptions } from '@/app/hooks/useVehicleFilterOptions';
import styles from './Filters.module.css';
import ClearableInput from '@/components/ui/ClearableInput';

interface FiltersProps {
    categories: string[];
    biddingType: string;
    priceFrom: string;
    priceTo: string;
    searchQuery: string;
    isSharedOwnership: string | null;
    regions: string[];
    dynamicFilters?: Record<string, string>;
    onUpdate: (updates: Record<string, any>) => void;
}

// Иконка лупы для передачи в ClearableInput
const SearchIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

// Иконки для кнопок типа торгов
const IconArrowUp = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
        <path d="M12 19V5" /><path d="m5 12 7-7 7 7" />
    </svg>
);

const IconArrowDown = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
        <path d="M12 5v14" /><path d="m19 12-7 7-7-7" />
    </svg>
);

const getBiddingTypeDisplay = (type: string) => {
    if (type === 'Открытый аукцион') {
        return (
            <span style={{ display: 'flex', alignItems: 'center', color: '#28a745' }}>
                Аукционы <IconArrowUp />
            </span>
        );
    }
    if (type === 'Публичное предложение') {
        return (
            <span style={{ display: 'flex', alignItems: 'center', color: '#dc3545' }}>
                Публичные предложения <IconArrowDown />
            </span>
        );
    }
    return type;
};

export default function Filters({
    categories,
    biddingType,
    priceFrom,
    priceTo,
    searchQuery,
    isSharedOwnership,
    regions,
    dynamicFilters,
    onUpdate,
}: FiltersProps) {
    // Локальное состояние для инпутов
    const [localSearch, setLocalSearch] = useState(searchQuery);
    const [localPriceFrom, setLocalPriceFrom] = useState(priceFrom);
    const [localPriceTo, setLocalPriceTo] = useState(priceTo);
    const [localCategories, setLocalCategories] = useState(categories);
    const [localBiddingType, setLocalBiddingType] = useState(biddingType);
    const [localIsSharedOwnership, setLocalIsSharedOwnership] = useState(isSharedOwnership);
    const [localRegions, setLocalRegions] = useState(regions);
    const [localDynamicFilters, setLocalDynamicFilters] = useState<Record<string, string>>(dynamicFilters || {});

    // Получаем список доступных динамических фильтров для выбранных категорий
    const availableDynamicFilters = useMemo(() => {
        return getDynamicFiltersForCategories(localCategories);
    }, [localCategories]);

    const showVehicleSelectFilters = useMemo(
        () => availableDynamicFilters.some(f => f.id === 'brand' || f.id === 'model'),
        [availableDynamicFilters]
    );

    const { options: vehicleOptions, loading: vehicleOptionsLoading } = useVehicleFilterOptions(showVehicleSelectFilters);

    const selectedBrand = localDynamicFilters.brand || '';
    const modelOptions = useMemo(() => {
        if (!selectedBrand) {
            return [];
        }
        return vehicleOptions.modelsByBrand[selectedBrand]
            ?? Object.entries(vehicleOptions.modelsByBrand).find(([brand]) => brand.toLowerCase() === selectedBrand.toLowerCase())?.[1]
            ?? [];
    }, [selectedBrand, vehicleOptions.modelsByBrand]);

    // Синхронизация с URL (на случай навигации браузера Вперед/Назад)
    useEffect(() => {
        setLocalSearch(searchQuery);
        setLocalPriceFrom(formatNumber(priceFrom));
        setLocalPriceTo(formatNumber(priceTo));
        setLocalCategories(categories);
        setLocalBiddingType(biddingType);
        setLocalIsSharedOwnership(isSharedOwnership);
        setLocalRegions(regions);
        setLocalDynamicFilters(dynamicFilters || {});
    }, [searchQuery, priceFrom, priceTo, categories, biddingType, isSharedOwnership, regions, dynamicFilters]);

    // --- Основная функция поиска ---
    const handleApplyFilters = () => {
        const updates: Record<string, any> = {
            searchQuery: localSearch,
            priceFrom: localPriceFrom.replace(/\D/g, ''),
            priceTo: localPriceTo.replace(/\D/g, ''),
            categories: localCategories,
            biddingType: localBiddingType,
            isSharedOwnership: localIsSharedOwnership,
            regions: localRegions,
            page: 1, // Всегда сбрасываем на первую страницу при поиске
        };

        // Добавляем динамические фильтры
        // Сначала очищаем старые (передавая пустые строки для тех, что были, но теперь их нет)
        if (dynamicFilters) {
            Object.keys(dynamicFilters).forEach(key => {
                updates[`attr_${key}`] = '';
            });
        }
        
        // Затем добавляем новые (только те, которые доступны для текущих выбранных категорий)
        const availableFilterIds = new Set(availableDynamicFilters.map(f => f.id));

        Object.entries(localDynamicFilters).forEach(([key, value]) => {
            // Извлекаем базовый ID фильтра (убираем _from и _to для range фильтров)
            const baseKey = key.replace(/_from$/, '').replace(/_to$/, '');

            if (value && availableFilterIds.has(baseKey)) {
                updates[`attr_${key}`] = value;
            }
        });

        onUpdate(updates);
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

    const handleRegionChange = (newSelected: string[]) => {
        setLocalRegions(newSelected);
    };

    // Хендлер для переключения долевой собственности
    const handleSharedOwnershipClick = (value: string | null) => {
        setLocalIsSharedOwnership(value);
    };

    const handleDynamicFilterChange = (key: string, value: string) => {
        setLocalDynamicFilters(prev => {
            const next = { ...prev, [key]: value };

            // При смене марки сбрасываем модель
            if (key === 'brand' && prev.brand !== value) {
                next.model = '';
            }

            return next;
        });
    };

    const renderDynamicFilter = (filter: ReturnType<typeof getDynamicFiltersForCategories>[number]) => {
        if (filter.type === 'select' && filter.id === 'brand') {
            return (
                <FilterSingleSelect
                    options={vehicleOptions.brands}
                    value={localDynamicFilters.brand || ''}
                    onChange={(value) => handleDynamicFilterChange('brand', value)}
                    placeholder={filter.placeholder || 'Выберите марку'}
                    loading={vehicleOptionsLoading}
                    emptyMessage="Марки пока не найдены"
                />
            );
        }

        if (filter.type === 'select' && filter.id === 'model') {
            const brandSelected = !!selectedBrand;
            return (
                <FilterSingleSelect
                    options={modelOptions}
                    value={localDynamicFilters.model || ''}
                    onChange={(value) => handleDynamicFilterChange('model', value)}
                    placeholder={brandSelected ? (filter.placeholder || 'Выберите модель') : 'Сначала выберите марку'}
                    disabled={!brandSelected}
                    loading={vehicleOptionsLoading}
                    emptyMessage={brandSelected ? 'Модели для этой марки не найдены' : 'Сначала выберите марку'}
                />
            );
        }

        if (filter.type === 'text' || filter.type === 'number') {
            return (
                <ClearableInput
                    type="text"
                    placeholder={filter.placeholder || ''}
                    value={localDynamicFilters[filter.id] || ''}
                    onChange={(e) => handleDynamicFilterChange(filter.id, e.target.value)}
                    onClear={() => handleDynamicFilterChange(filter.id, '')}
                    onKeyDown={handleKeyDown}
                />
            );
        }

        if (filter.type === 'range') {
            return (
                <div className={styles.priceFilterInputs}>
                    <ClearableInput
                        type="text"
                        placeholder={filter.placeholderFrom || 'От'}
                        value={localDynamicFilters[`${filter.id}_from`] || ''}
                        onChange={(e) => handleDynamicFilterChange(`${filter.id}_from`, e.target.value.replace(/\D/g, ''))}
                        onClear={() => handleDynamicFilterChange(`${filter.id}_from`, '')}
                        onKeyDown={handleKeyDown}
                    />
                    <span className={styles.priceSeparator}>—</span>
                    <ClearableInput
                        type="text"
                        placeholder={filter.placeholderTo || 'До'}
                        value={localDynamicFilters[`${filter.id}_to`] || ''}
                        onChange={(e) => handleDynamicFilterChange(`${filter.id}_to`, e.target.value.replace(/\D/g, ''))}
                        onClear={() => handleDynamicFilterChange(`${filter.id}_to`, '')}
                        onKeyDown={handleKeyDown}
                    />
                </div>
            );
        }

        return null;
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

            {/* Регионы */}
            <div className={`${styles.filterGroup} ${styles.regionsArea}`}>
                <label className={styles.filterLabel}>Местонахождение имущества</label>
                <RegionSelect
                    regions={REGIONS_TREE}
                    selectedRegions={localRegions}
                    onChange={handleRegionChange}
                    onApply={handleApplyFilters}
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
                            {getBiddingTypeDisplay(type)}
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

            {/* Динамические фильтры */}
            {availableDynamicFilters.length > 0 && (
                <div className={styles.dynamicFiltersArea}>
                    {availableDynamicFilters.map(filter => (
                        <div key={filter.id} className={styles.filterGroup}>
                            <label className={styles.filterLabel}>{filter.label}</label>
                            {renderDynamicFilter(filter)}
                        </div>
                    ))}
                </div>
            )}

            {/* Кнопка НАЙТИ */}
            <div className={styles.actionArea}>
                <button className={styles.searchButton} onClick={handleApplyFilters}>
                    Найти лоты
                </button>
            </div>
        </div>
    );
}
