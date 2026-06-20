// components/AiEvaluationBlock/AiEvaluationBlock.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './aiEvaluationBlock.module.css';

interface EvaluationData {
    estimatedPrice?: number;
    liquidityScore?: number;
    investmentSummary: string | null | undefined;
    reasoningText?: string;
    upsidePercent?: number;
}

interface AiEvaluationBlockProps {
    type: 'quick' | 'deep';
    lotPublicId?: number | string;
    currentPrice?: number | null;
    quickData?: EvaluationData;
    priceConfidence?: string | null;
}

const getQuickConfidenceClass = (conf: string | null | undefined, styles: Record<string, string>) => {
    switch (conf?.toLowerCase()) {
        case 'high': return styles.confidenceHigh;
        case 'medium': return styles.confidenceMedium;
        case 'low': return styles.confidenceLow;
        case 'not_evaluable': return styles.confidenceNotEvaluable;
        default: return styles.confidenceMedium;
    }
};

const getQuickConfidenceLabel = (conf: string | null | undefined) => {
    switch (conf?.toLowerCase()) {
        case 'high': return 'Высокая точность';
        case 'medium': return 'Средняя точность';
        case 'low': return 'Низкая точность (мало данных)';
        case 'not_evaluable': return 'Автооценка недоступна для этого типа лота';
        default: return 'Точность оценки';
    }
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
    const [error, setError] = useState<string | React.ReactNode>(null);
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);

    const apiUrl = process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL;
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (type !== 'deep' || !lotPublicId || !user) {
            setIsLoadingInitial(false);
            return;
        }

        const checkMyEvaluation = async () => {
            try {
                // Пытаемся получить оценку
                // Бэкенд вернет 200 ТОЛЬКО если пользователь уже тратил лимит на этот лот
                const response = await fetch(`${apiUrl}/api/lots/${lotPublicId}/evaluation`, {
                    credentials: 'include'
                });

                if (response.ok) {
                    const data = await response.json();
                    setEvaluationResult(data);
                } else {
                    // 404 или 401 — значит еще не запускали или не авторизованы
                    // Просто ничего не делаем, останется кнопка "Запустить анализ"
                }
            } catch (e) {
                console.error("Error checking evaluation:", e);
            } finally {
                setIsLoadingInitial(false);
            }
        };

        checkMyEvaluation();
    }, [type, lotPublicId, apiUrl, user]);

    const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

    // Запуск deep-анализа
    const handleEvaluate = async () => {
        if (!user) {
            const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
            router.push(`/login?returnUrl=${returnUrl}`);
            return;
        }

        setIsEvaluating(true);
        setError(null);

        try {
            // ВАЖНО: всегда дергаем POST /evaluate, чтобы бэкенд мог:
            //  - проверить лимит/подписку
            //  - записать вызов в БД
            const response = await fetch(`${apiUrl}/api/lots/${lotPublicId}/evaluate`, {
                method: 'POST',
                credentials: 'include'
            });

            // Если ошибка (402, 500 и т.д.)
            if (!response.ok) {
                const err = await response.json().catch(() => ({}));

                // Если это 402 Payment Required — показываем ошибку сразу, без ожидания
                if (response.status === 402 && err.actionUrl) {
                    setError(
                        <span>
                            {err.message} <br />
                            <a href={err.actionUrl} style={{ textDecoration: 'underline', fontWeight: 'bold' }}>
                                Перейти к тарифам →
                            </a>
                        </span>
                    );
                } else {
                    // Любая другая ошибка
                    throw new Error(err.message || 'Ошибка запуска анализа');
                }

                // Важно: сразу выключаем лоадер, чтобы не висел "Идет анализ..."
                setIsEvaluating(false);
                return;
            }

            // Обработка успешных ответов (200 или 202)
        
            // СЦЕНАРИЙ А: Данные уже готовы (КЭШ) - статус 200
            if (response.status === 200) {
                const dataPromise = response.json();
                const minWaitMs = 5000; // Ждем минимум 5 секунд для красоты
                
                // Ждем и данные, и таймер
                const [data] = await Promise.all([dataPromise, sleep(minWaitMs)]);
                
                setEvaluationResult(data);
                setIsEvaluating(false);
                
                return;
            }

            // СЦЕНАРИЙ Б: Задача ушла в фон (Fire-and-Forget) - статус 202
            if (response.status === 202) {
                // Тут мы не ждем sleep(5000), потому что поллинг сам займет время.             
                await startPolling(); 
                // startPolling сам установит результат и выключит isEvaluating
                return;
            }
        } catch (err: any) {
            setError(err.message || 'Произошла неизвестная ошибка');
        } finally {
            setIsEvaluating(false);
        }
    };

    // Функция опроса сервера
    const startPolling = async () => {
        const maxAttempts = 60; // 60 раз по 3 сек = 3 минуты макс
        const delay = 3000;     // 3 секунды интервал

        // начальная задержка, чтобы "подумать" минимум 10 сек
        await sleep(10000); 
        
        for (let i = 0; i < maxAttempts; i++) {
            try {
                // Опрашиваем GET эндпоинт
                const res = await fetch(`${apiUrl}/api/lots/${lotPublicId}/evaluation`, {
                    credentials: 'include'
                });

                if (res.ok) {
                    // УРА! Данные готовы
                    const data = await res.json();
                    setEvaluationResult(data);
                    setIsEvaluating(false);
                    return;
                }
                
                // Если 404 (еще нет) или 401 - ждем и повторяем
                
            } catch (e) {
                console.error("Polling error", e);
            }

            // Ждем перед следующей попыткой
            await new Promise(r => setTimeout(r, delay));
        }

        // Если цикл кончился, а данных нет
        setError("Время ожидания истекло. Попробуйте обновить страницу.");
        setIsEvaluating(false);
    };

    // Расчет апсайда
    const calculateUpside = (estimated: number, current: number) => {
        if (!estimated || !current) return null;
        const diff = estimated - current;
        const percent = (diff / current) * 100;
        return { diff, percent };
    };

    const upside = (evaluationResult?.estimatedPrice && currentPrice)
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

            {/* Скелетон или спиннер, пока проверяем "покупал ли я?" */}
            {type === 'deep' && isLoadingInitial && (
                <div style={{ color: '#aaa', fontSize: '0.9rem' }}>Проверка статуса анализа...</div>
            )}

            {/* Ошибка */}
            {error && (
                <div className={styles.errorBox}>❌ {error}</div>
            )}

            {/* Кнопка запуска:
                Показываем, если:
                1. Это deep режим
                2. Результата НЕТ (значит GET вернул 404)
                3. Процесс не идет (isEvaluating == false)
                4. Первичная проверка завершена (!isLoadingInitial)
            */}
            {type === 'deep' && !evaluationResult && !isEvaluating && !isLoadingInitial && (
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
                        <br /><span style={{ fontSize: '0.8em', color: '#94a3b8' }}>AI модель думает...</span>
                    </p>
                </div>
            )}

            {/* Результат */}
            {evaluationResult && (
                <div className={styles.resultContainer}>
                    <div className={styles.priceRow}>
                        <span className={styles.priceLabelBadge}>
                            {type === 'quick' ? 'Оценка AI:' : 'Новая оценка AI:'}
                        </span>

                        {evaluationResult.estimatedPrice ? (
                            <div className={styles.priceDataWrapper}>
                                <span className={styles.estimatedPrice}>
                                    ~{evaluationResult.estimatedPrice.toLocaleString('ru-RU')} ₽
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
                        ) : type === 'quick' ? (
                            <span className={styles.notEvaluableLabel}>
                                {priceConfidence?.toLowerCase() === 'not_evaluable'
                                    ? 'Автооценка недоступна'
                                    : 'Числовая оценка не рассчитана'}
                            </span>
                        ) : null}
                    </div>

                    {type === 'quick' && priceConfidence && (
                        <div className={styles.confidenceRow}>
                            <div className={styles.confidenceBadge}>
                                <div className={`${styles.confidenceDot} ${getQuickConfidenceClass(priceConfidence, styles)}`} />
                                <span className={styles.confidenceText}>
                                    {getQuickConfidenceLabel(priceConfidence)}
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
