/* components/FavoriteButton/index.tsx */

'use client';
import { useFavorites } from '../../context/FavoritesContext';
import styles from './styles.module.css';

interface FavoriteButtonProps {
    lotId: string;
    className?: string;
}

export const FavoriteButton = ({ lotId, className }: FavoriteButtonProps) => {
    const { isFavorite, toggleFavorite } = useFavorites();
    const active = isFavorite(lotId);

    // класс кнопки берется из пропса className ИЛИ из styles.favoriteButton
    // если className передается снаружи, он должен дополнять, а не заменять стили
    return (
        <button 
            // Комбинируем стили: базовый стиль кнопки + внешний (если есть)
            className={`${styles.favoriteButton} ${className || ''}`}
            onClick={(e) => toggleFavorite(e, lotId)}
            title={active ? "Убрать из избранного" : "В избранное"}
        >
            <svg 
                viewBox="0 0 24 24" 
                // Применяем класс active, если лот в избранном
                className={`${styles.favoriteIcon} ${active ? styles.active : ''}`}
            >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
        </button>
    );
};

