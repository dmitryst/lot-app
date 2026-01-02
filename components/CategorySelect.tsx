// app/components/CategorySelect.tsx
// компонент управляет состоянием "открыто/закрыто" и отображает либо "инпут", либо панель с деревом
'use client';

import React, { useState, useRef } from 'react';
import { useOutsideClick } from '../app/hooks/useOutsideClick';
import CategoryTree from './CategoryTree';
import styles from './CategorySelect.module.css';

type CategoryNode = {
    name: string;
    children?: CategoryNode[];
};

type Props = {
    categories: CategoryNode[];
    selectedCategories: string[];
    onChange: (selected: string[]) => void;
};

export default function CategorySelect({ categories, selectedCategories, onChange }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Используем хук, чтобы закрывать панель при клике снаружи
    useOutsideClick(wrapperRef, () => setIsOpen(false));

    const getSelectionText = () => {
        const count = selectedCategories.length;

        // Случай, когда ничего не выбрано
        if (count === 0) {
            return 'Выберите категории';
        }

        // Создаем объект с правилами для русского языка
        const rules = new Intl.PluralRules('ru-RU');
        // Определяем форму слова ('one', 'few', 'many') для нашего числа
        const pluralForm = rules.select(count);

        switch (pluralForm) {
            case 'one':
                // Для чисел, заканчивающихся на 1 (кроме 11)
                return `Выбрана ${count} категория`;
            case 'few':
                // Для чисел, заканчивающихся на 2, 3, 4 (кроме 12, 13, 14)
                return `Выбраны ${count} категории`;
            case 'many':
                // Для всех остальных чисел (5, 11, 25 и т.д.)
                return `Выбраны ${count} категорий`;
            default:
                // Резервный вариант, работает так же, как 'many'
                return `Выбраны ${count} категорий`;
        }
    };

    const tooltipText = selectedCategories.length > 0
        ? selectedCategories.join(', ')
        : '';

    return (
        <div className={styles.container} ref={wrapperRef}>
            <div className={styles.inputRow}>
                {/* <label className={styles.label}>Категории</label> */}
                {/* Это наш "фальшивый" инпут */}
                <div
                    className={styles.selectTrigger}
                    onClick={() => setIsOpen(!isOpen)}
                    tabIndex={0}
                    title={tooltipText}
                >
                    <span>{getSelectionText()}</span>
                    <span className={`${styles.arrow} ${isOpen ? styles.arrowUp : ''}`}>▼</span>
                </div>
            </div>

            {/* Всплывающая панель с деревом категорий */}
            {isOpen && (
                <div className={styles.popover}>
                    <CategoryTree
                        categories={categories}
                        selectedCategories={selectedCategories}
                        onChange={onChange}
                    />
                    <div className={styles.popoverActions}>
                        <button
                            className={styles.applyButton}
                            onClick={() => setIsOpen(false)}
                        >
                            Применить
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
