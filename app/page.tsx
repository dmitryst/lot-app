'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

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


// Определяем тип Lot (можно вынести в types.ts)
type Lot = {
  Id: string;
  Url: string;
  StartPrice: string;
  Step: string;
  Deposit: string;
  Description: string;
  BiddingType: string;
  ViewingProcedure: string;
  categories: {
    Id: number;
    Name: string;
    LotId: string;
  }[];
};

// --- СПИСОК КАТЕГОРИЙ, ЗАДАННЫЙ В КОДЕ ---
const PREDEFINED_CATEGORIES = [
  'Автомобили',
  'Дебиторская задолженность',
  'Земельные участки',
  'Жилые здания (помещения)',
  'Прочее',
];

export default function Page() {
  // --- Состояния компонента ---
  const [allLots, setAllLots] = useState<Lot[]>([]);         // Все лоты с сервера
  const [filteredLots, setFilteredLots] = useState<Lot[]>([]); // Лоты для отображения
  const [selectedCategory, setSelectedCategory] = useState<string>('Все'); // Выбранная категория
  const [loading, setLoading] = useState(true);

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

  // --- Логика фильтрации при изменении выбранной категории ---
  useEffect(() => {
    if (selectedCategory === 'Все') {
      setFilteredLots(allLots);
    } else {
      const filtered = allLots.filter(lot =>
        // Проверяем, есть ли у лота категория с нужным именем
        lot.categories.some(cat => cat.Name === selectedCategory)
      );
      setFilteredLots(filtered);
    }
  }, [selectedCategory, allLots]);

  return (
    <main>
      {/* Блок фильтров */}
      <div className={styles.filterContainer}>
        <button
          onClick={() => setSelectedCategory('Все')}
          className={selectedCategory === 'Все' ? styles.activeFilter : styles.filterButton}
        >
          Все категории
        </button>
        {PREDEFINED_CATEGORIES.map(category => (
          <button
            key={category} // Теперь ключ - это сама строка, она уникальна
            onClick={() => setSelectedCategory(category)}
            className={selectedCategory === category ? styles.activeFilter : styles.filterButton}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Отображение лотов */}
      {loading ? (
        <p style={{ textAlign: 'center' }}>Загрузка лотов...</p>
      ) : (
        <div className={styles.lotsGrid}>
          {filteredLots.length > 0 ? (
            filteredLots.map((lot) => (
              <div key={lot.Id} className={styles.card}>
                <div className={styles.cardContent}>
                  <a href={lot.Url} target="_blank" rel="noopener noreferrer">
                    <h2>{lot.Description}</h2>
                  </a>

                  <div className={styles.priceLine}>
                  {lot.BiddingType === 'Публичное предложение' ? (
                    <span className={styles.iconDown}><IconArrowDown /></span>
                  ) : (
                    <span className={styles.iconUp}><IconArrowUp /></span>
                  )}
                  <p><b>Стартовая цена:</b> {lot.StartPrice} ₽</p>
                </div>

                  <p><b>Шаг цены:</b> {lot.Step} </p>
                  <p><b>Задаток:</b> {lot.Deposit} </p>
                  <p><b>Порядок ознакомления:</b> {lot.ViewingProcedure}</p>
                  
                  {lot.categories?.length > 0 && (
                    <div className={styles.categoriesContainer}>
                      {lot.categories.map((cat) => (
                        <span key={cat.Id} className={styles.categoryTag}>
                          {cat.Name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className={styles.cardFooter}>
                  <Link href={`/buy/${lot.Id}`} className={styles.buyButton}>
                    Купить через агента
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p style={{ textAlign: 'center' }}>Лоты в данной категории не найдены.</p>
          )}
        </div>
      )}
    </main>
  );
}
