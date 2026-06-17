'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './admin-unmatched-vehicle.module.css';

interface UnmatchedLot {
    id: string;
    publicId: number;
    lotNumber?: string | null;
    title?: string | null;
    url: string;
    tradeNumber?: string | null;
    platform?: string | null;
    startPrice?: number | null;
    brand?: string | null;
    model?: string | null;
    brandRaw?: string | null;
    modelRaw?: string | null;
    brandMatched?: boolean | null;
    modelMatched?: boolean | null;
}

interface PaginatedResponse {
    items: UnmatchedLot[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

interface VehicleFilterOptions {
    brands: string[];
    modelsByBrand: Record<string, string[]>;
}

interface LotEditState {
    brand: string;
    model: string;
}

const apiBase = process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL;

export default function AdminUnmatchedVehicleClient() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [lots, setLots] = useState<UnmatchedLot[]>([]);
    const [catalog, setCatalog] = useState<VehicleFilterOptions>({ brands: [], modelsByBrand: {} });
    const [edits, setEdits] = useState<Record<number, LotEditState>>({});
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [savingId, setSavingId] = useState<number | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const fetchCatalog = useCallback(async () => {
        const res = await fetch(`${apiBase}/api/lots/vehicle-filter-options`);
        if (res.ok) {
            const data = await res.json();
            setCatalog({
                brands: data.brands ?? [],
                modelsByBrand: data.modelsByBrand ?? {},
            });
        }
    }, []);

    const fetchLots = useCallback(async (currentPage: number) => {
        setIsLoading(true);
        setErrorMessage(null);
        try {
            const res = await fetch(
                `${apiBase}/api/admin/lots/unmatched-vehicle-attributes?page=${currentPage}&pageSize=50&activeOnly=true`,
                { credentials: 'include' }
            );
            if (res.ok) {
                const data: PaginatedResponse = await res.json();
                setLots(data.items);
                setTotalPages(data.totalPages);
                setTotalCount(data.totalCount);
                setPage(data.page);
                setEdits(
                    Object.fromEntries(
                        data.items.map((lot) => [
                            lot.publicId,
                            { brand: lot.brand ?? '', model: lot.model ?? '' },
                        ])
                    )
                );
            } else {
                setErrorMessage('Не удалось загрузить список лотов.');
            }
        } catch (e) {
            console.error('Ошибка загрузки лотов', e);
            setErrorMessage('Ошибка сети при загрузке лотов.');
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
            fetchCatalog();
            fetchLots(page);
        }
    }, [user, loading, router, fetchLots, fetchCatalog, page]);

    const updateEdit = (publicId: number, patch: Partial<LotEditState>) => {
        setEdits((prev) => {
            const current = prev[publicId] ?? { brand: '', model: '' };
            const next = { ...current, ...patch };
            if (patch.brand !== undefined && patch.brand !== current.brand) {
                next.model = '';
            }
            return { ...prev, [publicId]: next };
        });
    };

    const getModelOptions = useCallback(
        (brand: string) => {
            if (!brand) return [];
            return (
                catalog.modelsByBrand[brand]
                ?? Object.entries(catalog.modelsByBrand).find(([key]) => key.toLowerCase() === brand.toLowerCase())?.[1]
                ?? []
            );
        },
        [catalog.modelsByBrand]
    );

    const saveLot = async (publicId: number) => {
        const edit = edits[publicId];
        if (!edit?.brand) {
            setErrorMessage('Выберите марку из справочника или сбросьте марку.');
            return;
        }

        setSavingId(publicId);
        setStatusMessage(null);
        setErrorMessage(null);

        try {
            const res = await fetch(`${apiBase}/api/admin/lots/${publicId}/vehicle-attributes`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brand: edit.brand,
                    model: edit.model || null,
                    removeBrand: false,
                    removeModel: !edit.model,
                }),
            });

            if (!res.ok) {
                setErrorMessage(`Не удалось сохранить лот #${publicId}.`);
                return;
            }

