'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './stuck-trade-results.module.css';

type ResultKind = 'not_held' | 'completed' | 'cancelled' | 'no_data';

interface StuckBidding {
    id: string;
    tradeNumber?: string | null;
    platform?: string | null;
    platformRaw?: string | null;
    type?: string | null;
    statusCheckAttempts: number;
    lastStatusCheckAt?: string | null;
    nextStatusCheckAt?: string | null;
    resultsAnnouncementDate?: string | null;
    activeLotsCount: number;
    totalLotsCount: number;
    fedresursUrl: string;
    fedresursMessagesUrl: string;
}

interface StuckLot {
    id: string;
    publicId: number;
    lotNumber?: string | null;
    title?: string | null;
    startPrice?: number | null;
    tradeStatus?: string | null;
    finalPrice?: number | null;
    winnerName?: string | null;
    winnerInn?: string | null;
    isActive: boolean;
    url: string;
    platformLotUrl?: string | null;
}

interface BiddingDetails {
    id: string;
    tradeNumber?: string | null;
    platform?: string | null;
    platformKind?: string | null;
    platformLabel?: string | null;
    platformUrl?: string | null;
    type?: string | null;
    statusCheckAttempts: number;
    lastStatusCheckAt?: string | null;
    nextStatusCheckAt?: string | null;
    resultsAnnouncementDate?: string | null;
    isTradeStatusesFinalized: boolean;
    bidAcceptancePeriod?: string | null;
    tradePeriod?: string | null;
    fedresursUrl: string;
    fedresursMessagesUrl: string;
    lots: StuckLot[];
}

interface LotEditState {
    resultKind: ResultKind;
    reason: string;
    finalPrice: string;
    winnerName: string;
    winnerInn: string;
    selected: boolean;
}

interface PaginatedResponse {
    items: StuckBidding[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    minAttempts: number;
}

const apiBase = process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL;

const RESULT_OPTIONS: { value: ResultKind; label: string }[] = [
    { value: 'not_held', label: 'Не состоялись' },
    { value: 'completed', label: 'Завершены' },
    { value: 'cancelled', label: 'Отменены' },
    { value: 'no_data', label: 'Нет данных' },
];

function formatDate(value?: string | null) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('ru-RU');
}

function formatPrice(price?: number | null) {
    if (price == null) return '—';
    return `${price.toLocaleString('ru-RU')} ₽`;
}

function defaultEditForLot(lot: StuckLot): LotEditState {
    return {
        resultKind: 'not_held',
        reason: 'Не было подано ни одной заявки',
        finalPrice: lot.finalPrice != null ? String(lot.finalPrice) : '',
        winnerName: lot.winnerName ?? '',
        winnerInn: lot.winnerInn ?? '',
        selected: lot.isActive,
    };
}

