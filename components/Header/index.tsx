'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import styles from './styles.module.css';
import { usePromoVisibility } from '../../app/hooks/usePromoVisibility';
import { hot_lot_id } from '../../app/data/constants';

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

    // Используем ТОТ ЖЕ ID, что и в баннере!
    const promoId = hot_lot_id;
    const { isVisible, isMounted, showPromo } = usePromoVisibility(promoId);

    return (
        <header className={styles.headerWrapper}>
            <div className={styles.headerContent}>

                {/* --- ЛЕВАЯ ЧАСТЬ: ЛОГОТИП --- */}
                <div className={styles.leftSection}>
                    <Link href="/" className={styles.logoLink}>
                        <Image
                            src="/s-lot_logo.png"
                            alt="s-lot.ru Логотип"
                            width={120} // Примерная ширина (Next.js требует width/height)
                            height={40} // Высота
                            className={styles.logoImage}
                            priority // Загружать сразу, так как это LCP элемент
                        />
                    </Link>
                </div>

                {/* --- ПРАВАЯ ЧАСТЬ: МЕНЮ --- */}
                <div className={styles.rightSection}>

                    {/* КНОПКА ВОССТАНОВЛЕНИЯ */}
                    {/* Показываем ТОЛЬКО если баннер СКРЫТ (!isVisible) */}
                    {isMounted && !isVisible && (
                        <button onClick={showPromo} className={styles.restorePromoButton}>
                            🔥 <span className={styles.restoreText}>Лот месяца</span>
                        </button>
                    )}

                    {user ? (
                        <>
                            <span className={styles.userInfo}>{user.email}</span>

                            {/* Избранное */}
                            <Link href="/favorites" className={styles.favLink} title="Избранное">
                                <svg viewBox="0 0 24 24" className={styles.favIcon}>
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                                {favoritesCount > 0 && <span className={styles.badge}>{favoritesCount}</span>}
                            </Link>

                            {/* Аккаунт / Профиль */}
                            <Link href="/account" className={styles.accountLink} title="Аккаунт">
                                <svg className={styles.accountIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                <span className={styles.accountText}>Аккаунт</span>
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
            </div>
        </header>
    );
};
