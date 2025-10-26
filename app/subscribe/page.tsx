// Файл: app/subscribe/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './subscribe.module.css';

export default function SubscribePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubscribeClick = async () => {
        setIsLoading(true);
        if (!user) {
            router.push('/login?redirect=/subscribe');
            return;
        }

        // Запрос к бэкенду для создания сессии оплаты
        try {
            const res = await fetch('/api/payments/create-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Можно передать ID тарифа, если их будет несколько
                body: JSON.stringify({ planId: 'pro-monthly' }) 
            });

            if (res.ok) {
                const { checkoutUrl } = await res.json();
                // Перенаправление на страницу платежного шлюза
                window.location.href = checkoutUrl;
            } else {
                alert('Не удалось создать сессию оплаты. Попробуйте позже.');
                setIsLoading(false);
            }
        } catch (error) {
            alert('Произошла ошибка. Попробуйте позже.');
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Разблокируйте полный доступ</h1>
                <p>Получите неограниченный доступ ко всем объектам на карте и расширенным фильтрам для максимально эффективного поиска.</p>
            </header>

            <section className={styles.pricingWrapper}>
                <div className={styles.pricingCard}>
                    <h2 className={styles.planName}>PRO</h2>
                    <p className={styles.price}>500₽<span>/месяц</span></p>
                    <ul className={styles.featureList}>
                        <li className={styles.featureItem}>Полный доступ ко всем объектам</li>
                        <li className={styles.featureItem}>Неограниченное использование фильтров</li>
                        <li className={styles.featureItem}>Просмотр детальной информации</li>
                        {/* <li className={styles.featureItem}>Приоритетная поддержка</li> */}
                    </ul>
                    <button onClick={handleSubscribeClick} disabled={isLoading} className={styles.ctaButton}>
                        {isLoading ? 'Переходим к оплате...' : 'Оформить подписку'}
                    </button>
                </div>
            </section>

            <section className={styles.faqSection}>
                <h2>Часто задаваемые вопросы</h2>
                <div className={styles.faqItem}>
                    <h3 className={styles.faqQuestion}>Могу ли я отменить подписку в любое время?</h3>
                    <p className={styles.faqAnswer}>Да, вы можете отменить подписку в любой момент в вашем личном кабинете. Доступ к PRO-функциям сохранится до конца оплаченного периода.</p>
                </div>
                <div className={styles.faqItem}>
                    <h3 className={styles.faqQuestion}>Какие способы оплаты вы принимаете?</h3>
                    <p className={styles.faqAnswer}>Мы принимаем все основные банковские карты (Visa, MasterCard, Мир) через безопасный платежный шлюз.</p>
                </div>
                <div className={styles.faqItem}>
                    <h3 className={styles.faqQuestion}>Что произойдет после оплаты?</h3>
                    <p className={styles.faqAnswer}>Сразу после успешной оплаты PRO-статус будет активирован для вашего аккаунта, и вы получите полный доступ ко всем функциям сайта.</p>
                </div>
            </section>
        </div>
    );
}
