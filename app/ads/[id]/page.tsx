// app/ads/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './ad-details.module.css';
import ChatModal from '@/components/ChatModal/ChatModal';

interface UserAd {
  id: string;
  title: string;
  description: string;
  price: number;
  region?: string;
  category?: string;
  createdAt: string;
  status: number;
  imageUrls: string[];
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-RU', { 
    style: 'currency', currency: 'RUB', maximumFractionDigits: 0 
  }).format(price);
};

export default function AdDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [ad, setAd] = useState<UserAd | null>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState<string>('/placeholder.png');
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/ads/${id}`);
        if (!res.ok) {
          if (res.status === 404) router.replace('/ads');
          throw new Error('Объявление не найдено');
        }
        const data = await res.json();
        setAd(data);
        if (data.imageUrls && data.imageUrls.length > 0) {
          setMainImage(data.imageUrls[0]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchAd();
  }, [id, router]);

  if (loading) {
    return <div className={styles.loading}>Загрузка объявления...</div>;
  }

  if (!ad) return null;

  return (
    <main className={styles.main}>
      <Link href="/ads" className={styles.backLink}>
        ← Вернуться к списку
      </Link>

      <div className={styles.container}>
        {/* ЛЕВАЯ КОЛОНКА: Фотографии */}
        <div className={styles.gallerySection}>
          <div className={styles.mainImageContainer}>
            <img src={mainImage} alt={ad.title} className={styles.mainImage} />
          </div>
          
          {ad.imageUrls && ad.imageUrls.length > 1 && (
            <div className={styles.thumbnailsContainer}>
              {ad.imageUrls.map((img, idx) => (
                <div 
                  key={idx} 
                  className={`${styles.thumbnail} ${mainImage === img ? styles.thumbnailActive : ''}`}
                  onClick={() => setMainImage(img)}
                >
                  <img src={img} alt={`Фото ${idx + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ПРАВАЯ КОЛОНКА: Информация */}
        <div className={styles.infoSection}>
          {ad.region && <div className={styles.regionBadge}>{ad.region}</div>}
          
          <h1 className={styles.title}>{ad.title}</h1>
          <div className={styles.price}>{formatPrice(ad.price)}</div>
          
          <div className={styles.metaRow}>
            <span>Опубликовано: {new Date(ad.createdAt).toLocaleDateString('ru-RU')}</span>
            <span>ID: {ad.id.split('-')[0]}</span>
            {ad.category && <span>Категория: {ad.category}</span>}
          </div>

          <div className={styles.divider} />

          <div className={styles.descriptionBlock}>
            <h2>Описание</h2>
            {/* white-space: pre-wrap сохраняет переносы строк из текста */}
            <p className={styles.description}>{ad.description}</p>
          </div>

          {/* Кнопка действия (например, Позвонить/Написать) */}
          <button 
            className={styles.contactBtn} 
            onClick={() => setIsChatOpen(true)}
          >
            Связаться с продавцом
          </button>
        </div>
      </div>

      <ChatModal 
        adId={ad.id} 
        adTitle={ad.title} 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
    </main>
  );
}