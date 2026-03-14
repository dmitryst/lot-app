'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './AnnouncementBar.module.css';

export default function AnnouncementBar() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Проверяем, не закрывал ли пользователь баннер ранее
        const isHidden = localStorage.getItem('hideAlertsPromo_v1');
        if (!isHidden) {
            setIsVisible(true);
        }
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem('hideAlertsPromo_v1', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className={styles.bar}>
            <div className={styles.content}>
                <span className={styles.badge}>Новое</span>
                <span className={styles.text}>
                    Узнавайте о новых лотах первыми! Настройте автоматическую email-рассылку по вашим фильтрам.
                </span>
                <Link href="/alerts" className={styles.link} onClick={handleClose}>
                    Настроить подписку →
                </Link>
            </div>
            <button className={styles.closeBtn} onClick={handleClose} aria-label="Закрыть">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    );
}
