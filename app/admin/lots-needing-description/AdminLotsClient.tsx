'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './admin-lots.module.css';

interface LotNeedingDescription {
    id: string;
    publicId: number;
    lotNumber?: string | null;
    title?: string | null;
    description?: string | null;
    startPrice?: number | null;
    tradeStatus?: string | null;
    createdAt: string;
    tradeNumber?: string | null;
    platform?: string | null;
    url: string;
}

interface PaginatedResponse {
    items: LotNeedingDescription[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export default function AdminLotsClient() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [lots, setLots] = useState<LotNeedingDescription[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLots = useCallback(async (currentPage: number) => {
        setIsLoading(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/admin/lots/needs-description?page=${currentPage}&pageSize=50&activeOnly=true`,
                { credentials: 'include' }
            );
            if (res.ok) {
                const data: PaginatedResponse = await res.json();
                setLots(data.items);
                setTotalPages(data.totalPages);
                setTotalCount(data.totalCount);
                setPage(data.page);
            }
        } catch (e) {
            console.error('Ошибка загрузки лотов', e);
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
            fetchLots(page);
        }
    }, [user, loading, router, fetchLots, page]);

    const formatPrice = (price?: number | null) => {
        if (price == null) return '—';
        return `${price.toLocaleString('ru-RU')} ₽`;
    };

    const truncate = (text?: string | null, max = 200) => {
        if (!text) return '—';
        return text.length > max ? `${text.slice(0, max)}…` : text;
    };

    if (loading || isLoading) {
        return <div className={styles.container}>Загрузка...</div>;
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.heading}>Лоты без описания имущества</h1>
            <p className={styles.subheading}>
                {totalCount > 0
                    ? `${totalCount} активных лотов требуют дополнения описания`
                    : 'Все активные лоты имеют описание имущества'}
            </p>
            <p className={styles.workflowHint}>
                Допишите описание на странице лота и нажмите «Сохранить» — лот встанет в общую очередь
                классификации (батчи по 10, обычно каждые 10–15 мин). Кнопка «Переклассифицировать» не обязательна.
            </p>

            {lots.length === 0 ? (
                <div className={styles.emptyState}>Нет лотов, ожидающих доработки описания.</div>
            ) : (
                <>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Торги</th>
                                <th>Описание</th>
                                <th>Цена</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {lots.map((lot) => (
                                <tr key={lot.id}>
                                    <td>
                                        #{lot.publicId}
                                        {lot.lotNumber && <div>Лот {lot.lotNumber}</div>}
                                    </td>
                                    <td>
                                        <div>{lot.tradeNumber ?? '—'}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{lot.platform}</div>
                                    </td>
                                    <td className={styles.descriptionCell}>{truncate(lot.description)}</td>
                                    <td className={styles.price}>{formatPrice(lot.startPrice)}</td>
                                    <td>
                                        <Link href={lot.url} className={styles.openLink}>
                                            Открыть →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                className={styles.pageBtn}
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                            >
                                ← Назад
                            </button>
                            <span className={styles.pageInfo}>
                                Страница {page} из {totalPages}
                            </span>
                            <button
                                className={styles.pageBtn}
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Вперёд →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
