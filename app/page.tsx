'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

type Lot = {
  Id: string;
  Url: string;
  StartPrice: string;
  Step: string;
  Deposit: string;
  Description: string;
  ViewingProcedure: string;
  categories: {
    Id: number;
    Name: string;
    LotId: string;
  }[];
};

export default function Page() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/lots')
      .then((res) => res.json())
      .then((data) => {
        setLots(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Failed to fetch lots:", error);
        setLoading(false);
      });
  }, []);

  return (
    <main>
      <h1>Актуальные лоты</h1>
      {loading ? (
        <p>Загрузка лотов...</p>
      ) : (
        <div className={styles.lotsGrid}>
          {lots.map((lot) => (
            <div key={lot.Id} className={styles.card}>
              {/* Основная информация лота */}
              <div className={styles.cardContent}>
                <a href={lot.Url} target="_blank" rel="noopener noreferrer">
                  <h2>{lot.Description}</h2>
                </a>
                <p><b>Стартовая цена:</b> {lot.StartPrice} </p>
                <p><b>Шаг цены:</b> {lot.Step} </p>
                <p><b>Задаток:</b> {lot.Deposit} </p>
                <p><b>Порядок ознакомления:</b> {lot.ViewingProcedure}</p>
                
                {lot.categories && lot.categories.length > 0 && (
                  <div className={styles.categoriesContainer}>
                    {lot.categories.map((cat) => (
                      <span key={cat.Id} className={styles.categoryTag}>
                        {cat.Name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Футер карточки с кнопкой */}
              <div className={styles.cardFooter}>
                <Link href={`/buy/${lot.Id}`} className={styles.buyButton}>
                  Купить через агента
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
