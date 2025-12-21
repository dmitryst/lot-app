'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
    isFavorite: (lotId: string) => boolean;
    toggleFavorite: (e: React.MouseEvent, lotId: string) => Promise<void>;
    favoritesCount: number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {

    const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

    // Подключаем хуки
    const { user } = useAuth(); // Берем пользователя из AuthContext
    const router = useRouter();

    // Функция загрузки (загружаем, только если есть user)
    const fetchFavorites = useCallback(async () => {
        // Если пользователя нет, очищаем стейт (важно при выходе из аккаунта)
        if (!user) {
            setFavoriteIds(new Set());
            return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL;
        if (!apiUrl) return;

        try {
            const res = await fetch(`${apiUrl}/api/favorites/ids`, {
                method: 'GET',
                credentials: 'include',
            });
            if (res.ok) {
                const ids: string[] = await res.json();
                setFavoriteIds(new Set(ids));
            }
        } catch (e) {
            console.error("Failed to fetch favorites", e);
        }
    }, [user]);

    useEffect(() => {
        fetchFavorites();
    }, [fetchFavorites]);

    // Функция переключения
    const toggleFavorite = async (e: React.MouseEvent, lotId: string) => {
        e.preventDefault();
        e.stopPropagation();

        // редирект, если нет пользователя
        if (!user) {
            // Формируем URL для возврата (текущий путь + параметры)
            const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
            router.push(`/login?returnUrl=${returnUrl}`);
            return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL;

        // Оптимистичное обновление
        const isFav = favoriteIds.has(lotId);
        const newFavorites = new Set(favoriteIds);
        if (isFav) newFavorites.delete(lotId);
        else newFavorites.add(lotId);
        setFavoriteIds(newFavorites);

        try {
            const res = await fetch(`${apiUrl}/api/favorites/toggle/${lotId}`, {
                method: 'POST',
                credentials: 'include'
            });

            if (!res.ok) {
                setFavoriteIds(favoriteIds);  // Откат
                if (res.status === 401) {
                    // Если токен истек, тоже редиректим
                    router.push('/login');
                }
            }
        } catch (err) {
            setFavoriteIds(favoriteIds);
        }
    };

    const isFavorite = (lotId: string) => favoriteIds.has(lotId);

    const favoritesCount = favoriteIds.size;

    return (
        <FavoritesContext.Provider value={{ isFavorite, toggleFavorite, favoritesCount }}>
            {children}
        </FavoritesContext.Provider>
    );
};

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (!context) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
};
