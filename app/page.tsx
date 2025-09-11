'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import debounce from 'lodash.debounce';
import LotCard from '../components/LotCard';
import Pagination from '../components/Pagination';
import styles from './page.module.css';
import { Lot } from '../types';

// --- Константы ---
const PREDEFINED_CATEGORIES = [
  'Автомобили',
  'Права требования (дебиторская задолженность)',
  'Земельные участки',
  'Жилые здания (помещения)',
  'Прочее',
];
const BIDDING_TYPES = ['Открытый аукцион', 'Публичное предложение'];

const formatNumberWithSpaces = (value: string) => {
  if (!value) return '';
  // Удаляем все нечисловые символы и добавляем пробелы как разделители
  const cleanValue = value.replace(/\D/g, '');
  return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const PAGE_SIZE = 20;

// --- Основной компонент страницы ---
export default function Page() {
  // --- Состояния для данных и UI ---
  const [filteredLots, setFilteredLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  // --- Состояния для фильтров ---
  const [selectedCategory, setSelectedCategory] = useState('Все');
  const [selectedBiddingType, setSelectedBiddingType] = useState('Все');
  const [priceFrom, setPriceFrom] = useState('');
  const [priceTo, setPriceTo] = useState('');

  // --- Функция для загрузки данных с сервера ---
  const fetchLots = useCallback(async (page = 1) => {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL;
    if (!apiUrl) {
      console.error("URL бэкенда не настроен.");
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({
      pageNumber: page.toString(),
      pageSize: PAGE_SIZE.toString(),
    });

    // Собираем параметры фильтрации
    if (selectedBiddingType !== 'Все') params.append('biddingType', selectedBiddingType);
    if (selectedCategory !== 'Все') params.append('category', selectedCategory);
    if (priceFrom) params.append('priceFrom', priceFrom);
    if (priceTo) params.append('priceTo', priceTo);

    try {
      const res = await fetch(`${apiUrl}/api/lots/list?${params.toString()}`);
      if (!res.ok) throw new Error('Не удалось загрузить лоты');
      const data = await res.json();
      setFilteredLots(data.items);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Ошибка при загрузке лотов:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedBiddingType, priceFrom, priceTo]); // Зависит от всех фильтров

  // --- Создаем "отложенную" версию функции загрузки ---
  // Это предотвращает отправку запросов при каждом нажатии клавиши в полях цены
  const debouncedFetchLots = useMemo(() => {
    return debounce(() => fetchLots(1), 800); // Задержка 800 мс, всегда ищем с 1-й страницы
  }, [fetchLots]);

  // --- Основной хук для применения фильтров ---
  useEffect(() => {
    // Сбрасываем на первую страницу при изменении любого фильтра
    setCurrentPage(1);
    // Вызываем отложенную функцию
    debouncedFetchLots();

    // Отменяем запланированный вызов, если компонент размонтируется
    return () => {
      debouncedFetchLots.cancel();
    };
  }, [selectedCategory, selectedBiddingType, priceFrom, priceTo, debouncedFetchLots]);

  // --- Хук для пагинации ---
  // Загружает данные при смене страницы (если это не было вызвано сменой фильтров)
  useEffect(() => {
    if (currentPage > 1) {
      fetchLots(currentPage);
    }
  }, [currentPage, fetchLots]);


  // --- Обработчики для полей цены ---
  const handlePriceChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    setter(e.target.value.replace(/\D/g, ''));
  };

  // --- JSX для рендеринга фильтров ---
  const filtersSidebarContent = (
    <>
      <div className={styles.filterGroup}>
        <h3 className={styles.filterTitle}>Категории</h3>
        <div className={styles.buttonGroup}>
          <button onClick={() => setSelectedCategory('Все')} className={selectedCategory === 'Все' ? styles.activeFilter : styles.filterButton}>Все</button>
          {PREDEFINED_CATEGORIES.map(category => (
            <button key={category} onClick={() => setSelectedCategory(category)} className={selectedCategory === category ? styles.activeFilter : styles.filterButton}>{category}</button>
          ))}
        </div>
      </div>

      <div className={styles.filterGroup}>
        <h3 className={styles.filterTitle}>Вид торгов</h3>
        <div className={styles.buttonGroup}>
          <button onClick={() => setSelectedBiddingType('Все')} className={selectedBiddingType === 'Все' ? styles.activeFilter : styles.filterButton}>Все</button>
          {BIDDING_TYPES.map(type => (
            <button key={type} onClick={() => setSelectedBiddingType(type)} className={selectedBiddingType === type ? styles.activeFilter : styles.filterButton}>{type}</button>
          ))}
        </div>
      </div>

      <div className={styles.filterGroup}>
        <h3 className={styles.filterTitle}>Начальная цена, ₽</h3>
        <div className={styles.priceFilterInputs}>
          <input
            type="text"
            className={styles.priceInput}
            placeholder="от"
            value={formatNumberWithSpaces(priceFrom)}
            onChange={(e) => handlePriceChange(e, setPriceFrom)}
          />
          <span className={styles.priceSeparator}>—</span>
          <input
            type="text"
            className={styles.priceInput}
            placeholder="до"
            value={formatNumberWithSpaces(priceTo)}
            onChange={(e) => handlePriceChange(e, setPriceTo)}
          />
        </div>
      </div>
    </>
  );

  return (
    <main className={styles.main}>
      <div className={styles.mapBanner}>
        <Link href="/map" className={styles.mapLinkButton}>
          Смотреть недвижимость на карте
        </Link>
      </div>

      <section className={styles.contentArea}>
        <div className={styles.filtersContainer}>
          <button
            className={styles.toggleFiltersButton}
            onClick={() => setIsFiltersVisible(!isFiltersVisible)}
          >
            {isFiltersVisible ? 'Скрыть фильтры' : 'Показать фильтры'}
          </button>
          <aside className={`${styles.sidebar} ${isFiltersVisible ? styles.sidebarVisible : ''}`}>
            {filtersSidebarContent}
          </aside>
        </div>

        {loading ? (
          <div className={styles.loadingMessage}>Загрузка лотов...</div>
        ) : filteredLots.length > 0 ? (
          <>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />

            <div className={styles.lotsGrid}>
              {filteredLots.map((lot: Lot) => (
                <LotCard key={lot.id} lot={lot} imageUrl={lot.imageUrl} />
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <p>По вашему запросу лотов не найдено.</p>
        )}
      </section>
    </main>
  );
}
