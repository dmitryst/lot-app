// components/Pagination.tsx

import React from 'react';
import styles from './Pagination.module.css';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

// Эта функция будет генерировать массив страниц для отображения
const getPaginationRange = (totalPages: number, currentPage: number): (number | '...')[] => {
  const delta = 5; // Сколько страниц показывать вокруг текущей
  const range: (number | '...')[] = [];
  
  // Вспомогательная переменная, чтобы не добавлять многоточие подряд
  let lastAdded: number | '...' | null = null; 

  for (let i = 1; i <= totalPages; i++) {
    // Условие для добавления номера страницы:
    // 1. Это первая страница
    // 2. Это последняя страница
    // 3. Страница находится в "коридоре" вокруг текущей
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      range.push(i);
      lastAdded = i;
    } 
    // Условие для добавления многоточия:
    // если мы находимся за пределами коридора и многоточие еще не было добавлено
    else if (lastAdded !== '...') { 
      range.push('...');
      lastAdded = '...';
    }
  }

  return range;
};

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) {
        return null; // Не показываем пагинацию, если страница всего одна
    }

    const pages = getPaginationRange(totalPages, currentPage);

    return (
        <div className={styles.paginationContainer}>
            {/* Кнопки "К началу" и "<" */}
            <button
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className={styles.navButton}
            >
                К началу
            </button>
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={styles.arrowButton}
            >
                &lt;
            </button>

            {/* Проходим по массиву pages и рисуем либо кнопку с номером страницы, либо многоточие */}
            {pages.map((page, index) =>
                typeof page === 'number' ? (  // Если элемент массива число — рисуем кликабельную кнопку <button>
                    <button
                        key={index}
                        onClick={() => onPageChange(page)}
                        className={`${styles.pageButton} ${currentPage === page ? styles.active : ''}`}
                    >
                        {page}
                    </button>
                ) : (  // Если нет (значит, это строка '...') — рисуем некликабельный <span>
                    <span key={index} className={styles.ellipsis}>
                        {page}
                    </span>
                )
            )}

            {/* Кнопка ">" */}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={styles.arrowButton}
            >
                &gt;
            </button>
        </div>
    );
}
