'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useOutsideClick } from '@/app/hooks/useOutsideClick';
import triggerStyles from './CategorySelect.module.css';
import listStyles from './FilterSingleSelect.module.css';

const ClearIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

type Props = {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    disabled?: boolean;
    loading?: boolean;
    emptyMessage?: string;
};

export default function FilterSingleSelect({
    options,
    value,
    onChange,
    placeholder,
    disabled = false,
    loading = false,
    emptyMessage = 'Нет доступных значений',
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useOutsideClick(wrapperRef, () => {
        setIsOpen(false);
        setSearch('');
    });

    const filteredOptions = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) {
            return options;
        }
        return options.filter(option => option.toLowerCase().includes(query));
    }, [options, search]);

    const displayText = loading
        ? 'Загрузка...'
        : value || placeholder;

    const handleToggle = () => {
        if (disabled || loading) {
            return;
        }
        setIsOpen(prev => !prev);
        if (isOpen) {
            setSearch('');
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
    };

    const handleSelect = (option: string) => {
        onChange(option);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className={triggerStyles.container} ref={wrapperRef}>
            <div className={triggerStyles.inputRow}>
                <div
                    className={`${triggerStyles.selectTrigger} ${disabled || loading ? listStyles.disabledTrigger : ''}`}
                    onClick={handleToggle}
                    tabIndex={disabled || loading ? -1 : 0}
                    title={value || undefined}
                >
                    <span className={triggerStyles.text}>{displayText}</span>

                    <div className={triggerStyles.iconsWrapper}>
                        {value && !disabled && !loading && (
                            <button
                                type="button"
                                className={triggerStyles.clearButton}
                                onClick={handleClear}
                                title="Очистить"
                            >
                                <ClearIcon />
                            </button>
                        )}

                        <span className={`${triggerStyles.arrow} ${isOpen ? triggerStyles.arrowOpen : ''}`}>
                            ▼
                        </span>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className={triggerStyles.popover}>
                    {options.length > 8 && (
                        <input
                            type="text"
                            className={listStyles.searchInput}
                            placeholder="Поиск..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    )}

                    <div className={listStyles.optionsList}>
                        {filteredOptions.length === 0 ? (
                            <div className={listStyles.emptyMessage}>{emptyMessage}</div>
                        ) : (
                            filteredOptions.map(option => (
                                <button
                                    key={option}
                                    type="button"
                                    className={`${listStyles.option} ${value === option ? listStyles.optionSelected : ''}`}
                                    onClick={() => handleSelect(option)}
                                >
                                    {option}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
