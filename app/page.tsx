// app/page.tsx
'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';

import { PAGE_SIZE } from './data/constants';

import { LotItem } from '@/components/LotItem';
import Pagination from '../components/Pagination';
import Filters from '../components/Filters/Filters';
import styles from './page.module.css';
import { Lot } from '../types';

import PromoGrid from '@/components/PromoGrid/PromoGrid';
import HeroSection from '@/components/HeroSection/HeroSection';
import { useAuth } from '@/context/AuthContext';
import { useQueryNavigation } from '@/hooks/useQueryNavigation';

// Обертка для основного компонента, чтобы использовать Suspense
export default function PageWrapper() {
  return (
    <Suspense fallback={<div>Загрузка...</div>}>
      <Page />
    </Suspense>
  );
}

// --- Основной компонент страницы ---
function Page() {
  const { updateQuery, params } = useQueryNavigation();
  const { user } = useAuth();

  // Источник правды для UI и API — params из useQueryNavigation (синхронизирован с window.location)
  const page = Number(params.get('page')) || 1;
  const biddingType = params.get('biddingType') || 'Все';
  const priceFromParam = params.get('priceFrom') || '';
  const priceToParam = params.get('priceTo') || '';
  const searchQueryParam = params.get('searchQuery') || '';
  const categoriesParam = params.getAll('categories');
  const isSharedOwnershipParam = params.get('isSharedOwnership');
  const regionsParam = params.getAll('regions');

  // Извлекаем динамические фильтры из URL
  const dynamicFiltersParam: Record<string, string> = {};
  params.forEach((value, key) => {
    if (key.startsWith('attr_')) {
      dynamicFiltersParam[key.substring(5)] = value;
    }
  });

  useEffect(() => {
    // Сбрасываем флаг Избранного, так как мы на главной странице
    sessionStorage.setItem('isFromFavorites', 'false');
    // Сохраняем текущие параметры главной страницы
    const query = params.toString();
    sessionStorage.setItem('lotListQuery', query ? `?${query}` : '');
  }, [params]);

  const onPageChange = (nextPage: number) => {
    updateQuery({ page: nextPage }, { scroll: false });
  };

  // Данные
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  // Загрузка данных ТОЛЬКО из searchParams
  const fetchLots = useCallback(async () => {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL;
    if (!apiUrl) {
      console.error("API URL не определен!");
      setLoading(false);
      return;
    }

    const apiParams = new URLSearchParams(params.toString());
    apiParams.set('pageSize', String(PAGE_SIZE));

    try {
      const res = await fetch(`${apiUrl}/api/lots/list?${apiParams.toString()}`);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Не удалось загрузить лоты: ${errorText}`);
      }

      const data = await res.json();

      setLots(data.items);
      setTotalPages(data.totalPages);
    } catch (e) {
      console.error('Ошибка при загрузке лотов:', e);
      setLots([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    let isCancelled = false;

    const fetchDataAndScroll = async () => {
      await fetchLots();

      // Если компонент размонтировался, пока грузились данные, ничего не делаем
      if (isCancelled) return;

      // Проверяем наличие сохраненной позиции скролла
      const scrollPosition = sessionStorage.getItem('scrollPosition');
      if (scrollPosition) {
        // Ждем следующего "кадра" отрисовки, чтобы DOM гарантированно обновился
        requestAnimationFrame(() => {
          window.scrollTo(0, parseInt(scrollPosition, 10));
          sessionStorage.removeItem('scrollPosition');
        });
      }
    };

    fetchDataAndScroll();

    // Функция очистки, которая сработает, если компонент размонтируется
    return () => {
      isCancelled = true;
    };
  }, [fetchLots]);

  return (
    <main className={styles.main}>
      <div className={styles.heroWrapper}>
        <HeroSection />

        <div className={styles.mapBanner}>
          <Link href="/map" className={styles.mapLinkButton}>
            Смотреть недвижимость на карте
          </Link>
        </div>

        {/* --- ПРОМО БАННЕР (Магнит Саратов) --- */}
        {/* <div className={styles.promoBanner} style={{ position: 'relative', overflow: 'hidden', padding: '20px' }}>

        <div className={styles.promoContent} style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '15px',
          width: '100%',
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{ flex: '1 1 300px', paddingRight: '10px' }}>
            <div className={styles.promoBadge}>🔥 Инвест-лот месяца: Магнит (Саратов)</div>
            <div className={styles.promoText}>
              Доходность 20%. Вход от 24 млн руб. Федеральный арендатор.
            </div>
          </div>

          <Link href="/gab/magnit-saratov" className={styles.promoButton} style={{
            whiteSpace: 'nowrap',
            flex: '1 1 auto',
            textAlign: 'center',
            minWidth: '200px',
            maxWidth: '100%'
          }}>
            Смотреть расчет
          </Link>
        </div> */}

        {/* ПЕЧАТЬ */}
        {/* <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-15deg)',
          border: '1px solid #c53030',
          padding: '5px 15px',
          color: '#c53030',
          backgroundColor: 'transparent',
          zIndex: 20,
          pointerEvents: 'none',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: '400',
            fontFamily: 'Arial, sans-serif',
            lineHeight: '1.1'
          }}>
            Продано
          </div>
          <div style={{
            fontSize: '1.1rem',
            fontWeight: '700', // ЖИРНЫЙ ШРИФТ ДЛЯ ЦЕНЫ
            fontFamily: 'Arial, sans-serif',
            marginTop: '4px'
          }}>
            35 678 900 руб.
          </div>
        </div>
      </div> */}

        {/* Скрываем дом в Глазинино */}
        {/* <div className={styles.promoWrapper}>ы
          <PromoGrid hotSlug="dom-v-glazinino" maxArchived={0} />
        </div> */}
      </div>


      {user?.isAdmin && (
        <div className={styles.actionBannersGrid}>
          <div className={styles.addAdBanner}>
            <div className={styles.addAdContent}>
              <h3>Частные объявления</h3>
              <p>Разместите объявление бесплатно или найдите предложения от других инвесторов.</p>
            </div>
            {/* Обертка для двух кнопок */}
            <div className={styles.addAdButtons}>
              <Link href="/add-ad" className={styles.addAdLinkButton}>
                + Добавить объявление
              </Link>
              <Link href="/ads" className={styles.viewAdsLinkButton}>
                Смотреть объявления
              </Link>
            </div>
          </div>
        </div>
      )}

      <section className={styles.contentArea}>
        <div className={styles.filtersContainer}>
          <button
            className={styles.toggleFiltersButton}
            onClick={() => setIsFiltersVisible(!isFiltersVisible)}
          >
            {isFiltersVisible ? 'Скрыть фильтры' : 'Показать фильтры'}
          </button>

          {/* Фильтры */}
          <aside className={`${styles.filtersSidebar} ${isFiltersVisible ? styles.sidebarVisible : ''}`}>
            <Filters
              categories={categoriesParam}
              biddingType={biddingType}
              priceFrom={priceFromParam}
              priceTo={priceToParam}
              searchQuery={searchQueryParam}
              isSharedOwnership={isSharedOwnershipParam}
              regions={regionsParam}
              dynamicFilters={dynamicFiltersParam}
              onUpdate={updateQuery}
            />
          </aside>
        </div>

        {loading ? (
          <div className={styles.loadingMessage}>Загрузка лотов...</div>
        ) : lots.length > 0 ? (
          <>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />

            <div className={styles.lotsGrid}>
              {lots.map((lot: Lot) => (
                <LotItem
                  key={lot.id}
                  lot={lot}
                // если нужен доп. класс обёртки от page.module.css
                // className={styles.lotWrapper}
                />
              ))}
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </>
        ) : (
          <p>По вашему запросу лотов не найдено.</p>
        )}
      </section>
    </main>
  );
}
