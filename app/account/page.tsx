'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import styles from './account.module.css';
import pageStyles from '../page.module.css';
import AdCard from '@/components/AdCard/AdCard';
import { LotItem } from '@/components/LotItem';

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

const AdsIcon = () => (
    <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
);

const VotesIcon = () => (
    <svg className={styles.tabIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
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
    const [activeTab, setActiveTab] = useState<'profile' | 'subscription' | 'my-ads' | 'my-votes'>('profile');
    const [myAds, setMyAds] = useState<any[]>([]);
    const [loadingAds, setLoadingAds] = useState(false);

    const [myVotes, setMyVotes] = useState<any[]>([]);
    const [loadingVotes, setLoadingVotes] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login?returnUrl=/account');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (activeTab === 'my-ads' && user) {
            fetchMyAds();
        } else if (activeTab === 'my-votes' && user) {
            fetchMyVotes();
        }
    }, [activeTab, user]);

    const fetchMyAds = async () => {
        setLoadingAds(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/ads/my`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setMyAds(data);
            }
        } catch (e) {
            console.error('Ошибка загрузки моих объявлений', e);
        } finally {
            setLoadingAds(false);
        }
    };

    const fetchMyVotes = async () => {
        setLoadingVotes(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/voted-lots?page=1&pageSize=50`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                // API возвращает PaginatedResult<LotDto> { items: [...], totalCount: N, ... }
                setMyVotes(data.items || []);
            }
        } catch (e) {
            console.error('Ошибка загрузки лотов, за которые вы голосовали', e);
        } finally {
            setLoadingVotes(false);
        }
    };

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

                    <button
                        className={`${styles.tabLink} ${activeTab === 'my-ads' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('my-ads')}
                    >
                        <AdsIcon />
                        Мои объявления
                    </button>

                    <button
                        className={`${styles.tabLink} ${activeTab === 'my-votes' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('my-votes')}
                    >
                        <VotesIcon />
                        Мои голоса за ИИ-анализ
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
                                <span className={styles.infoLabel}>Имя пользователя</span>
                                <span className={styles.infoValue}>{user.name || 'Не указано'}</span>
                            </div>

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

                    {activeTab === 'my-ads' && (
                        <div>
                            <h2 className={styles.sectionTitle}>Мои объявления</h2>
                            
                            {loadingAds ? (
                                <div>Загрузка объявлений...</div>
                            ) : myAds.length === 0 ? (
                                <div>
                                    <p style={{ marginBottom: '16px', color: '#666' }}>У вас пока нет объявлений.</p>
                                    <Link href="/add-ad" className={styles.subscribeButton} style={{ display: 'inline-block' }}>
                                        Подать объявление
                                    </Link>
                                </div>
                            ) : (
                                <div className={styles.adsGrid}>
                                    {myAds.map(ad => (
                                        <AdCard key={ad.id} ad={ad} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === 'my-votes' && (
                        <div>
                            <h2 className={styles.sectionTitle}>Лоты, ожидающие ИИ-анализа</h2>
                            <p style={{ color: '#4a5568', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                                Здесь показаны лоты, за которые вы отдали свой голос. Вы можете проголосовать одновременно за 
                                {user?.isSubscriptionActive && user?.subscriptionEndDate && new Date(user.subscriptionEndDate) > new Date() ? ' 10 ' : ' 3 '} 
                                лота. Если лимит исчерпан, отмените голос у неактуального лота, зайдя на его страницу, чтобы проголосовать за новый.
                            </p>
                            
                            {loadingVotes ? (
                                <div>Загрузка...</div>
                            ) : myVotes.length === 0 ? (
                                <p style={{ color: '#718096' }}>Вы пока не проголосовали ни за один лот.</p>
                            ) : (
                                <div className={pageStyles.lotsGrid}>
                                    {myVotes.map(lot => (
                                        <LotItem key={lot.id} lot={lot} />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
