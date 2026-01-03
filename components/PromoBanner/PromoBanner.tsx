'use client';

import Link from 'next/link';
import styles from './PromoBanner.module.css';
import { usePromoVisibility } from '../../app/hooks/usePromoVisibility';

export type PromoBannerProps = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  badge?: string;        // например: "🔥 Инвест-лот месяца"
  buttonText?: string;   // например: "Смотреть расчёт →"
  note?: string;         // маленькая приписка (необязательно)
};

export default function PromoBanner({
  id,
  title,
  subtitle,
  href,
  badge,
  buttonText = 'Смотреть расчёт →',
  note,
}: PromoBannerProps) {
  const { isVisible, isMounted, hidePromo } = usePromoVisibility(id);

  if (!isMounted) return null;
  if (!isVisible) return null; // Просто не рендерим ничего, если скрыто

  return (
    <div className={styles.promoBanner}>
      <Link href={href} className={styles.promoContent}>
        <div className={styles.promoText}>
          {badge && <span className={styles.promoBadge}>{badge}</span>}
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.subtitle}>{subtitle}</p>
          {note && <p className={styles.note}>{note}</p>}
        </div>
        {/* <button className={styles.button}>{buttonText}</button> */}
      </Link>
      
      {/* Кнопка закрытия (вне Link, чтобы клик не открывал ссылку) */}
      <button 
        className={styles.closeButton}
        onClick={(e) => {
            e.preventDefault();
            hidePromo();
        }}
        aria-label="Скрыть"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  );
}
