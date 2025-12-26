import Link from 'next/link';
import styles from './PromoBanner.module.css';

export type PromoBannerProps = {
  title: string;
  subtitle: string;
  href: string;
  badge?: string;        // например: "🔥 Инвест-лот месяца"
  buttonText?: string;   // например: "Смотреть расчёт →"
  note?: string;         // маленькая приписка (необязательно)
};

export default function PromoBanner({
  title,
  subtitle,
  href,
  badge,
  buttonText = 'Смотреть расчёт →',
  note,
}: PromoBannerProps) {
  return (
    <div className={styles.promoBanner}>
      <div className={styles.promoContent}>
        <div className={styles.promoText}>
          {badge ? <div className={styles.promoBadge}>{badge}</div> : null}
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.subtitle}>{subtitle}</p>
          {note ? <p className={styles.note}>{note}</p> : null}
        </div>

        <Link href={href} className={styles.promoButton}>
          {buttonText}
        </Link>
      </div>
    </div>
  );
}
