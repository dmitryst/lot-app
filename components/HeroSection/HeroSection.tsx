// components/HeroSection/HeroSection.tsx
import React from 'react';
import styles from './HeroSection.module.css';

export const HeroSection = () => {
  return (
    <section className={styles.container}>
      <h1 className={styles.title}>
        Сервис по поиску торгов <span className={styles.highlight}>по банкротству</span>
      </h1>
      <p className={styles.subtitle}>
        Покупайте недвижимость, автомобили и оборудование с дисконтом до 80%.
        Все лоты с проверенных площадок в одном месте.
      </p>
    </section>
  );
};

export default HeroSection;