export default function StuckTradeResultsClient() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const detailTopRef = useRef<HTMLDivElement | null>(null);
    const [items, setItems] = useState<StuckBidding[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [minAttempts, setMinAttempts] = useState(5);
    const [minAttemptsInput, setMinAttemptsInput] = useState('5');
    const [isLoading, setIsLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [selectedBiddingId, setSelectedBiddingId] = useState<string | null>(null);
    const [details, setDetails] = useState<BiddingDetails | null>(null);
    const [edits, setEdits] = useState<Record<string, LotEditState>>({});
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [finalizeRemaining, setFinalizeRemaining] = useState(true);
    const [actingId, setActingId] = useState<string | null>(null);

    const isDetailMode = isLoadingDetails || !!details;

    const fetchList = useCallback(async (currentPage: number, attempts: number) => {
        setIsLoading(true);
        setErrorMessage(null);
        try {
            const res = await fetch(
                `${apiBase}/api/admin/stuck-trade-results?page=${currentPage}&pageSize=30&minAttempts=${attempts}`,
                { credentials: 'include' }
            );
            if (res.ok) {
                const data: PaginatedResponse = await res.json();
                setItems(data.items);
                setTotalPages(data.totalPages);
                setTotalCount(data.totalCount);
                setPage(data.page);
            } else {
                setErrorMessage('Не удалось загрузить список торгов.');
            }
        } catch (e) {
            console.error(e);
            setErrorMessage('Ошибка сети при загрузке списка.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!loading && (!user || !user.isAdmin)) {
            router.push('/');
            return;
        }

        if (user?.isAdmin && !isDetailMode) {
            fetchList(page, minAttempts);
        }
    }, [user, loading, router, fetchList, page, minAttempts, isDetailMode]);

    useEffect(() => {
        if (isDetailMode) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            detailTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [isDetailMode, details?.id]);

    const applyMinAttempts = () => {
        const parsed = Math.max(1, parseInt(minAttemptsInput, 10) || 5);
        setMinAttemptsInput(String(parsed));
        setPage(1);
        setMinAttempts(parsed);
        setSelectedBiddingId(null);
        setDetails(null);
    };

    const closeDetails = () => {
        setSelectedBiddingId(null);
        setDetails(null);
        setIsLoadingDetails(false);
    };

    const openDetails = async (biddingId: string) => {
        setSelectedBiddingId(biddingId);
        setDetails(null);
        setIsLoadingDetails(true);
        setErrorMessage(null);
        setStatusMessage(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        try {
            const res = await fetch(`${apiBase}/api/admin/stuck-trade-results/${biddingId}`, {
                credentials: 'include',
            });
            if (!res.ok) {
                setErrorMessage('Не удалось загрузить детали торгов.');
                setSelectedBiddingId(null);
                return;
            }
            const data: BiddingDetails = await res.json();
            setDetails(data);
            setEdits(Object.fromEntries((data.lots ?? []).map((lot) => [lot.id, defaultEditForLot(lot)])));
            setFinalizeRemaining(true);
        } catch (e) {
            console.error(e);
            setErrorMessage('Ошибка сети при загрузке деталей.');
            setSelectedBiddingId(null);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const updateEdit = (lotId: string, patch: Partial<LotEditState>) => {
        setEdits((prev) => ({
            ...prev,
            [lotId]: { ...prev[lotId], ...patch },
        }));
    };

    const setAllActiveKind = (kind: ResultKind) => {
        if (!details) return;
        setEdits((prev) => {
            const next = { ...prev };
            for (const lot of details.lots) {
                if (!lot.isActive) continue;
                next[lot.id] = {
                    ...next[lot.id],
                    resultKind: kind,
                    selected: true,
                    reason:
                        kind === 'not_held'
                            ? next[lot.id]?.reason || 'Не было подано ни одной заявки'
                            : next[lot.id]?.reason || '',
                };
            }
            return next;
        });
    };

    const saveResults = async () => {
        if (!details) return;

        const selectedLots = details.lots.filter((lot) => lot.isActive && edits[lot.id]?.selected);
        if (selectedLots.length === 0 && !finalizeRemaining) {
            alert('Выберите хотя бы один лот или включите закрытие остальных как «нет данных».');
            return;
        }

        setIsSaving(true);
        setErrorMessage(null);
        setStatusMessage(null);
        try {
            const payload = {
                finalizeRemainingAsNoData: finalizeRemaining,
                lots: selectedLots.map((lot) => {
                    const edit = edits[lot.id];
                    const finalPrice =
                        edit.resultKind === 'completed' && edit.finalPrice.trim()
                            ? Number(edit.finalPrice.replace(',', '.'))
                            : null;

                    return {
                        lotId: lot.id,
                        resultKind: edit.resultKind,
                        reason: edit.reason || null,
                        finalPrice: Number.isFinite(finalPrice as number) ? finalPrice : null,
                        winnerName: edit.winnerName || null,
                        winnerInn: edit.winnerInn || null,
                    };
                }),
            };

            const res = await fetch(`${apiBase}/api/admin/stuck-trade-results/${details.id}/apply`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setErrorMessage(err.message ?? 'Не удалось сохранить результаты.');
                return;
            }

            const data = await res.json();
            setStatusMessage(
                `Сохранено: ${data.updatedLots} лот(ов). Финализированы: ${data.isTradeStatusesFinalized ? 'да' : 'нет'}.`
            );
            closeDetails();
            await fetchList(page, minAttempts);
        } catch (e) {
            console.error(e);
            setErrorMessage('Ошибка сети при сохранении.');
        } finally {
            setIsSaving(false);
        }
    };

    const forceFinalize = async (biddingId: string) => {
        if (!confirm('Закрыть все активные лоты этих торгов статусом «Торги завершены (нет данных)» и остановить проверки Федресурса?')) {
            return;
        }

        setActingId(biddingId);
        setErrorMessage(null);
        setStatusMessage(null);
        try {
            const res = await fetch(`${apiBase}/api/admin/stuck-trade-results/${biddingId}/force-finalize`, {
                method: 'POST',
                credentials: 'include',
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setErrorMessage(err.message ?? 'Не удалось закрыть торги.');
                return;
            }
            const data = await res.json();
            setStatusMessage(`Закрыто без данных: ${data.processedLots} лот(ов).`);
            if (selectedBiddingId === biddingId) {
                closeDetails();
            }
            await fetchList(page, minAttempts);
        } catch (e) {
            console.error(e);
            setErrorMessage('Ошибка сети при закрытии торгов.');
        } finally {
            setActingId(null);
        }
    };

    if (loading || (!user && !loading)) {
        return <div className={styles.container}>Загрузка…</div>;
    }

    return (
        <div className={styles.container} ref={detailTopRef}>
            <h1 className={styles.heading}>Зависшие результаты торгов</h1>

            {statusMessage && <div className={styles.statusMessage}>{statusMessage}</div>}
            {errorMessage && <div className={styles.errorMessage}>{errorMessage}</div>}

            {isDetailMode ? (
                <div className={styles.detailPanel}>
                    <div className={styles.backBar}>
                        <button className={styles.btnSecondary} type="button" onClick={closeDetails}>
                            ← К списку
                        </button>
                    </div>

                    {isLoadingDetails || !details ? (
                        <div>Загрузка деталей…</div>
                    ) : (
                        <>
                            <div className={styles.detailHeader}>
                                <div>
                                    <h2 className={styles.detailTitle}>
                                        Торги {details.tradeNumber || details.id}
                                    </h2>
                                    <div className={styles.detailMeta}>
                                        {details.platform}
                                        {details.type ? ` · ${details.type}` : ''}
                                        <br />
                                        Попыток: {details.statusCheckAttempts}
                                        {details.resultsAnnouncementDate
                                            ? ` · объявление результатов: ${formatDate(details.resultsAnnouncementDate)}`
                                            : ''}
                                        <br />
                                        Приём заявок: {details.bidAcceptancePeriod || '—'}
                                        <br />
                                        Период торгов: {details.tradePeriod || '—'}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.platformLinks}>
                                {details.platformUrl && (
                                    <a
                                        className={styles.platformLinkPrimary}
                                        href={details.platformUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Открыть на {details.platformLabel || details.platform || 'площадке'} →
                                    </a>
                                )}
                                <a
                                    className={styles.openLink}
                                    href={details.fedresursUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Федресурс
                                </a>
                                <a
                                    className={styles.openLink}
                                    href={details.fedresursMessagesUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Сообщения Федресурса
                                </a>
                                {!details.platformUrl && (
                                    <span className={styles.metaMuted}>
                                        Ссылка на площадку не найдена
                                    </span>
                                )}
                            </div>

                            <div className={styles.bulkBar}>
                                <span>Для всех активных:</span>
                                <button
                                    className={styles.btnSecondary}
                                    type="button"
                                    onClick={() => setAllActiveKind('not_held')}
                                >
                                    Не состоялись
                                </button>
                                <button
                                    className={styles.btnSecondary}
                                    type="button"
                                    onClick={() => setAllActiveKind('cancelled')}
                                >
                                    Отменены
                                </button>
                                <button
                                    className={styles.btnSecondary}
                                    type="button"
                                    onClick={() => setAllActiveKind('no_data')}
                                >
                                    Нет данных
                                </button>
                            </div>

                            {details.lots.map((lot) => {
                                const edit = edits[lot.id] ?? defaultEditForLot(lot);
                                return (
                                    <div
                                        key={lot.id}
                                        className={`${styles.lotCard} ${lot.isActive ? '' : styles.lotCardInactive}`}
                                    >
                                        <div className={styles.lotCardHeader}>
                                            <div>
                                                <strong>
                                                    Лот {lot.lotNumber || '—'} · #{lot.publicId}
                                                </strong>
                                                <div className={styles.metaMuted}>
                                                    {lot.title || 'Без названия'} · старт{' '}
                                                    {formatPrice(lot.startPrice)}
                                                </div>
                                                <div className={styles.metaMuted}>
                                                    Текущий статус: {lot.tradeStatus || '—'}
                                                </div>
                                            </div>
                                            <div className={styles.links}>
                                                {lot.platformLotUrl && (
                                                    <a
                                                        className={styles.openLink}
                                                        href={lot.platformLotUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        На площадке
                                                    </a>
                                                )}
                                                <Link className={styles.openLink} href={lot.url} target="_blank">
                                                    На сайте
                                                </Link>
                                            </div>
                                        </div>

                                        {lot.isActive ? (
                                            <div className={styles.lotFields}>
                                                <div>
                                                    <label className={styles.checkboxRow}>
                                                        <input
                                                            type="checkbox"
                                                            checked={edit.selected}
                                                            onChange={(e) =>
                                                                updateEdit(lot.id, {
                                                                    selected: e.target.checked,
                                                                })
                                                            }
                                                        />
                                                        Обновить
                                                    </label>
                                                </div>
                                                <div>
                                                    <span className={styles.fieldLabel}>Результат</span>
                                                    <select
                                                        className={styles.select}
                                                        value={edit.resultKind}
                                                        disabled={!edit.selected}
                                                        onChange={(e) =>
                                                            updateEdit(lot.id, {
                                                                resultKind: e.target.value as ResultKind,
                                                            })
                                                        }
                                                    >
                                                        {RESULT_OPTIONS.map((opt) => (
                                                            <option key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {(edit.resultKind === 'not_held' ||
                                                    edit.resultKind === 'cancelled') && (
                                                    <div>
                                                        <span className={styles.fieldLabel}>Причина</span>
                                                        <input
                                                            className={styles.textInput}
                                                            value={edit.reason}
                                                            disabled={!edit.selected}
                                                            onChange={(e) =>
                                                                updateEdit(lot.id, {
                                                                    reason: e.target.value,
                                                                })
                                                            }
                                                        />
                                                    </div>
                                                )}
                                                {edit.resultKind === 'completed' && (
                                                    <>
                                                        <div>
                                                            <span className={styles.fieldLabel}>
                                                                Итоговая цена
                                                            </span>
                                                            <input
                                                                className={styles.textInput}
                                                                value={edit.finalPrice}
                                                                disabled={!edit.selected}
                                                                onChange={(e) =>
                                                                    updateEdit(lot.id, {
                                                                        finalPrice: e.target.value,
                                                                    })
                                                                }
                                                            />
                                                        </div>
                                                        <div>
                                                            <span className={styles.fieldLabel}>
                                                                Победитель
                                                            </span>
                                                            <input
                                                                className={styles.textInput}
                                                                value={edit.winnerName}
                                                                disabled={!edit.selected}
                                                                onChange={(e) =>
                                                                    updateEdit(lot.id, {
                                                                        winnerName: e.target.value,
                                                                    })
                                                                }
                                                            />
                                                        </div>
                                                        <div>
                                                            <span className={styles.fieldLabel}>
                                                                ИНН победителя
                                                            </span>
                                                            <input
                                                                className={styles.textInput}
                                                                value={edit.winnerInn}
                                                                disabled={!edit.selected}
                                                                onChange={(e) =>
                                                                    updateEdit(lot.id, {
                                                                        winnerInn: e.target.value,
                                                                    })
                                                                }
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <div className={styles.metaMuted}>Уже в конечном статусе</div>
                                        )}
                                    </div>
                                );
                            })}

                            <label className={styles.checkboxRow}>
                                <input
                                    type="checkbox"
                                    checked={finalizeRemaining}
                                    onChange={(e) => setFinalizeRemaining(e.target.checked)}
                                />
                                Оставшиеся активные лоты закрыть как «нет данных» и остановить проверки
                            </label>

                            <div className={styles.actions} style={{ flexDirection: 'row', marginTop: 12 }}>
                                <button
                                    className={styles.btnPrimary}
                                    type="button"
                                    disabled={isSaving}
                                    onClick={saveResults}
                                >
                                    {isSaving ? 'Сохранение…' : 'Сохранить результаты'}
                                </button>
                                <button
                                    className={styles.btnSecondary}
                                    type="button"
                                    onClick={closeDetails}
                                >
                                    Отмена
                                </button>
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <>
                    <p className={styles.subheading}>
                        Торги с большим числом попыток проверки результатов на Федресурсе ({totalCount})
                    </p>
                    <div className={styles.workflowHint}>
                        Обычно результаты уже есть на площадке (часто «не состоялись» из‑за отсутствия заявок),
                        а на Федресурсе сообщения нет. Зафиксируйте результат вручную — повторные вызовы Федресурса
                        остановятся.
                    </div>

                    <div className={styles.toolbar}>
                        <label>
                            Мин. попыток
                            <input
                                className={styles.numberInput}
                                type="number"
                                min={1}
                                value={minAttemptsInput}
                                onChange={(e) => setMinAttemptsInput(e.target.value)}
                            />
                        </label>
                        <button className={styles.btnSecondary} type="button" onClick={applyMinAttempts}>
                            Применить
                        </button>
                    </div>

                    {isLoading ? (
                        <div className={styles.emptyState}>Загрузка…</div>
                    ) : items.length === 0 ? (
                        <div className={styles.emptyState}>
                            Нет торгов с StatusCheckAttempts ≥ {minAttempts}
                        </div>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Попытки</th>
                                    <th>Номер / площадка</th>
                                    <th>Лоты</th>
                                    <th>Проверки</th>
                                    <th>Ссылки</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <span className={styles.attemptsBadge}>
                                                {item.statusCheckAttempts}
                                            </span>
                                        </td>
                                        <td>
                                            <div>{item.tradeNumber || '—'}</div>
                                            <div className={styles.metaMuted}>{item.platform || '—'}</div>
                                            {item.type && (
                                                <div className={styles.metaMuted}>{item.type}</div>
                                            )}
                                        </td>
                                        <td>
                                            активных {item.activeLotsCount} / всего {item.totalLotsCount}
                                        </td>
                                        <td>
                                            <div className={styles.metaMuted}>
                                                последняя: {formatDate(item.lastStatusCheckAt)}
                                            </div>
                                            <div className={styles.metaMuted}>
                                                следующая: {formatDate(item.nextStatusCheckAt)}
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.links}>
                                                <a
                                                    className={styles.openLink}
                                                    href={item.fedresursUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    Федресурс
                                                </a>
                                                <a
                                                    className={styles.openLink}
                                                    href={item.fedresursMessagesUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    Сообщения
                                                </a>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.actions}>
                                                <button
                                                    className={styles.btnPrimary}
                                                    type="button"
                                                    onClick={() => openDetails(item.id)}
                                                >
                                                    Разобрать
                                                </button>
                                                <button
                                                    className={styles.btnDanger}
                                                    type="button"
                                                    disabled={actingId === item.id}
                                                    onClick={() => forceFinalize(item.id)}
                                                >
                                                    Нет данных
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                className={styles.pageBtn}
                                type="button"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                Назад
                            </button>
                            <span className={styles.pageInfo}>
                                {page} / {totalPages}
                            </span>
                            <button
                                className={styles.pageBtn}
                                type="button"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Вперёд
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
