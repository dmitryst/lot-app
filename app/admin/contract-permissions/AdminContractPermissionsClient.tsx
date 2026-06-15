'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './admin-contract-permissions.module.css';

interface ContractPermission {
    id: string;
    userId: string;
    userEmail: string;
    userName?: string | null;
    lotId: string;
    lotPublicId: number;
    lotTitle?: string | null;
    lotStartPrice?: number | null;
    fixedRewardAmount: number;
    successRewardAmount: number;
    createdAt: string;
    lotUrl: string;
}

interface PaginatedResponse {
    items: ContractPermission[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

interface EditValues {
    fixedRewardAmount: string;
    successRewardAmount: string;
}

function parseAmount(value: string): number {
    return parseFloat(value.replace(/\s/g, '').replace(',', '.'));
}

export default function AdminContractPermissionsClient() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [permissions, setPermissions] = useState<ContractPermission[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Record<string, EditValues>>({});

    const [userEmail, setUserEmail] = useState('');
    const [lotPublicId, setLotPublicId] = useState('');
    const [fixedRewardAmount, setFixedRewardAmount] = useState('5000');
    const [successRewardAmount, setSuccessRewardAmount] = useState('');

    const fetchPermissions = useCallback(async (currentPage: number) => {
        setIsLoading(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/admin/contract-permissions?page=${currentPage}&pageSize=50`,
                { credentials: 'include' }
            );
            if (res.ok) {
                const data: PaginatedResponse = await res.json();
                setPermissions(data.items);
                setTotalPages(data.totalPages);
                setTotalCount(data.totalCount);
                setPage(data.page);
                setEditValues(
                    Object.fromEntries(
                        data.items.map((p) => [
                            p.id,
                            {
                                fixedRewardAmount: String(p.fixedRewardAmount),
                                successRewardAmount: String(p.successRewardAmount),
                            },
                        ])
                    )
                );
            }
        } catch (e) {
            console.error('Ошибка загрузки разрешений', e);
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
            fetchPermissions(page);
        }
    }, [user, loading, router, fetchPermissions, page]);

    const formatPrice = (price?: number | null) => {
        if (price == null) return '—';
        return `${price.toLocaleString('ru-RU')} ₽`;
    };

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsSubmitting(true);

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/admin/contract-permissions`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userEmail: userEmail.trim(),
                        lotPublicId: parseInt(lotPublicId, 10),
                        fixedRewardAmount: parseAmount(fixedRewardAmount),
                        successRewardAmount: parseAmount(successRewardAmount),
                    }),
                }
            );

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.message || 'Не удалось создать разрешение.');
                return;
            }

            setSuccess('Разрешение создано. Суммы вознаграждения подставятся в договор.');
            setUserEmail('');
            setLotPublicId('');
            setFixedRewardAmount('5000');
            setSuccessRewardAmount('');
            fetchPermissions(1);
            setPage(1);
        } catch {
            setError('Ошибка сети при создании разрешения.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async (id: string) => {
        setError(null);
        setSuccess(null);

        const values = editValues[id];
        const fixed = parseAmount(values?.fixedRewardAmount || '');
        const successAmount = parseAmount(values?.successRewardAmount || '');

        if (!fixed || fixed <= 0 || !successAmount || successAmount <= 0) {
            setError('Укажите корректные суммы вознаграждения.');
            return;
        }

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/admin/contract-permissions/${id}`,
                {
                    method: 'PUT',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fixedRewardAmount: fixed,
                        successRewardAmount: successAmount,
                    }),
                }
            );

            if (!res.ok) {
                setError('Не удалось обновить суммы.');
                return;
            }

            setSuccess('Суммы вознаграждения обновлены.');
            fetchPermissions(page);
        } catch {
            setError('Ошибка сети при обновлении.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Удалить разрешение? Пользователь больше не сможет сформировать договор по этому лоту.')) {
            return;
        }

        setError(null);
        setSuccess(null);

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/admin/contract-permissions/${id}`,
                { method: 'DELETE', credentials: 'include' }
            );

            if (!res.ok) {
                setError('Не удалось удалить разрешение.');
                return;
            }

            setSuccess('Разрешение удалено.');
            fetchPermissions(page);
        } catch {
            setError('Ошибка сети при удалении.');
        }
    };

    if (loading || isLoading) {
        return <div className={styles.container}>Загрузка...</div>;
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.heading}>Разрешения на агентские договоры</h1>
            <p className={styles.subheading}>
                Укажите пользователя, лот и суммы вознаграждения — они подставятся в договор.
            </p>

            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            <form className={styles.form} onSubmit={handleCreate}>
                <div className={styles.field}>
                    <label htmlFor="userEmail">Email пользователя</label>
                    <input
                        id="userEmail"
                        type="email"
                        required
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="client@example.com"
                    />
                </div>
                <div className={styles.field}>
                    <label htmlFor="lotPublicId">ID лота</label>
                    <input
                        id="lotPublicId"
                        type="number"
                        required
                        min={1}
                        value={lotPublicId}
                        onChange={(e) => setLotPublicId(e.target.value)}
                        placeholder="12345"
                    />
                </div>
                <div className={styles.field}>
                    <label htmlFor="fixedRewardAmount">За подачу заявки, ₽</label>
                    <input
                        id="fixedRewardAmount"
                        type="text"
                        required
                        value={fixedRewardAmount}
                        onChange={(e) => setFixedRewardAmount(e.target.value)}
                        placeholder="5 000"
                    />
                </div>
                <div className={styles.field}>
                    <label htmlFor="successRewardAmount">При победе, ₽</label>
                    <input
                        id="successRewardAmount"
                        type="text"
                        required
                        value={successRewardAmount}
                        onChange={(e) => setSuccessRewardAmount(e.target.value)}
                        placeholder="20 000"
                    />
                </div>
                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                    {isSubmitting ? 'Сохранение...' : 'Добавить'}
                </button>
            </form>

            {permissions.length === 0 ? (
                <div className={styles.emptyState}>Нет выданных разрешений.</div>
            ) : (
                <>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Пользователь</th>
                                <th>Лот</th>
                                <th>Цена лота</th>
                                <th>За подачу заявки</th>
                                <th>При победе</th>
                                <th>Создано</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {permissions.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <div>{p.userEmail}</div>
                                        {p.userName && (
                                            <div style={{ fontSize: '0.85rem', color: '#666' }}>{p.userName}</div>
                                        )}
                                    </td>
                                    <td>
                                        <Link href={p.lotUrl} className={styles.lotLink}>
                                            #{p.lotPublicId}
                                        </Link>
                                        {p.lotTitle && (
                                            <div style={{ fontSize: '0.85rem', color: '#666', marginTop: 4 }}>
                                                {p.lotTitle.length > 60
                                                    ? `${p.lotTitle.slice(0, 60)}…`
                                                    : p.lotTitle}
                                            </div>
                                        )}
                                    </td>
                                    <td>{formatPrice(p.lotStartPrice)}</td>
                                    <td>
                                        <input
                                            type="text"
                                            className={styles.rewardInput}
                                            value={editValues[p.id]?.fixedRewardAmount ?? ''}
                                            onChange={(e) =>
                                                setEditValues((prev) => ({
                                                    ...prev,
                                                    [p.id]: {
                                                        ...prev[p.id],
                                                        fixedRewardAmount: e.target.value,
                                                    },
                                                }))
                                            }
                                        />
                                    </td>
                                    <td>
                                        <input
                                            type="text"
                                            className={styles.rewardInput}
                                            value={editValues[p.id]?.successRewardAmount ?? ''}
                                            onChange={(e) =>
                                                setEditValues((prev) => ({
                                                    ...prev,
                                                    [p.id]: {
                                                        ...prev[p.id],
                                                        successRewardAmount: e.target.value,
                                                    },
                                                }))
                                            }
                                        />
                                        <button
                                            type="button"
                                            className={styles.saveBtn}
                                            onClick={() => handleUpdate(p.id)}
                                        >
                                            OK
                                        </button>
                                    </td>
                                    <td>{formatDate(p.createdAt)}</td>
                                    <td>
                                        <button
                                            type="button"
                                            className={styles.deleteBtn}
                                            onClick={() => handleDelete(p.id)}
                                        >
                                            Удалить
                                        </button>
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
                                Страница {page} из {totalPages} ({totalCount} всего)
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
