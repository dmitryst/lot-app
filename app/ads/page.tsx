// app/ads/page.tsx
'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import Pagination from '@/components/Pagination';
import styles from './ads.module.css';
import AdCard from '@/components/AdCard/AdCard';

const PAGE_SIZE = 20;

// Описываем тип данных, который приходит с бэкенда
interface UserAd {
  id: string | number;
  title: string;
  description: string;
  price: number;
  createdAt: string;
  status: number;
  imageUrls: string[];
}

// Функция для форматирования цены
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ru-RU', { 
    style: 'currency', 
    currency: 'RUB', 
    maximumFractionDigits: 0 
  }).format(price);
};

export default function AdsPageWrapper() {
  return (
    <Suspense fallback={<div className={styles.loading}>Загрузка...</div>}>
      <AdsPage />
    </Suspense>
  );
}

function AdsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [showSuccessAlert, setShowSuccessAlert] = useState(false);

  useEffect(() => {
    if (searchParams.get('success') === 'ad_created') {
      setShowSuccessAlert(true);
      // Убираем параметр из URL, чтобы при обновлении страницы алерт не появлялся снова
      const newUrl = pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Скрываем через 5 секунд
      setTimeout(() => setShowSuccessAlert(false), 5000);
    }
  }, [searchParams, pathname]);

  const page = Number(searchParams.get('page')) || 1;

  const [ads, setAds] = useState<UserAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);

  const updateQuery = useCallback((updates: Record<string, string | number>) => {
    const currentParams = new URLSearchParams(window.location.search);
    Object.entries(updates).forEach(([key, value]) => {
      currentParams.set(key, String(value));
    });
    router.push(`${pathname}?${currentParams.toString()}`);
  }, [pathname, router]);

  const onPageChange = (nextPage: number) => {
    updateQuery({ page: nextPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/ads?page=${page}&pageSize=${PAGE_SIZE}`);
      
      if (res.ok) {
        const data = await res.json();
        
        setAds(data.ads || []);
        
        // Считаем количество страниц: (Всего элементов / Размер страницы), округляем в большую сторону
        const totalItems = data.total || 0;
        setTotalPages(Math.ceil(totalItems / PAGE_SIZE));
      }
    } catch (e) {
      console.error('Ошибка загрузки объявлений:', e);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1 className={styles.title}>Частные объявления</h1>
        <Link href="/add-ad" className={styles.addAdButton}>
          + Добавить объявление
        </Link>
      </div>

      {showSuccessAlert && (
        <div className={styles.successAlert}>
          Объявление успешно создано и отправлено на модерацию. Оно появится в списке после проверки администратором.
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Загрузка объявлений...</div>
      ) : ads.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Пока нет активных объявлений.</p>
          <Link href="/" className={styles.backButton}>Вернуться на главную</Link>
        </div>
      ) : (
        <>
          <div className={styles.adsGrid}>
            {ads.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          )}
        </>
      )}
    </main>
  );
}