// app/components/RegionSelect.tsx
// компонент управляет состоянием "открыто/закрыто" и отображает либо "инпут", либо панель с деревом
'use client';

import React, { useState, useRef } from 'react';
import { useOutsideClick } from '../app/hooks/useOutsideClick';
import RegionTree from './RegionTree';
import styles from './CategorySelect.module.css';

const ClearIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

type RegionNode = {
    name: string;
    children?: RegionNode[];
};

type Props = {
    regions: RegionNode[];
    selectedRegions: string[];
    onChange: (selected: string[]) => void;
    onApply?: () => void;
};

export default function RegionSelect({ regions, selectedRegions, onChange, onApply }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Используем хук, чтобы закрывать панель при клике снаружи
    useOutsideClick(wrapperRef, () => setIsOpen(false));

    const getSelectionText = () => {
        const count = selectedRegions.length;

        // Случай, когда ничего не выбрано
        if (count === 0) {
            return 'Выберите регионы';
        }

        // Создаем объект с правилами для русского языка
        const rules = new Intl.PluralRules('ru-RU');
        // Определяем форму слова ('one', 'few', 'many') для нашего числа
        const pluralForm = rules.select(count);

        switch (pluralForm) {
            case 'one':
                // Для чисел, заканчивающихся на 1 (кроме 11)
                return `Выбран ${count} регион`;
            case 'few':
                // Для чисел, заканчивающихся на 2, 3, 4 (кроме 12, 13, 14)
                return `Выбрано ${count} региона`;
            case 'many':
                // Для всех остальных чисел (5, 11, 25 и т.д.)
                return `Выбрано ${count} регионов`;
            default:
                // Резервный вариант, работает так же, как 'many'
                return `Выбрано ${count} регионов`;
        }
    };

    const tooltipText = selectedRegions.length > 0
        ? selectedRegions.join(', ')
        : '';

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation(); // Важно: чтобы не открывалась/закрывалась панель
        onChange([]); // Сбрасываем выбор
    };

    // Обработчик кнопки "Применить"
    const handleApplyClick = () => {
        setIsOpen(false);
        if (onApply) {
            onApply(); // Запускаем поиск
        }
    };

    return (
        <div className={styles.container} ref={wrapperRef}>
            <div className={styles.inputRow}>
                {/* Это наш "фальшивый" инпут */}
                <div
                    className={styles.selectTrigger}
                    onClick={() => setIsOpen(!isOpen)}
                    tabIndex={0}
                    title={tooltipText}
                >
                    <span className={styles.text}>{getSelectionText()}</span>

                    {/* Блок с иконками справа */}
                    <div className={styles.iconsWrapper}>
                        {/* КРЕСТИК: Показываем только если есть выбранные регионы */}
                        {selectedRegions.length > 0 && (
                            <button
                                type="button"
                                className={styles.clearButton}
                                onClick={handleClear}
                                title="Очистить"
                            >
                                <ClearIcon />
                            </button>
                        )}

                        <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`}>
                            ▼
                        </span>
                    </div>
                </div>
            </div>

            {/* Всплывающая панель с деревом регионов */}
            {isOpen && (
                <div className={styles.popover}>
                    <RegionTree
                        regions={regions}
                        selectedRegions={selectedRegions}
                        onChange={onChange}
                    />
                    <div className={styles.footer}>
                        <button
                            className={styles.resetButton}
                            onClick={() => onChange([])}
                            disabled={selectedRegions.length === 0}
                        >
                            Сбросить все
                        </button>
                        <button
                            className={styles.applyButton}
                            onClick={handleApplyClick}
                        >
                            Применить
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
