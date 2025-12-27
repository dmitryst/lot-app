// app/promo/[slug]/page.tsx

import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PROMO_LOTS } from '../data/promo-lots';
import styles from './promo.module.css';
import ImageGallery from './ImageGallery';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const lot = PROMO_LOTS[slug];
  if (!lot) return { title: 'Лот не найден' };
  
  return {
    title: `${lot.title} | Инвест-предложение`,
    description: lot.description,
  };
}

export default async function PromoLotPage({ params }: Props) {
  const { slug } = await params;
  const lot = PROMO_LOTS[slug];

  if (!lot) {
    notFound();
  }

  // Если вдруг images не заполнен, используем одиночную img как массив
  const galleryImages = lot.images && lot.images.length > 0 
    ? lot.images 
    : [lot.img];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>← Все лоты</Link>
        <span className={styles.label}>Инвест-идея</span>
      </header>

      <section>
        <h1 className={styles.title}>{lot.title}</h1>
        {/* Адрес можно добавить, если нужно */}
        
        <ImageGallery 
          images={galleryImages} 
          title={lot.title} 
        />

        <div className={styles.grid}>
          <div className={styles.content}>
            <h2>Описание актива</h2>
            <ul className={styles.featuresList}>
              {lot.features.map((feature, idx) => (
                <li key={idx} dangerouslySetInnerHTML={{ __html: feature }} /> 
                /* dangerouslySetInnerHTML нужен, если в тексте есть <b> или <br> */
              ))}
            </ul>

            <div className={styles.expertBlock}>
              <h3>💡 Мнение эксперта:</h3>
              <p>{lot.expertOpinion}</p>
            </div>
          </div>

          <aside className={styles.sidebar}>
            <div className={styles.priceCard}>
              <h3>График снижения цены</h3>
              
              <div className={styles.tableWrapper}>
                <table className={styles.priceTable}>
                  <thead>
                    <tr>
                      <th>Дата (до)</th>
                      <th style={{textAlign: 'right'}}>Цена, ₽</th>
                      <th style={{textAlign: 'right'}}>Задаток</th>
                      <th style={{textAlign: 'center'}}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lot.schedule.map((row, idx) => (
                      <tr key={idx} className={styles[row.status]}>
                        <td>{row.date}</td>
                        <td className={styles.numCell}>{row.price}</td>
                        <td className={styles.numCell}>{row.deposit}</td>
                        <td className={styles.statusIconCell}>{row.statusText}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Легенда под таблицей */}
              <div className={styles.legendBlock}>
                <div className={styles.legendItem}>
                  <span className={styles.legendIcon}>✅</span> — Рекомендуем покупать
                </div>
              </div>

              <div className={styles.ctaBlock}>
                <a href={`https://t.me/${lot.managerTg}`} target="_blank" className={styles.callButton}>
                  💬 Обсудить стратегию
                </a>
                <a href="#" className={styles.emailLink}>
                  📊 Получить фин. модель
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
