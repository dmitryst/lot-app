// app/favorites/page.tsx
'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Lot } from '@/types';
import { LotItem } from '@/components/LotItem';
import Pagination from '@/components/Pagination';

// Импортируем стили ГЛАВНОЙ страницы, чтобы сетка была идентичной
import pageStyles from '../page.module.css';
import styles from './favorites.module.css'; // Локальные стили только для заголовка/пустого состояния

const PAGE_SIZE = 20;

export default function FavoritesPageWrapper() {
    return (
        <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Загрузка...</div>}>
            <FavoritesPage />
        </Suspense>
    );
}

function FavoritesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const page = Number(searchParams.get('page')) || 1;

    const [lots, setLots] = useState<Lot[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        // Помечаем, что мы находимся в разделе Избранное
        sessionStorage.setItem('isFromFavorites', 'true');
        // Сохраняем текущую страницу избранного, чтобы вернуться на неё
        sessionStorage.setItem('favoritesQuery', window.location.search);
    }, [searchParams]);

    const updateQuery = useCallback((updates: Record<string, string | number>) => {
        const currentParams = new URLSearchParams(window.location.search);
        Object.entries(updates).forEach(([key, value]) => {
            currentParams.set(key, String(value));
        });
        router.push(`${pathname}?${currentParams.toString()}`);
    }, [pathname, router]);

    const onPageChange = (nextPage: number) => {
        updateQuery({ page: nextPage });
    };

    const fetchFavoriteLots = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/favorites?page=${page}&pageSize=${PAGE_SIZE}`, {
                method: 'GET',
                credentials: 'include',
            });

            if (res.ok) {
                const data = await res.json();
                setLots(data.items || []);
                setTotalPages(data.totalPages || 0);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user, page]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push(`/login?returnUrl=/favorites`);
            return;
        }
        fetchFavoriteLots();
    }, [user, authLoading, router, fetchFavoriteLots]);

    if (authLoading || (loading && user && lots.length === 0)) {
        return (
            <main className={pageStyles.main}>
                <section className={pageStyles.contentArea}>
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Загрузка...</div>
                </section>
            </main>
        );
    }

    if (!user) return null;

    return (
        // Используем те же классы контейнера, что и на главной
        <main className={pageStyles.main}>
            <section className={pageStyles.contentArea}>
                <div className={pageStyles.filtersContainer}>
                    {/* Вместо фильтров - просто заголовок */}
                    <h1 className={styles.pageTitle}>Избранное</h1>
                </div>

                {lots.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>В избранном пока ничего нет.</p>
                        <Link href="/" className={styles.backButton}>
                            Перейти к поиску лотов
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className={pageStyles.lotsGrid}>
                            {lots.map((lot: Lot) => (
                                <LotItem
                                    key={lot.id}
                                    lot={lot}
                                />
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
            </section>
        </main>
    );
}