            setStatusMessage(`Лот #${publicId} обновлён.`);
            await fetchLots(page);
        } catch (e) {
            console.error(e);
            setErrorMessage(`Ошибка при сохранении лота #${publicId}.`);
        } finally {
            setSavingId(null);
        }
    };

    const clearField = async (publicId: number, field: 'brand' | 'model') => {
        setSavingId(publicId);
        setStatusMessage(null);
        setErrorMessage(null);

        try {
            const res = await fetch(`${apiBase}/api/admin/lots/${publicId}/vehicle-attributes`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    removeBrand: field === 'brand',
                    removeModel: field === 'model',
                }),
            });

            if (!res.ok) {
                setErrorMessage(`Не удалось обновить лот #${publicId}.`);
                return;
            }

            setStatusMessage(
                field === 'brand'
                    ? `Марка и модель лота #${publicId} сброшены.`
                    : `Модель лота #${publicId} сброшена.`
            );
            await fetchLots(page);
        } catch (e) {
            console.error(e);
            setErrorMessage(`Ошибка при обновлении лота #${publicId}.`);
        } finally {
            setSavingId(null);
        }
    };

    const formatPrice = (price?: number | null) => {
        if (price == null) return '—';
        return `${price.toLocaleString('ru-RU')} ₽`;
    };

    const issueLabel = (lot: UnmatchedLot) => {
        if (lot.brandMatched === false) return 'Марка вне справочника';
        if (lot.model && lot.modelMatched === false) return 'Модель вне справочника';
        return 'Требует нормализации';
    };

    if (loading || isLoading) {
        return <div className={styles.container}>Загрузка...</div>;
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.heading}>Неразобранные марки и модели</h1>
            <p className={styles.subheading}>
                {totalCount > 0
                    ? `${totalCount} активных лотов с маркой или моделью вне справочника`
                    : 'Все активные лоты согласованы со справочником'}
            </p>
            <p className={styles.workflowHint}>
                Выберите значения из справочника и нажмите «Сохранить», либо сбросьте марку или модель.
                После исправления лот исчезнет из списка. В фильтрах на сайте отображаются только значения из справочника.
            </p>

            {statusMessage && <div className={styles.statusMessage}>{statusMessage}</div>}
            {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}

            {lots.length === 0 ? (
                <div className={styles.emptyState}>Нет лотов с неразобранными маркой или моделью.</div>
            ) : (
                <>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Лот</th>
                                <th>Текущие значения</th>
                                <th>Марка</th>
                                <th>Модель</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lots.map((lot) => {
                                const edit = edits[lot.publicId] ?? { brand: '', model: '' };
                                const modelOptions = getModelOptions(edit.brand);
                                const isSaving = savingId === lot.publicId;

                                return (
                                    <tr key={lot.id}>
                                        <td>
                                            <div>#{lot.publicId}</div>
                                            {lot.lotNumber && <div>Лот {lot.lotNumber}</div>}
                                            <div style={{ fontSize: '0.85rem', color: '#666' }}>{lot.tradeNumber}</div>
                                            <Link href={lot.url} className={styles.openLink}>
                                                Открыть →
                                            </Link>
                                        </td>
                                        <td className={styles.titleCell}>
                                            <div>{lot.title ?? '—'}</div>
                                            <div>{formatPrice(lot.startPrice)}</div>
                                            {(lot.brandRaw || lot.modelRaw) && (
                                                <div className={styles.rawHint}>
                                                    Исходно: {[lot.brandRaw, lot.modelRaw].filter(Boolean).join(' / ')}
                                                </div>
                                            )}
                                            <span className={styles.badgeBad}>{issueLabel(lot)}</span>
                                        </td>
                                        <td>
                                            <select
                                                className={styles.select}
                                                value={edit.brand}
                                                onChange={(e) => updateEdit(lot.publicId, { brand: e.target.value })}
                                                disabled={isSaving}
                                            >
                                                <option value="">— выберите —</option>
                                                {catalog.brands.map((brand) => (
                                                    <option key={brand} value={brand}>
                                                        {brand}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <select
                                                className={styles.select}
                                                value={edit.model}
                                                onChange={(e) => updateEdit(lot.publicId, { model: e.target.value })}
                                                disabled={isSaving || !edit.brand}
                                            >
                                                <option value="">— не указана —</option>
                                                {modelOptions.map((model) => (
                                                    <option key={model} value={model}>
                                                        {model}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button
                                                    type="button"
                                                    className={styles.btnPrimary}
                                                    onClick={() => saveLot(lot.publicId)}
                                                    disabled={isSaving || !edit.brand}
                                                >
                                                    Сохранить
                                                </button>
                                                <button
                                                    type="button"
                                                    className={styles.btnDanger}
                                                    onClick={() => clearField(lot.publicId, 'model')}
                                                    disabled={isSaving || !lot.model}
                                                >
                                                    Сбросить модель
                                                </button>
                                                <button
                                                    type="button"
                                                    className={styles.btnDanger}
                                                    onClick={() => clearField(lot.publicId, 'brand')}
                                                    disabled={isSaving}
                                                >
                                                    Сбросить марку
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
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
