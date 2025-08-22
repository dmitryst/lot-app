'use client';

import { useEffect, useState } from 'react';
import LotCard from '../components/LotCard';
import styles from './page.module.css';
import { Lot } from '../types';

// --- СПИСОК КАТЕГОРИЙ, ЗАДАННЫЙ В КОДЕ ---
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

export default function Page() {
  // --- Состояния компонента ---
  const [allLots, setAllLots] = useState<Lot[]>([]);         // Все лоты с сервера
  const [filteredLots, setFilteredLots] = useState<Lot[]>([]); // Лоты для отображения
  const [loading, setLoading] = useState(true);

  // --- Состояния для пагинации ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // --- Состояния для фильтров ---
  const [selectedCategory, setSelectedCategory] = useState<string>('Все'); // Выбранная категория
  const [selectedBiddingType, setSelectedBiddingType] = useState<string>('Все');
  const [priceFrom, setPriceFrom] = useState<string>('');
  const [priceTo, setPriceTo] = useState<string>('');

  // Состояние для видимости фильтров на мобильных
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  // --- Загрузка только лотов при первом рендере ---
  useEffect(() => {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL;
    if (!apiUrl) {
      console.error("URL бэкенда не настроен.");
      setLoading(false);
      return;
    }

    fetch(`${apiUrl}/api/lots/list?pageNumber=${currentPage}&pageSize=${PAGE_SIZE}`)
      .then((res) => {
        if (!res.ok) throw new Error('Не удалось загрузить лоты');
        return res.json();
      })
      .then((data) => {
        setAllLots(data.items);
        setFilteredLots(data.items); // Изначально показываем все лоты с текущей страницы
        setTotalPages(data.totalPages);
      })
      .catch(error => console.error("Ошибка при загрузке лотов:", error))
      .finally(() => setLoading(false));
  }, [currentPage]); // Перезагружаем данные при изменении currentPage

  // --- Логика фильтрации (работает для лотов на текущей странице) ---
  useEffect(() => {
    let tempLots = [...allLots];

    // 1. Фильтруем по категории
    if (selectedCategory !== 'Все') {
      tempLots = tempLots.filter(lot =>
        lot.categories.some(cat => cat.name === selectedCategory)
      );
    }

    // 2. Фильтруем по виду торгов
    if (selectedBiddingType !== 'Все') {
      tempLots = tempLots.filter(lot => lot.bidding.type === selectedBiddingType);
    }

    // 3. Фильтр по цене
    const from = parseFloat(priceFrom);
    const to = parseFloat(priceTo);

    if (!isNaN(from) || !isNaN(to)) {
      tempLots = tempLots.filter(lot => {
        const lotPrice = lot.startPrice ? parseFloat(lot.startPrice) : null;
        if (lotPrice === null) return false; // Исключаем лоты без цены

        const fromCondition = isNaN(from) || lotPrice >= from;
        const toCondition = isNaN(to) || lotPrice <= to;

        return fromCondition && toCondition;
      });
    }

    setFilteredLots(tempLots);

  }, [selectedCategory, selectedBiddingType, priceFrom, priceTo, allLots]);

  // --- УНИВЕРСАЛЬНЫЙ ОБРАБОТЧИК ДЛЯ ПОЛЕЙ ЦЕНЫ ---
  const handlePriceInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    // Сохраняем в состояние только цифры
    const rawValue = e.target.value.replace(/\D/g, '');
    setter(rawValue);
  };

  // --- JSX для пагинации ---
  const paginationControls = (
    <div className={styles.pagination}>
      <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage <= 1}>
        Назад
      </button>
      <span>Стр. {currentPage} из {totalPages}</span>
      <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>
        Вперед
      </button>
    </div>
  );

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
            onChange={(e) => handlePriceInputChange(e, setPriceFrom)}
          />
          <span className={styles.priceSeparator}>—</span>
          <input
            type="text"
            className={styles.priceInput}
            placeholder="до"
            value={formatNumberWithSpaces(priceTo)}
            onChange={(e) => handlePriceInputChange(e, setPriceTo)}
          />
        </div>
      </div>
    </>
  );

  return (
    <main className={styles.main}>
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
          <p>Загрузка лотов...</p>
        ) : filteredLots.length > 0 ? (
          <>
            <div className={styles.lotsGrid}>
              {filteredLots.map((lot: Lot) => (
                <LotCard
                  key={lot.id}
                  lot={lot}
                  imageUrl={lot.imageUrl}
                />
              ))}
            </div>
            {paginationControls}
          </>
        ) : (
          <p>По вашему запросу лотов не найдено.</p>
        )}
      </section>
    </main>
  );
}
