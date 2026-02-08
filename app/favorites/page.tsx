// app/favorites/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Lot } from '@/types';
import { LotItem } from '@/components/LotItem';

// Импортируем стили ГЛАВНОЙ страницы, чтобы сетка была идентичной
import pageStyles from '../page.module.css';
import styles from './favorites.module.css'; // Локальные стили только для заголовка/пустого состояния

export default function FavoritesPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [lots, setLots] = useState<Lot[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push(`/login?returnUrl=/favorites`);
            return;
        }

        const fetchFavoriteLots = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/favorites`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (res.ok) {
                    const data = await res.json();
                    setLots(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchFavoriteLots();
    }, [user, authLoading, router]);

    if (authLoading || (loading && user)) {
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
                    // Используем ту же сетку lotsGrid из page.module.css
                    <div className={pageStyles.lotsGrid}>
                        {lots.map((lot: Lot) => (
                            <LotItem
                                key={lot.id}
                                lot={lot}
                            />
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
