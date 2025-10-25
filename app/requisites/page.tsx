'use client';

import React, { useState } from 'react';
import styles from './requisites.module.css';

const requisitesData = [
    { label: 'Наименование', value: 'ИП Степанов Дмитрий Александрович' },
    { label: 'ИНН', value: '690210047094' },
    { label: 'ОГРН', value: '324508100642517' },
    { label: 'Расчетный счет', value: '40802810640000501633' },
    { label: 'Банк', value: 'ПАО Сбербанк' },
    { label: 'БИК', value: '044525225' },
    { label: 'Корр. счет', value: '30101810400000000225' },
];

const RequisitesPage = () => {
    const [copiedValue, setCopiedValue] = useState<string | null>(null);

    const handleCopy = (value: string) => {
        navigator.clipboard.writeText(value).then(() => {
            setCopiedValue(value);
            setTimeout(() => setCopiedValue(null), 2000);
        }).catch(err => {
            console.error('Не удалось скопировать:', err);
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h1>Реквизиты юридического лица</h1>
                </div>
                <div className={styles.cardBody}>
                    <ul className={styles.detailsList}>
                        {requisitesData.map((item, index) => (
                            <li key={index} className={styles.detailsListItem}>
                                <div className={styles.itemContent}>
                                    <span className={styles.itemLabel}>{item.label}</span>
                                    <span className={styles.itemValue}>{item.value}</span>
                                </div>
                                <button
                                    onClick={() => handleCopy(item.value)}
                                    className={`${styles.copyButton} ${copiedValue === item.value ? styles.copied : ''}`}
                                >
                                    {copiedValue === item.value ? 'Скопировано' : 'Копировать'}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default RequisitesPage;