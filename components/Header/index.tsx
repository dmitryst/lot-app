'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import styles from './styles.module.css';

export const Header = () => {
    const { user, logout } = useAuth();
    const { favoritesCount } = useFavorites();

    // --- ПОЛУЧАЕМ ТЕКУЩИЙ URL ---
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Собираем полный путь (например, "/?page=2")
    // Если параметров нет, searchParams.toString() вернет пустую строку
    const currentPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    // Формируем ссылку для входа
    // encodeURIComponent важен, чтобы спецсимволы не сломали URL
    const loginHref = `/login?returnUrl=${encodeURIComponent(currentPath)}`;

    return (
        <header className={styles.headerWrapper}>
            <div className={styles.headerContent}>
                {user ? (
                    <>
                        <span className={styles.userInfo}>{user.email}</span>

                        <Link href="/favorites" className={styles.favLink} title="Избранное">
                            <svg viewBox="0 0 24 24" className={styles.favIcon}>
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                            {favoritesCount > 0 && <span>{favoritesCount}</span>}
                        </Link>

                        <button onClick={logout} className={styles.logoutBtn}>
                            Выйти
                        </button>
                    </>
                ) : (
                    <Link href={loginHref} className={styles.loginLink}>
                        Войти
                    </Link>
                )}
            </div>
        </header>
    );
};
