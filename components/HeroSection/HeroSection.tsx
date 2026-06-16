// components/HeroSection/HeroSection.tsx
import React from 'react';
import Link from 'next/link';
import styles from './HeroSection.module.css';

export const HeroSection = () => {
  return (
    <section className={styles.container}>
      <h1 className={styles.title}>
        Поиск и выкуп лотов с торгов <span className={styles.highlight}>по банкротству</span>
      </h1>
      <p className={styles.subtitle}>
        Комиссия за участие - 5&nbsp;000&nbsp;₽, 
        вознаграждение за победу на торгах - 20&nbsp;000&nbsp;₽ + 0,5%.{' '}
        <Link href="/agent-info" className={styles.subtitleLink}>
          Подробнее об условиях
        </Link>
      </p>
    </section>
  );
};

export default HeroSection;
