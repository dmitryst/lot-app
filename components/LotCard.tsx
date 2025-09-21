'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../app/page.module.css';
import { Lot } from '../types';
import { formatMoney } from '../utils/format';
import Accordion from './Accordion';

// Импортируем картинку как статический ресурс.
// Путь указывается относительно текущего файла.
import placeholderImage from '../public/placeholder.png';

// --- ИКОНКИ ---
const IconArrowUp = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5" /><path d="m5 12 7-7 7 7" />
    </svg>
);
const IconArrowDown = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14" /><path d="m19 12-7 7-7-7" />
    </svg>
);
const PublishIcon = ({ status }: { status: 'idle' | 'loading' | 'success' | 'error' }) => {
    if (status === 'success') {
        return ( // Галочка при успехе
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#28a745" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
        );
    }
    if (status === 'loading') {
        return ( // Иконка загрузки (крутящаяся стрелка)
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader-2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
        );
    }
    if (status === 'error') {
        return ( // Крестик при ошибке
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-circle"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
        );
    }
    return ( // Облако для стандартного состояния
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload-cloud"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" /><path d="M12 12v6" /><path d="m15 15-3 3-3-3" /></svg>
    );
};

// --- ПРОПСЫ КОМПОНЕНТА ---
interface LotCardProps {
    lot: Lot;
    imageUrl?: string | null;
}

export default function LotCard({ lot, imageUrl }: LotCardProps) {
    // Состояние для отслеживания статуса копирования
    const [publishStatus, setPublishStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const isPublishButtonEnabled = process.env.NEXT_PUBLIC_FEATURE_PUBLISH_BUTTON_ENABLED === 'true';

    // Обработчик нажатия на кнопку "Опубликовать"
    const handlePublishToProd = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (publishStatus === 'loading' || publishStatus === 'success') {
            // Если уже идет загрузка или успешно, игнорируем повторные нажатия
            return;
        }

        setPublishStatus('loading'); // Устанавливаем статус загрузки

        try {
            const apiUrl = process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL;

            if (!apiUrl) {
                throw new Error('URL бэкенда не настроен. Проверьте переменную NEXT_PUBLIC_CSHARP_BACKEND_URL.');
            }

            const response = await fetch(`${apiUrl}/api/lots/${lot.id}/copy-to-prod`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                // Если ответ не 2xx, значит произошла ошибка
                const errorData = await response.json();
                console.error('Ошибка при публикации лота:', errorData.message || response.statusText);
                throw new Error(errorData.message || 'Неизвестная ошибка публикации');
            }

            setPublishStatus('success'); // Успешно опубликовано

        } catch (error) {
            console.error('Ошибка сети или обработки ответа:', error);
            setPublishStatus('error');
        } finally {
            // через несколько секунд вернуть статус idle, чтобы можно было попробовать снова
            setTimeout(() => setPublishStatus('idle'), 3000);
        }
    };

    return (
        <div className={styles.lotCardContainer}>

            {/* Блок для изображения (1/3 ширины) */}
            <div className={styles.imageWrapper}>
                <Image
                    src={imageUrl || placeholderImage}
                    alt={`Изображение для лота: ${lot.description}`}
                    layout="fill"
                    objectFit="cover"
                    className={styles.lotImage}
                />
            </div>

            <div className={styles.contentWrapper}>
                {/* --- КНОПКА "ОПУБЛИКОВАТЬ В PROD" --- */}
                {isPublishButtonEnabled && (
                    <button
                        className={`${styles.publishButton} ${publishStatus !== 'idle' ? styles[publishStatus] : ''}`}
                        onClick={handlePublishToProd}
                        disabled={publishStatus === 'loading' || publishStatus === 'success'}
                    >
                        <PublishIcon status={publishStatus} />
                    </button>
                )}

                <div className={styles.cardContent}>
                    <h2>
                        {lot.description}
                    </h2>

                    <p className={styles.priceDetail}>
                        Начальная цена:
                        <span className={styles.priceValue}>{formatMoney(lot.startPrice)}</span>
                        {lot.bidding.type === 'Публичное предложение' ? (
                            <span className={styles.iconDown}><IconArrowDown /></span>
                        ) : (
                            <span className={styles.iconUp}><IconArrowUp /></span>
                        )}
                    </p>

                    {lot.step && (
                        <p className={styles.priceDetail}>
                            Шаг цены:
                            <span className={styles.priceValue}>{formatMoney(lot.step)}</span>
                        </p>
                    )}

                    {lot.deposit && (
                        <p className={styles.priceDetail}>
                            Задаток:
                            <span className={styles.priceValue}>{formatMoney(lot.deposit)}</span>
                        </p>
                    )}

                    {lot.bidding.viewingProcedure && (
                        <Accordion title="Порядок ознакомления">
                            {lot.bidding.viewingProcedure}
                        </Accordion>
                    )}

                    {lot.categories && lot.categories.length > 0 && (
                        <div className={styles.categoriesContainer}>
                            {lot.categories.map((cat) => (
                                <span key={cat.id} className={styles.categoryTag}>
                                    {cat.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.cardFooter}>
                    {/* 
                      КНОПКА "ПОДРОБНЕЕ" ПРОСТО ВИЗУАЛЬНЫЙ ЭЛЕМЕНТ.
                      Клик по ней вызовет onNavigate родительского div.
                    */}
                    <div className={styles.buyButton}>
                        Подробнее
                    </div>
                </div>
            </div>
        </div>
    );
}
