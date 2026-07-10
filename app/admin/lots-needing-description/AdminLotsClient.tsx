'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './admin-lots.module.css';
import MapPicker from '@/app/add-ad/MapPicker';

interface LotNeedingDescription {
    id: string;
    publicId: number;
    lotNumber?: string | null;
    title?: string | null;
    description?: string | null;
    viewingProcedure?: string | null;
    startPrice?: number | null;
    tradeStatus?: string | null;
    createdAt: string;
    tradeNumber?: string | null;
    platform?: string | null;
    bankruptMessageId?: string | null;
    url: string;
}

interface AlignmentAttachment {
    title: string;
    url: string;
    extension: string;
    extractedText?: string | null;
    descriptionText?: string | null;
    isSummarized?: boolean;
    summarizationError?: string | null;
    extractionError?: string | null;
    selectedForDownload: boolean;
    useForDescription: boolean;
}

interface AlignmentPreview {
    publicId: number;
    lotId: string;
    lotNumber?: string | null;
    startPrice?: number | null;
    fedresursUrl?: string | null;
    error?: string | null;
    currentDescription?: string | null;
    currentViewingProcedure?: string | null;
    tableDescription?: string | null;
    isReferralDescription?: boolean;
    proposedDescription?: string | null;
    proposedViewingProcedure?: string | null;
    attachments?: AlignmentAttachment[];
    canApply: boolean;
    editedDescription?: string;
    editedViewingProcedure?: string;
    editedLatitude?: number;
    editedLongitude?: number;
    editedAddress?: string;
}

function isReferralDescription(text?: string | null): boolean {
    if (!text) return false;
    const lower = text.toLowerCase();
    return lower.includes('полный перечень имущества')
        || lower.includes('перечень имущества опубликован')
        || lower.includes('опубликован на сайте ефрсб')
        || lower.includes('опубликован на сайте электронной')
        || lower.includes('на сайте электронной площадки');
}

function buildDescriptionFromAttachments(
    tableDescription: string | null | undefined,
    attachments: AlignmentAttachment[]
): string {
    const docParts = attachments
        .filter(a => a.useForDescription && (a.descriptionText || a.extractedText))
        .map(a => (a.descriptionText ?? a.extractedText)!.trim())
        .filter(Boolean);

    const docText = docParts.length > 0 ? docParts.join('\n\n') : '';
    const table = tableDescription?.trim() ?? '';

    if (!docText) {
        if (isReferralDescription(table)) return '';
        return table;
    }

    if (isReferralDescription(table) || !table || table.toLowerCase() === 'не найдено') {
        return docText;
    }

    if (docText.length > table.length * 1.5) {
        return docText;
    }

    return table;
}

