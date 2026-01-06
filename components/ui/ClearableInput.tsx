// components/ui/ClearableInput.tsx
import React from 'react';
import styles from './ClearableInput.module.css';

interface ClearableInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear: () => void;
  icon?: React.ReactNode; // проп для иконки
}

const ClearIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default function ClearableInput({ onClear, className, icon, ...props }: ClearableInputProps) {
  return (
    <div className={styles.wrapper}>
      {/* Если передана иконка, рендерим её */}
      {icon && <div className={styles.leftIconWrapper}>{icon}</div>}

      <input
        {...props}
        className={`
          ${styles.input} 
          ${icon ? styles.withIcon : ''} 
        `}
      />

      {/* Показываем крестик только если есть value */}
      {props.value && (
        <button
          type="button"
          className={styles.clearButton}
          onClick={onClear}
          title="Очистить"
          tabIndex={-1} // Чтобы не фокусироваться на крестике при переключении Tab-ом (опционально)
        >
          <ClearIcon />
        </button>
      )}
    </div>
  );
}
