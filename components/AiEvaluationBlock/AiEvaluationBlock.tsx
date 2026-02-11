// components/AiEvaluationBlock/AiEvaluationBlock.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './aiEvaluationBlock.module.css';

interface EvaluationData {
    estimatedPrice: number;
    liquidityScore?: number;
    investmentSummary: string | null | undefined;
    reasoningText?: string;
    upsidePercent?: number; // Передаем готовый процент
}

interface AiEvaluationBlockProps {
    type: 'quick' | 'deep'; // Тип блока
    lotPublicId?: number | string; // Для deep-режима
    currentPrice?: number | null; // Для расчета апсайда

    // Для quick-режима данные передаются напрямую
    quickData?: EvaluationData;
    priceConfidence?: number | null;
}

// Вспомогательные функции для уверенности (можно вынести в утилиты)
const getConfidenceClass = (score: number | null | undefined, styles: any) => {
    if (!score && score !== 0) return styles.confidenceLow;
    if (score >= 0.8) return styles.confidenceHigh;
    if (score >= 0.5) return styles.confidenceMedium;
    return styles.confidenceLow;
};

const getConfidenceLabel = (score: number | null | undefined) => {
    if (!score && score !== 0) return 'Низкая точность (мало данных)';
    if (score >= 0.8) return 'Высокая точность';
    if (score >= 0.5) return 'Средняя точность';
    return 'Низкая точность (мало данных)';
};

export default function AiEvaluationBlock({
    type,
    lotPublicId,
    currentPrice,
    quickData,
    priceConfidence
}: AiEvaluationBlockProps) {
    const [evaluationResult, setEvaluationResult] = useState<EvaluationData | null>(
        type === 'quick' ? quickData || null : null
    );
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [hasCheckedExisting, setHasCheckedExisting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const apiUrl = process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL;
    const { user } = useAuth();
    const router = useRouter();

    // Для deep-режима проверяем наличие оценки при загрузке
    useEffect(() => {
        if (type !== 'deep' || !lotPublicId) return;

        const checkExistingEvaluation = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/lots/${lotPublicId}/evaluation`);
                if (response.ok) {
                    const data = await response.json();
                    setEvaluationResult(data);
                }
            } catch (e) {
                console.error("Ошибка при проверке оценки:", e);
            } finally {
                setHasCheckedExisting(true);
            }
        };

        checkExistingEvaluation();
    }, [type, lotPublicId, apiUrl]);

    // Запуск deep-анализа
    const handleEvaluate = async () => {
        if (!user) {
            const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
            router.push(`/login?returnUrl=${returnUrl}`);
            return;
        }

        setIsEvaluating(true);
        setEvaluationResult(null);
        setError(null);

        try {
            const response = await fetch(`${apiUrl}/api/lots/${lotPublicId}/evaluate`, {
                method: 'POST',
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    const returnUrl = encodeURIComponent(window.location.pathname);
                    router.push(`/login?returnUrl=${returnUrl}`);
                    return;
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Ошибка при выполнении анализа');
            }

            const data = await response.json();
            setEvaluationResult(data);
        } catch (err: any) {
            setError(err.message || 'Произошла неизвестная ошибка');
        } finally {
            setIsEvaluating(false);
        }
    };

    // Расчет апсайда
    const calculateUpside = (estimated: number, current: number) => {
        if (!estimated || !current) return null;
        const diff = estimated - current;
        const percent = (diff / current) * 100;
        return { diff, percent };
    };

    const upside = (evaluationResult && currentPrice)
        ? calculateUpside(evaluationResult.estimatedPrice, currentPrice)
        : null;

    // Рендер Markdown
    const renderMarkdown = (text: string | null | undefined) => {
        if (!text) return null;
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, idx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={idx}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    const title = type === 'quick' ? 'Экспресс-оценка инвестиционной привлекательности (AI)' : 'Детальная оценка инвестиционной привлекательности (AI)';

    return (
        <div className={styles.aiBlock}>
            <h2 className={styles.title}>{title}</h2>

            {/* Ошибка */}
            {error && (
                <div className={styles.errorBox}>❌ {error}</div>
            )}

            {/* Кнопка для deep-режима */}
            {type === 'deep' && !evaluationResult && !isEvaluating && hasCheckedExisting && (
                <button onClick={handleEvaluate} className={styles.evaluateButton}>
                    Запустить анализ
                </button>
            )}

            {/* Прогресс бар */}
            {isEvaluating && (
                <div className={styles.progressContainer}>
                    <div className={styles.progressBarTrack}>
                        <div className={styles.progressBarFill}></div>
                    </div>
                    <p className={styles.progressText}>
                        Идет анализ... Это может занять до 2 минут.
                        <br /><span style={{ fontSize: '0.8em', color: '#94a3b8' }}>DeepSeek думает...</span>
                    </p>
                </div>
            )}

            {/* Результат */}
            {evaluationResult && (
                <div className={styles.resultContainer}>
                    <div className={styles.priceRow}>
                        {/* Лейбл */}
                        <span className={styles.priceLabelBadge}>
                            {type === 'quick' ? 'Оценка AI:' : 'Новая оценка AI:'}
                        </span>

                        {/* Цена и Апсайд */}
                        <div className={styles.priceDataWrapper}>
                            <span className={styles.estimatedPrice}>
                                ~{evaluationResult.estimatedPrice?.toLocaleString('ru-RU')} ₽
                            </span>

                            {upside && (
                                <div className={styles.upsideContainer}>
                                    <span className={`${styles.upsideBadge} ${upside.percent >= 0 ? styles.upsidePositive : styles.upsideNegative}`}>
                                        {upside.percent > 0 ? '+' : ''}{upside.percent.toFixed(0)}%
                                    </span>
                                    <span className={styles.upsideLabel}>от начальной цены</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ТОЧКА УВЕРЕННОСТИ (только для quick) */}
                    {/* todo: перенести точку уверенности в детальную оценку */}
                    {type === 'quick' && priceConfidence !== undefined && priceConfidence !== null && (
                        <div className={styles.confidenceRow}>
                            <div className={styles.confidenceBadge}>
                                <div className={`${styles.confidenceDot} ${getConfidenceClass(priceConfidence, styles)}`} />
                                <span className={styles.confidenceText}>
                                    {getConfidenceLabel(priceConfidence)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Ликвидность (только для deep) */}
                    {type === 'deep' && evaluationResult.liquidityScore !== undefined && (
                        <div className={styles.liquidityRow}>
                            <strong>Ликвидность: </strong>
                            <span style={{
                                color: evaluationResult.liquidityScore >= 7 ? '#16a34a' :
                                    evaluationResult.liquidityScore >= 4 ? '#ca8a04' : '#dc2626',
                                fontWeight: 'bold'
                            }}>
                                {evaluationResult.liquidityScore}/10
                            </span>
                        </div>
                    )}

                    {/* Резюме */}
                    <div className={styles.summary}>
                        <strong>Резюме:</strong> {renderMarkdown(evaluationResult.investmentSummary)}
                    </div>

                    {/* Детальный анализ (только для deep) */}
                    {type === 'deep' && evaluationResult.reasoningText && (
                        <details className={styles.reasoningDetails}>
                            <summary className={styles.reasoningSummary}>Показать детальный анализ</summary>
                            <div className={styles.reasoningText}>
                                {renderMarkdown(evaluationResult.reasoningText)}
                            </div>
                        </details>
                    )}
                </div>
            )}
        </div>
    );
}
