'use client';
import { useEffect, useState } from 'react';
import LotCard from '../components/LotCard';
import styles from './page.module.css';
import { Lot } from '../types';

// --- ИКОНКИ ---
const IconArrowUp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5" />
    <path d="m5 12 7-7 7 7" />
  </svg>
);

const IconArrowDown = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14" />
    <path d="m19 12-7 7-7-7" />
  </svg>
);

// --- СПИСОК КАТЕГОРИЙ, ЗАДАННЫЙ В КОДЕ ---
const PREDEFINED_CATEGORIES = [
  'Автомобили',
  'Дебиторская задолженность',
  'Земельные участки',
  'Жилые здания (помещения)',
  'Прочее',
];

const BIDDING_TYPES = ['Открытый аукцион', 'Публичное предложение'];

export default function Page() {
  // --- Состояния компонента ---
  const [allLots, setAllLots] = useState<Lot[]>([]);         // Все лоты с сервера
  const [filteredLots, setFilteredLots] = useState<Lot[]>([]); // Лоты для отображения
  const [loading, setLoading] = useState(true);

  // --- Состояния для фильтров ---
  const [selectedCategory, setSelectedCategory] = useState<string>('Все'); // Выбранная категория
  const [selectedBiddingType, setSelectedBiddingType] = useState<string>('Все');

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

    setFilteredLots(tempLots);

  }, [selectedCategory, selectedBiddingType, allLots]);

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