function recalculatePreviewDescription(preview: AlignmentPreview): AlignmentPreview {
    const editedDescription = buildDescriptionFromAttachments(
        preview.tableDescription,
        preview.attachments ?? []
    );
    return { ...preview, editedDescription };
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
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [previews, setPreviews] = useState<AlignmentPreview[]>([]);
    const [isAligning, setIsAligning] = useState(false);
    const [applyingId, setApplyingId] = useState<number | null>(null);

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
                setSelectedIds(new Set());
                setPreviews([]);
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

    const toggleSelect = (publicId: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(publicId)) next.delete(publicId);
            else next.add(publicId);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === lots.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(lots.map(l => l.publicId)));
        }
    };

    const runAlignmentPreview = async () => {
        if (selectedIds.size === 0) {
            alert('Выберите хотя бы один лот.');
            return;
        }

        setIsAligning(true);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/admin/lots/needs-description/align-preview`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ publicIds: Array.from(selectedIds) }),
                }
            );

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                alert(err.message ?? 'Ошибка при загрузке данных с Федресурса');
                return;
            }

            const data = await res.json();
            const items: AlignmentPreview[] = (data.items ?? []).map((item: AlignmentPreview) => {
                const attachments = (item.attachments ?? []).map(a => ({
                    ...a,
                    selectedForDownload: a.selectedForDownload ?? true,
                    useForDescription: a.useForDescription ?? false,
                }));
                const base: AlignmentPreview = {
                    ...item,
                    attachments,
                    editedDescription: item.proposedDescription ?? '',
                    editedViewingProcedure: item.proposedViewingProcedure ?? '',
                };
                return recalculatePreviewDescription(base);
            });
            setPreviews(items);
        } catch (e) {
            console.error(e);
            alert('Ошибка при выравнивании');
        } finally {
            setIsAligning(false);
        }
    };

    const applyAlignment = async (preview: AlignmentPreview) => {
        if (!preview.editedDescription?.trim()) {
            alert('Описание не может быть пустым.');
            return;
        }

        setApplyingId(preview.publicId);
        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/admin/lots/needs-description/align-apply`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        publicId: preview.publicId,
                        description: preview.editedDescription,
                        viewingProcedure: preview.editedViewingProcedure,
                        latitude: preview.editedLatitude,
                        longitude: preview.editedLongitude,
                        attachments: (preview.attachments ?? [])
                            .filter(a => a.selectedForDownload)
                            .map(a => ({
                                title: a.title,
                                extension: a.extension,
                                sourceUrl: a.url,
                            })),
                    }),
                }
            );

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                console.error('Validation or Server Error:', err);
                const errorMessage = err.message || (err.errors ? JSON.stringify(err.errors) : err.title) || 'Ошибка при сохранении';
                alert(errorMessage);
                return;
            }

            setPreviews(prev => prev.filter(p => p.publicId !== preview.publicId));
            setLots(prev => prev.filter(l => l.publicId !== preview.publicId));
            setSelectedIds(prev => {
                const next = new Set(prev);
                next.delete(preview.publicId);
                return next;
            });
            setTotalCount(c => Math.max(0, c - 1));
        } catch (e) {
            console.error(e);
            alert('Ошибка при сохранении');
        } finally {
            setApplyingId(null);
        }
    };

    const dismissPreview = (publicId: number) => {
        setPreviews(prev => prev.filter(p => p.publicId !== publicId));
    };

    const toggleAttachmentDownload = (publicId: number, url: string) => {
        setPreviews(prev =>
            prev.map(p => {
                if (p.publicId !== publicId) return p;
                return {
                    ...p,
                    attachments: (p.attachments ?? []).map(a =>
                        a.url === url ? { ...a, selectedForDownload: !a.selectedForDownload } : a
                    ),
                };
            })
        );
    };

    const toggleAttachmentForDescription = (publicId: number, url: string) => {
        setPreviews(prev =>
            prev.map(p => {
                if (p.publicId !== publicId) return p;
                const attachments = (p.attachments ?? []).map(a =>
                    a.url === url ? { ...a, useForDescription: !a.useForDescription } : a
                );
                return recalculatePreviewDescription({ ...p, attachments });
            })
        );
    };

    const canApplyPreview = (preview: AlignmentPreview) =>
        !!preview.editedDescription?.trim() &&
        (preview.editedDescription.trim() !== (preview.currentDescription?.trim() ?? '') ||
            (preview.attachments ?? []).some(a => a.selectedForDownload));

    const updatePreviewField = (
        publicId: number,
        field: 'editedDescription' | 'editedViewingProcedure' | 'editedLatitude' | 'editedLongitude' | 'editedAddress',
        value: string | number | undefined
    ) => {
        setPreviews(prev =>
            prev.map(p => (p.publicId === publicId ? { ...p, [field]: value } : p))
        );
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
                Выберите лоты и нажмите «Выравнить с Федресурсом» — система загрузит описание со страницы
                объявления торгов, при необходимости извлечёт и обобщит через ИИ текст из вложений (docx и др.), перенесёт
                текущий текст в блок ознакомления и покажет результат для подтверждения. Если файла нет на
                Федресурсе, загрузите документ вручную на странице лота.
            </p>

            {lots.length > 0 && (
                <div className={styles.toolbar}>
                    <button
                        type="button"
                        className={styles.alignBtn}
                        onClick={runAlignmentPreview}
                        disabled={isAligning || selectedIds.size === 0}
                    >
                        {isAligning ? 'Загрузка с Федресурса…' : `Выравнить с Федресурсом (${selectedIds.size})`}
                    </button>
                </div>
            )}

            {previews.length > 0 && (
                <section className={styles.previewSection}>
                    <h2 className={styles.previewHeading}>Результаты выравнивания — проверьте и подтвердите</h2>
                    {previews.map(preview => (
                        <div key={preview.publicId} className={styles.previewCard}>
                            <div className={styles.previewHeader}>
                                <strong>Лот #{preview.publicId}</strong>
                                {preview.lotNumber && <span> · №{preview.lotNumber}</span>}
                                {preview.startPrice != null && (
                                    <span> · {formatPrice(preview.startPrice)}</span>
                                )}
                                {preview.fedresursUrl && (
                                    <a
                                        href={preview.fedresursUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.fedresursLink}
                                    >
                                        Федресурс ↗
                                    </a>
                                )}
                            </div>

                            {preview.error && (
                                <p className={styles.previewError}>{preview.error}</p>
                            )}

                            {preview.isReferralDescription && !preview.error && (
                                <p className={styles.referralHint}>
                                    Описание в таблице — отсылка к внешнему перечню имущества.
                                    {preview.attachments && preview.attachments.length > 0
                                        ? ' Отметьте файлы «В описание».'
                                        : ' Загрузите документ вручную на странице лота.'}
                                </p>
                            )}

                            {(preview.attachments?.length ?? 0) > 0 && (
                                <div className={styles.attachmentsBlock}>
                                    <h3>Файлы на Федресурсе</h3>
                                    <p className={styles.attachmentsHint}>
                                        Отметьте, какие файлы прикрепить к лоту и из каких взять текст описания.
                                    </p>
                                    {preview.attachments!.map(att => (
                                        <div key={att.url} className={styles.attachmentRow}>
                                            <div className={styles.attachmentHeader}>
                                                <a href={att.url} target="_blank" rel="noopener noreferrer">
                                                    {att.title}
                                                </a>
                                                <span className={styles.attachmentExt}>{att.extension}</span>
                                            </div>
                                            <div className={styles.attachmentToggles}>
                                                <label className={styles.attachmentToggle}>
                                                    <input
                                                        type="checkbox"
                                                        checked={att.selectedForDownload}
                                                        onChange={() => toggleAttachmentDownload(preview.publicId, att.url)}
                                                    />
                                                    Скачать
                                                </label>
                                                    <label className={styles.attachmentToggle}>
                                                        <input
                                                            type="checkbox"
                                                            checked={att.useForDescription}
                                                            disabled={!att.descriptionText && !att.extractedText}
                                                            onChange={() => toggleAttachmentForDescription(preview.publicId, att.url)}
                                                        />
                                                        В описание
                                                    </label>
                                                </div>
                                                {att.isSummarized && (
                                                    <p className={styles.summarizedBadge}>Текст обобщён ИИ</p>
                                                )}
                                                {att.summarizationError && (
                                                    <p className={styles.attachmentError}>{att.summarizationError}</p>
                                                )}
                                                {att.extractionError && (
                                                    <p className={styles.attachmentError}>{att.extractionError}</p>
                                                )}
                                                {att.descriptionText && (
                                                    <pre className={styles.previewText}>{truncate(att.descriptionText, 600)}</pre>
                                                )}
                                                {att.isSummarized && att.extractedText && (
                                                    <details className={styles.rawExtractDetails}>
                                                        <summary>Фрагмент исходного текста</summary>
                                                        <pre className={styles.previewText}>{att.extractedText}</pre>
                                                    </details>
                                                )}
                                                {!att.descriptionText && att.extractedText && (
                                                    <pre className={styles.previewText}>{truncate(att.extractedText, 400)}</pre>
                                                )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {(!preview.error || (preview.attachments?.length ?? 0) > 0) && (
                                <div className={styles.previewGrid}>
                                    <div className={styles.previewColumn}>
                                        <h3>Было: описание</h3>
                                        <pre className={styles.previewText}>{preview.currentDescription || '—'}</pre>
                                        <h3>Было: ознакомление</h3>
                                        <pre className={styles.previewText}>{preview.currentViewingProcedure || '—'}</pre>
                                    </div>
                                    <div className={styles.previewColumn}>
                                        <h3>Станет: описание</h3>
                                        <textarea
                                            className={styles.previewTextarea}
                                            value={preview.editedDescription ?? ''}
                                            onChange={e =>
                                                updatePreviewField(preview.publicId, 'editedDescription', e.target.value)
                                            }
                                            rows={6}
                                        />
                                        <h3>Станет: ознакомление</h3>
                                        <textarea
                                            className={styles.previewTextarea}
                                            value={preview.editedViewingProcedure ?? ''}
                                            onChange={e =>
                                                updatePreviewField(
                                                    preview.publicId,
                                                    'editedViewingProcedure',
                                                    e.target.value
                                                )
                                            }
                                            rows={4}
                                        />

                                        <h3 style={{ marginTop: '15px', marginBottom: '8px' }}>Координаты на карте (если кадастровый номер не извлечён)</h3>
                                        <div style={{ marginBottom: '15px' }}>
                                            <MapPicker
                                                address={preview.editedAddress || ''}
                                                setAddress={(val) => updatePreviewField(preview.publicId, 'editedAddress', val)}
                                                coordinates={
                                                    preview.editedLatitude && preview.editedLongitude
                                                        ? [preview.editedLatitude, preview.editedLongitude]
                                                        : null
                                                }
                                                setCoordinates={(coords) => {
                                                    updatePreviewField(preview.publicId, 'editedLatitude', coords?.[0]);
                                                    updatePreviewField(preview.publicId, 'editedLongitude', coords?.[1]);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className={styles.previewActions}>
                                {canApplyPreview(preview) && (
                                    <button
                                        type="button"
                                        className={styles.applyBtn}
                                        disabled={applyingId === preview.publicId}
                                        onClick={() => applyAlignment(preview)}
                                    >
                                        {applyingId === preview.publicId ? 'Сохранение…' : 'Применить'}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className={styles.skipBtn}
                                    onClick={() => dismissPreview(preview.publicId)}
                                >
                                    Пропустить
                                </button>
                                <Link href={`/lot/${preview.publicId}`} className={styles.openLink}>
                                    Открыть лот →
                                </Link>
                            </div>
                        </div>
                    ))}
                </section>
            )}

            {lots.length === 0 ? (
                <div className={styles.emptyState}>Нет лотов, ожидающих доработки описания.</div>
            ) : (
                <>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.checkboxCol}>
                                    <input
                                        type="checkbox"
                                        checked={lots.length > 0 && selectedIds.size === lots.length}
                                        onChange={toggleSelectAll}
                                        aria-label="Выбрать все"
                                    />
                                </th>
                                <th>ID</th>
                                <th>Торги</th>
                                <th>Описание</th>
                                <th>Цена</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {lots.map(lot => (
                                <tr key={lot.id}>
                                    <td className={styles.checkboxCol}>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(lot.publicId)}
                                            onChange={() => toggleSelect(lot.publicId)}
                                            aria-label={`Выбрать лот ${lot.publicId}`}
                                        />
                                    </td>
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
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                            >
                                ← Назад
                            </button>
                            <span className={styles.pageInfo}>
                                Страница {page} из {totalPages}
                            </span>
                            <button
                                className={styles.pageBtn}
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
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
