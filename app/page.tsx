'use client';
import { useEffect, useState } from 'react';
import LotCard from '../components/LotCard';
import styles from './page.module.css';
import { Lot } from '../types';

// --- СПИСОК КАТЕГОРИЙ, ЗАДАННЫЙ В КОДЕ ---
const PREDEFINED_CATEGORIES = [
  'Автомобили',
  'Дебиторская задолженность',
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

export default function Page() {
  // --- Состояния компонента ---
  const [allLots, setAllLots] = useState<Lot[]>([]);         // Все лоты с сервера
  const [filteredLots, setFilteredLots] = useState<Lot[]>([]); // Лоты для отображения
  const [loading, setLoading] = useState(true);

  // --- Состояния для фильтров ---
  const [selectedCategory, setSelectedCategory] = useState<string>('Все'); // Выбранная категория
  const [selectedBiddingType, setSelectedBiddingType] = useState<string>('Все');
  const [priceFrom, setPriceFrom] = useState<string>('');
  const [priceTo, setPriceTo] = useState<string>('');

  // --- Загрузка только лотов при первом рендере ---
  useEffect(() => {
    fetch('/api/lots')
      .then((res) => {
        if (!res.ok) throw new Error('Не удалось загрузить лоты');
        return res.json();
      })
      .then((lotsData) => {
        setAllLots(lotsData);
        setFilteredLots(lotsData); // Изначально показываем все лоты
      })
      .catch(error => console.error("Ошибка при загрузке лотов:", error))
      .finally(() => setLoading(false));
  }, []);

  // --- Логика фильтрации при изменении выбранной категории, вида торгов ---
  useEffect(() => {
    let tempLots = allLots;

    // 1. Фильтруем по категории
    if (selectedCategory !== 'Все') {
      tempLots = tempLots.filter(lot =>
        lot.categories.some(cat => cat.Name === selectedCategory)
      );
    }

    // 2. Фильтруем по виду торгов
    if (selectedBiddingType !== 'Все') {
      tempLots = tempLots.filter(lot => lot.BiddingType === selectedBiddingType);
    }

    // 3. Фильтр по цене
    const from = parseFloat(priceFrom);
    const to = parseFloat(priceTo);

    if (!isNaN(from) || !isNaN(to)) {
      tempLots = tempLots.filter(lot => {
        const lotPrice = lot.StartPrice ? parseFloat(lot.StartPrice) : null;
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

  return (
    <main className={styles.mainLayout}>
      {/* --- САЙДБАР С ФИЛЬТРАМИ --- */}
      <aside className={styles.sidebar}>
        <div className={styles.filterGroup}>
          <h3 className={styles.filterTitle}>Категории</h3>
          <div className={styles.filterOptions}>
            <button onClick={() => setSelectedCategory('Все')} className={selectedCategory === 'Все' ? styles.activeFilter : styles.filterButton}>Все</button>
            {PREDEFINED_CATEGORIES.map(category => (
              <button key={category} onClick={() => setSelectedCategory(category)} className={selectedCategory === category ? styles.activeFilter : styles.filterButton}>
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filterGroup}>
          <h3 className={styles.filterTitle}>Вид торгов</h3>
          <div className={styles.filterOptions}>
            <button onClick={() => setSelectedBiddingType('Все')} className={selectedBiddingType === 'Все' ? styles.activeFilter : styles.filterButton}>Все</button>
            {BIDDING_TYPES.map(type => (
              <button key={type} onClick={() => setSelectedBiddingType(type)} className={selectedBiddingType === type ? styles.activeFilter : styles.filterButton}>
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* --- ФИЛЬТР ПО ЦЕНЕ --- */}
        <div className={styles.filterGroup}>
          <h3 className={styles.filterTitle}>Начальная цена, ₽</h3>
          <div className={styles.priceFilterInputs}>
            <input
              type="text"
              placeholder="от"
              value={formatNumberWithSpaces(priceFrom)}
              onChange={(e) => handlePriceInputChange(e, setPriceFrom)}
              className={styles.priceInput}
              autoComplete="off"
            />
            <span className={styles.priceSeparator}>–</span>
            <input
              type="text"
              placeholder="до"
              value={formatNumberWithSpaces(priceTo)}
              onChange={(e) => handlePriceInputChange(e, setPriceTo)}
              className={styles.priceInput}
              autoComplete="off"
            />
          </div>
        </div>
      </aside>

      {/* --- ОСНОВНОЙ КОНТЕНТ (СПИСОК ЛОТОВ) --- */}
      <div className={styles.contentArea}>
        {loading ? (
          <p>Загрузка лотов...</p>
        ) : filteredLots.length > 0 ? (
          <div className={styles.lotsGrid}>
            {filteredLots.map((lot) => (
              <LotCard key={lot.Id} lot={lot} />
            ))}
          </div>
        ) : (
          <p>По вашему запросу лотов не найдено.</p>
        )}
      </div>
    </main>
  );
}
