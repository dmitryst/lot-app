import Link from 'next/link';
import styles from './PromoCard.module.css';
import { PromoLot } from '@/app/promo/data/promo-lots';

type Props = {
  lot: PromoLot;
  isHot?: boolean; // Если true, выделяем визуально
};

export default function PromoCard({ lot, isHot }: Props) {
  // Определяем статус (если дата прошла или цена последняя)
  // Для простоты можно добавить поле isSold в data, или вычислять
  const isSold = lot.schedule?.some(s => s.statusText.includes('продан')); // Упрощенно

  return (
    <Link href={`/promo/${lot.id}`} className={`${styles.card} ${isHot ? styles.hot : ''}`}>
      <div className={styles.imageWrapper}>
        <img src={lot.img} alt={lot.title} />
        <div className={styles.badges}>
          {lot.badges?.slice(0, 1).map((b, i) => (
            <span key={i} className={styles.badge}>{b}</span>
          ))}
          {isSold && <span className={styles.soldBadge}>Продан</span>}
        </div>
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{lot.title}</h3>
        <p className={styles.subtitle}>{lot.subtitle || lot.description.slice(0, 60) + '...'}</p>
        <div className={styles.footer}>
          <span className={styles.price}>
            {lot.priceTarget 
              ? `Цель: ${Number(lot.priceTarget.replace(/\s/g, '')).toLocaleString()} ₽` 
              : 'Цена снижается'}
          </span>
          <span className={styles.arrow}>→</span>
        </div>
      </div>
    </Link>
  );
}
