'use client';

import Link from 'next/link';
import styles from './AdCard.module.css';

interface UserAd {
  id: string | number;
  title: string;
  description: string;
  price: number;
  createdAt: string;
  status: number;
  imageUrls: string[];
}

interface AdCardProps {
  ad: UserAd;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-RU', { 
    style: 'currency', currency: 'RUB', maximumFractionDigits: 0 
  }).format(price);
};

export default function AdCard({ ad }: AdCardProps) {
  const coverImage = ad.imageUrls && ad.imageUrls.length > 0 
    ? ad.imageUrls[0] 
    : '/placeholder.png';

  const formattedDate = new Date(ad.createdAt).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <Link href={`/ads/${ad.id}`} className={styles.cardLink}>
      <div className={styles.adCard}>
        <div className={styles.imageContainer}>
          <img src={coverImage} alt={ad.title} className={styles.image} />
          <div className={styles.badge}>Частное объявление</div>
        </div>
        
        <div className={styles.contentContainer}>
          <div className={styles.adHeader}>
            <h3 className={styles.adTitle}>{ad.title || 'Без названия'}</h3>
            <div className={styles.adPrice}>{formatPrice(ad.price)}</div>
          </div>
          
          <p className={styles.adDescription}>{ad.description}</p>
          
          <div className={styles.adFooter}>
            <span className={styles.adDate}>{formattedDate}</span>
            <span className={styles.detailsBtn}>Посмотреть →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}