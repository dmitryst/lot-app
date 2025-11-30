// app/gab/saratov/page.tsx
import React from 'react';
import Link from 'next/link';
import styles from './gab.module.css';

export const metadata = {
  title: 'Купить ГАБ Магнит Саратов | Торги №41128 | Доходность 20%',
  description: 'Продажа помещения с арендатором Магнит. Саратов, ул. Астраханская 40А. Торги по банкротству №41128. Кадастровые номера: 64:48:050387:2366, 64:48:050387:2144. Цена снижается.',
  keywords: 'купить габ, арендный бизнес магнит, торги по банкротству саратов, 64:48:050387:2366, 64:48:050387:2144, инвестиции в недвижимость',
};

export default function GabPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    'name': 'Помещение с арендатором Магнит, 870 кв.м',
    'description': 'Готовый арендный бизнес с федеральным арендатором. Продажа с торгов по банкротству.',
    'image': 'https://s-lot.ru/images/magnit-saratov.jpg',
    'address': {
      '@type': 'PostalAddress',
      'streetAddress': 'ул. Астраханская, д. 40 «А»',
      'addressLocality': 'Саратов',
      'addressRegion': 'Саратовская область',
      'addressCountry': 'RU'
    },
    'price': '22703625',
    'priceCurrency': 'RUB',
    'datePosted': '2025-11-29'
  };

  return (
    <div className={styles.container}>
      {/* Хедер с возвратом */}
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>← На главную</Link>
        <span className={styles.label}>Эксклюзивное предложение</span>
      </header>

      {/* Заголовок и Основное фото */}
      <section className={styles.hero}>
        <h1 className={styles.title}>Готовый арендный бизнес (ГАБ) с арендатором «Магнит»</h1>
        <div className={styles.mainImage}>
          {/* Заглушка для фото. Замените src на реальное фото здания */}
          <img src="/images/magnit-saratov.png" alt="Здание Магнит Саратов" />
          <div className={styles.imageOverlay}>
            <span className={styles.badge}>Доходность 16–20%</span>
            <span className={styles.badge}>Окупаемость ~4,6 года</span>
          </div>
        </div>
      </section>

      <div className={styles.grid}>
        {/* Левая колонка: Описание */}
        <div className={styles.content}>
          <h2>Характеристики объекта</h2>
          <ul className={styles.featuresList}>
            <li><strong>Адрес:</strong> г. Саратов, ул. Астраханская, д. 40 «А»</li>
            <li><strong>Площадь:</strong> 870,4 кв.м (Торговая: 555 кв.м, Мансарда: 315 кв.м)</li>
            <li><strong>Арендатор:</strong> АО «Тандер» (Магнит), долгосрочный договор</li>
            <li><strong>МАП:</strong> ~480 000 руб./мес. | <strong>ГАП:</strong> ~5 760 000 руб.</li>
            <li><strong>Земля:</strong> Долгосрочная аренда (снижает налог и вход в сделку)</li>
          </ul>

          <h2>Почему это выгодно?</h2>
          <p>
            Лот реализуется с существенным дисконтом (30-40% от рынка). Федеральный арендатор обеспечивает стабильный поток,
            а наличие свободной площади дает потенциал для увеличения прибыли (Upside).
          </p>
        </div>

        {/* Правая колонка: График цены и CTA */}
        <div className={styles.sidebar}>
          <div className={styles.priceCard}>
            <h3>График снижения цены</h3>
            <div className={styles.tableWrapper}>
              <table className={styles.priceTable}>
                <thead>
                  <tr>
                    <th>Дата (до)</th>
                    <th>Цена, ₽</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>19.12.2025</td>
                    <td>32 433 750</td>
                    <td>📉</td>
                  </tr>
                  <tr>
                    <td>24.12.2025</td>
                    <td>29 190 375</td>
                    <td>❌</td>
                  </tr>
                  <tr className={styles.recommended}>
                    <td>29.12.2025</td>
                    <td>25 947 000</td>
                    <td>✅ Вход</td>
                  </tr>
                  <tr>
                    <td>16.01.2026</td>
                    <td>22 703 625</td>
                    <td>⚠️ Риск</td>
                  </tr>
                  <tr>
                    <td>21.01.2026</td>
                    <td>19 460 250</td>
                    <td>⚠️ Риск</td>
                  </tr>
                  <tr>
                    <td>26.01.2026</td>
                    <td>16 216 875</td>
                    <td>🔥 Мин.</td>
                  </tr>
                </tbody>
              </table>

              {/* --- ЛЕГЕНДА --- */}
              <div className={styles.legendBlock}>
                <div className={styles.legendItem}>
                  <span className={styles.legendIcon}>❌</span> Пропущенный этап
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendIcon}>📉</span> Текущий прием заявок
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendIcon}>✅</span> <strong>Рекомендуем покупать</strong>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendIcon}>⚠️</span> Риск выкупа конкурентами
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendIcon}>🔥</span> Минимальная цена (шанс &lt; 5%)
                </div>
              </div>
              {/* --- КОНЕЦ ЛЕГЕНДЫ --- */}
            </div>

            <div className={styles.ctaBlock}>
              {/* <p className={styles.ctaText}>Хотите забрать этот лот?</p> */}
              {/* <a href="tel:+79000000000" className={styles.callButton}>Позвонить агенту</a> */}
              <a href="mailto:info@s-lot.ru?subject=Запрос финмодели Магнит Саратов" className={styles.emailLink}>
                📊 Получить фин. модель
              </a>

              <p className={styles.hint}>
                Поможем подать заявку и выкупить лот без КЭП
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
