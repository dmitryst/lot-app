'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import styles from './account.module.css';

const ProfileIcon = () => (
    <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const SubscriptionIcon = () => (
    <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
);

const AlertsIcon = () => (
    <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
);

// Функция для расчета оставшихся дней триала
const getTrialDaysLeft = (createdAt?: string) => {
    if (!createdAt) return 0;

    const createdDate = new Date(createdAt);
    const trialEndDate = new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();

    // Считаем разницу в миллисекундах и переводим в дни
    const diffTime = trialEndDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
};

// Вспомогательная функция для правильного склонения слова "день"
const getDaysWord = (days: number) => {
    if (days % 10 === 1 && days % 100 !== 11) return 'день';
    if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) return 'дня';
    return 'дней';
};


export default function AccountPage() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'profile' | 'subscription'>('profile');

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login?returnUrl=/account');
        }
    }, [user, authLoading, router]);

    // Можно вынести этот стиль в глобальный CSS, но для лоадера обычно оставляют так или создают класс .loader
    if (authLoading || !user) {
        return <div className="loading-state">Загрузка...</div>;
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
    };

    return (
        <main className={styles.container}>
            <h1 className={styles.pageTitle}>Личный кабинет</h1>

            <div className={styles.layout}>
                <aside className={styles.sidebar}>
                    <button
                        className={`${styles.tabLink} ${activeTab === 'profile' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <ProfileIcon />
                        Профиль
                    </button>

                    <button
                        className={`${styles.tabLink} ${activeTab === 'subscription' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('subscription')}
                    >
                        <SubscriptionIcon />
                        Подписка Pro
                    </button>

                    <Link href="/alerts" className={styles.tabLink}>
                        <AlertsIcon />
                        Мои уведомления
                    </Link>

                    <button
                        className={`${styles.tabLink} ${styles.logoutTab}`}
                        onClick={logout}
                    >
                        Выйти
                    </button>
                </aside>

                <section className={styles.contentArea}>

                    {activeTab === 'profile' && (
                        <div>
                            <h2 className={styles.sectionTitle}>Данные профиля</h2>

                            <div className={styles.infoBlock}>
                                <span className={styles.infoLabel}>Email</span>
                                <span className={styles.infoValue}>{user.email}</span>
                            </div>

                            {/* <div className={styles.infoBlock}>
                <span className={styles.infoLabel}>ID Пользователя</span>
                <span className={`${styles.infoValue} ${styles.idValue}`}>
                  {user.id}
                </span>
              </div> */}
                        </div>
                    )}

                    {activeTab === 'subscription' && (
                        <div>
                            <h2 className={styles.sectionTitle}>Управление подпиской</h2>

                            <div className={styles.infoBlock}>
                                <span className={styles.infoLabel}>Текущий статус</span>
                                {user.isOnTrial ? (
                                    <span className={`${styles.statusBadge} ${styles.statusPro}`}>
                                        Пробный период Pro (осталось {getTrialDaysLeft(user.createdAt)} {getDaysWord(getTrialDaysLeft(user.createdAt))})
                                    </span>
                                ) : user.isSubscriptionActive ? (
                                    <span className={`${styles.statusBadge} ${styles.statusPro}`}>Активна (Pro)</span>
                                ) : (
                                    <span className={`${styles.statusBadge} ${styles.statusBasic}`}>Базовая</span>
                                )}
                            </div>

                            {/* Показываем дату окончания ТОЛЬКО если подписка куплена.
                            Для триала мы дату не показываем, так как там есть счетчик дней */}
                            {user.isSubscriptionActive && !user.isOnTrial && user.subscriptionEndDate && (
                                <div className={styles.infoBlock}>
                                    <span className={styles.infoLabel}>Действует до</span>
                                    <span className={styles.infoValue}>{formatDate(user.subscriptionEndDate)}</span>
                                </div>
                            )}

                            {/* Блок с предложением купить подписку показываем если юзер на базе 
                            ИЛИ если он на триале (чтобы он мог купить заранее) */}
                            {(!user.isSubscriptionActive || user.isOnTrial) && (
                                <div className={styles.upsellBlock}>
                                    <h3 className={styles.upsellTitle}>
                                        {user.isOnTrial ? 'Продлите Pro-доступ' : 'Перейдите на Pro тариф'}
                                    </h3>
                                    <p className={styles.upsellText}>
                                        Получите доступ к AI-оценке лотов, настройке мгновенных email-уведомлений по вашим фильтрам и глубокой аналитике торгов.
                                    </p>
                                    <Link href="/subscribe" className={styles.subscribeButton}>
                                        Оформить подписку
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
