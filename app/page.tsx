// app/page.tsx
'use client';

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import debounce from 'lodash.debounce';

import { CATEGORIES_TREE, BIDDING_TYPES, PAGE_SIZE } from './data/constants';

import LotCard from '../components/LotCard';
import Pagination from '../components/Pagination';
import CategorySelect from '../components/CategorySelect';
import styles from './page.module.css';
import { Lot } from '../types';

const formatNumberWithSpaces = (value: string) => {
  if (!value) return '';
  // Удаляем все нечисловые символы и добавляем пробелы как разделители
  const cleanValue = value.replace(/\D/g, '');
  return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ЕДИНСТВЕННЫЙ источник данных для API — URL
  const page = Number(searchParams.get('page')) || 1;
  const biddingType = searchParams.get('biddingType') || 'Все';
  const priceFromParam = searchParams.get('priceFrom') || '';
  const priceToParam = searchParams.get('priceTo') || '';

  // Локальный UI-стейт, инициализируем из URL на каждом рендере
  // (контролируемые элементы должны сразу отражать URL)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBiddingType, setSelectedBiddingType] = useState(biddingType);
  const [priceFrom, setPriceFrom] = useState(priceFromParam);
  const [priceTo, setPriceTo] = useState(priceToParam);

  // Синхронизация UI <- URL (чтобы при Back/Forward видны были актуальные значения)
  // --- СИНХРОНИЗАЦИЯ UI С URL ---
  // Этот блок важен, чтобы при перезагрузке или навигации по истории
  // UI отражал состояние из URL
  useEffect(() => {
    setSelectedCategories(searchParams.getAll('categories'));
    setSelectedBiddingType(searchParams.get('biddingType') || 'Все');
    setPriceFrom(searchParams.get('priceFrom') || '');
    setPriceTo(searchParams.get('priceTo') || '');
  }, [searchParams]);

  // Утилита: атомарно обновить URL-параметры
  const updateQuery = useCallback((updates: Record<string, string | number | null | string[]>) => {
    const currentParams = new URLSearchParams(window.location.search);

    Object.entries(updates).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        currentParams.delete(key);
        value.forEach(item => currentParams.append(key, item));
      } else if (value === null || value === undefined || value === '' || value === 'Все') {
        currentParams.delete(key);
      } else {
        currentParams.set(key, String(value));
      }
    });

    router.push(`${pathname}?${currentParams.toString()}`);
  }, [pathname, router]);

  // Они только формируют новый URL, а загрузкой занимается useEffect выше.
  const handleCategoryChange = useCallback((newSelected: string[]) => {
    updateQuery({ categories: newSelected, page: 1 });
  }, [updateQuery]);

  // Handlers — пишут и в локальный UI, и сразу в URL
  const onBiddingTypeClick = (value: string) => {
    setSelectedBiddingType(value);
    updateQuery({ biddingType: value, page: 1 });
  };

  const debouncedPriceUpdate = useMemo(
    () => debounce((from: string, to: string) => {
      updateQuery({
        priceFrom: from.replace(/\D/g, ''),
        priceTo: to.replace(/\D/g, ''),
        page: 1,
      });
    }, 500),
    [updateQuery]
  );

  const onPriceFromChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    setPriceFrom(clean);
    debouncedPriceUpdate(clean, priceTo);
  };

  const onPriceToChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    setPriceTo(clean);
    debouncedPriceUpdate(priceFrom, clean);
  };

  const onPageChange = (nextPage: number) => {
    updateQuery({ page: nextPage });
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

    // searchParams - единственный источник правды.
    // Просто берем все параметры из текущего URL.
    const params = new URLSearchParams(searchParams.toString());
    params.set('pageSize', String(PAGE_SIZE));

    try {
      const res = await fetch(`${apiUrl}/api/lots/list?${params.toString()}`);

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
  }, [searchParams]);

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

  // --- JSX для рендеринга фильтров ---
  const filtersSidebarContent = (
    <>
      <div className={styles.filterGroup}>
        {/* Категории */}
        <CategorySelect
          categories={CATEGORIES_TREE}
          selectedCategories={selectedCategories}
          onChange={handleCategoryChange}
        />
      </div>

      <div className={styles.filterGroup}>
        <h3 className={styles.filterTitle}>Вид торгов</h3>
        <div className={styles.buttonGroup}>
          <button onClick={() => onBiddingTypeClick('Все')} className={selectedBiddingType === 'Все' ? styles.activeFilter : styles.filterButton}>Все</button>
          {BIDDING_TYPES.map(type => (
            <button key={type} onClick={() => onBiddingTypeClick(type)} className={selectedBiddingType === type ? styles.activeFilter : styles.filterButton}>{type}</button>
          ))}
        </div>
      </div>

      <div className={styles.filterGroup}>
        <h3 className={styles.filterTitle}>Начальная цена, ₽</h3>
        <div className={styles.priceFilterInputs}>
          <input
            type="text"
            className={styles.priceInput}
            placeholder="от"
            value={formatNumberWithSpaces(priceFrom)}
            onChange={(e) => onPriceFromChange(e.target.value)}
          />
          <span className={styles.priceSeparator}>—</span>
          <input
            type="text"
            className={styles.priceInput}
            placeholder="до"
            value={formatNumberWithSpaces(priceTo)}
            onChange={(e) => onPriceToChange(e.target.value)}
          />
        </div>
      </div>
    </>
  );

  return (
    <main className={styles.main}>
      <div className={styles.mapBanner}>
        <Link href="/map" className={styles.mapLinkButton}>
          Смотреть недвижимость на карте
        </Link>
      </div>

      <section className={styles.contentArea}>
        <div className={styles.filtersContainer}>
          <button
            className={styles.toggleFiltersButton}
            onClick={() => setIsFiltersVisible(!isFiltersVisible)}
          >
            {isFiltersVisible ? 'Скрыть фильтры' : 'Показать фильтры'}
          </button>
          <aside className={`${styles.filtersSidebar} ${isFiltersVisible ? styles.sidebarVisible : ''}`}>
            {filtersSidebarContent}
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
                // Оборачиваем Link в div с onClick для сохранения скролла
                <div
                  key={lot.id}
                  onMouseDown={() => {
                    sessionStorage.setItem('scrollPosition', String(window.scrollY));
                    // Сохраняем весь query string (например, "?page=5&category=Автомобили")
                    sessionStorage.setItem('lotListQuery', window.location.search);
                  }}
                >
                  <Link href={`/lot/${lot.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <LotCard key={lot.id} lot={lot} imageUrl={lot.imageUrl} />
                  </Link>
                </div>
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
