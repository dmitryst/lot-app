'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import styles from './admin-ads.module.css';

interface AdForModeration {
    id: string;
    title: string;
    description: string;
    price: number;
    region?: string;
    category?: string;
    createdAt: string;
    authorEmail: string;
    authorName: string;
    images: string[];
}

export default function AdminAdsClient() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [ads, setAds] = useState<AdForModeration[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!loading && (!user || !user.isAdmin)) {
            router.push('/');
            return;
        }

        if (user && user.isAdmin) {
            fetchAds();
        }
    }, [user, loading, router]);

    const fetchAds = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/admin/ads/moderation`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setAds(data);
            }
        } catch (e) {
            console.error('Ошибка загрузки объявлений', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/admin/ads/${id}/approve`, {
                method: 'POST',
                credentials: 'include'
            });
            if (res.ok) {
                setAds(prev => prev.filter(a => a.id !== id));
            }
        } catch (e) {
            console.error('Ошибка одобрения', e);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('Вы уверены, что хотите отклонить это объявление?')) return;
        
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/admin/ads/${id}/reject`, {
                method: 'POST',
                credentials: 'include'
            });
            if (res.ok) {
                setAds(prev => prev.filter(a => a.id !== id));
            }
        } catch (e) {
            console.error('Ошибка отклонения', e);
        }
    };

    if (loading || isLoading) return <div className={styles.container}>Загрузка...</div>;
    if (!user?.isAdmin) return null;

    return (
        <div className={styles.container}>
            <h1 className={styles.heading}>Модерация объявлений</h1>
            
            {ads.length === 0 ? (
                <div className={styles.emptyState}>
                    Нет объявлений, ожидающих модерации.
                </div>
            ) : (
                ads.map(ad => (
                    <div key={ad.id} className={styles.adCard}>
                        <div className={styles.adHeader}>
                            <div>
                                <h2 className={styles.adTitle}>{ad.title}</h2>
                                {ad.region && (
                                    <div className={styles.adAuthor}>
                                        Регион: {ad.region}
                                    </div>
                                )}
                                {ad.category && (
                                    <div className={styles.adAuthor}>
                                        Категория: {ad.category}
                                    </div>
                                )}
                                <div className={styles.adAuthor}>
                                    Автор: {ad.authorName || 'Без имени'} ({ad.authorEmail})
                                </div>
                                <div className={styles.adAuthor}>
                                    Дата: {new Date(ad.createdAt).toLocaleString('ru-RU')}
                                </div>
                            </div>
                            <div className={styles.adPrice}>
                                {ad.price.toLocaleString('ru-RU')} ₽
                            </div>
                        </div>

                        <div className={styles.adDescription}>
                            {ad.description}
                        </div>

                        {ad.images && ad.images.length > 0 && (
                            <div className={styles.imageGrid}>
                                {ad.images.map((img, idx) => (
                                    <img key={idx} src={img} alt={`Фото ${idx + 1}`} className={styles.imageItem} />
                                ))}
                            </div>
                        )}

                        <div className={styles.actions}>
                            <button onClick={() => handleApprove(ad.id)} className={styles.approveBtn}>
                                Одобрить
                            </button>
                            <button onClick={() => handleReject(ad.id)} className={styles.rejectBtn}>
                                Отклонить
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
