'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './popular-lots.module.css';

interface PopularLot {
    id: string;
    publicId: number;
    title: string;
    slug: string;
    viewCount: number;
    hasEvaluation: boolean;
}

export default function PopularLotsClient() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [lots, setLots] = useState<PopularLot[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLots = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/lots/popular?limit=50`,
                { credentials: 'include' }
            );
            if (res.ok) {
                const data = await res.json();
                setLots(data);
            }
        } catch (e) {
            console.error('Ошибка загрузки популярных лотов', e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!loading && (!user || !user.isAdmin)) {
            router.push('/');
            return;
        }

        if (user?.isAdmin) {
            fetchLots();
        }
    }, [user, loading, router, fetchLots]);

    if (loading || isLoading) {
        return <div className={styles.container}>Загрузка...</div>;
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.heading}>Популярные лоты</h1>
            <p className={styles.subheading}>
                Топ лотов по количеству просмотров. Здесь вы можете выбрать лоты для ручного запуска анализа.
            </p>

            {lots.length === 0 ? (
                <div className={styles.emptyState}>Нет данных о просмотрах лотов.</div>
            ) : (
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Заголовок</th>
                            <th>Просмотры</th>
                            <th>Анализ ИИ</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lots.map(lot => (
                            <tr key={lot.id}>
                                <td>#{lot.publicId}</td>
                                <td className={styles.descriptionCell}>{lot.title}</td>
                                <td style={{ fontWeight: 'bold' }}>{lot.viewCount}</td>
                                <td>
                                    {lot.hasEvaluation ? (
                                        <span style={{ color: '#16a34a', fontWeight: 'bold' }}>Есть</span>
                                    ) : (
                                        <span style={{ color: '#666' }}>Нет</span>
                                    )}
                                </td>
                                <td>
                                    <Link href={`/lot/${lot.publicId}`} className={styles.openLink} target="_blank">
                                        Открыть →
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
