// Файл: app/payment-success/page.tsx
'use client';

import Link from 'next/link';
import styles from './payment-success.module.css';
import { useEffect } from 'react';

export default function PaymentSuccessPage() {

  useEffect(() => {
    // Здесь можно будет в будущем добавить логику, 
    // например, запустить обновление данных пользователя в контексте
    console.log("Пользователь вернулся после оплаты.");
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          ✓
        </div>
        <h1 className={styles.title}>Оплата прошла успешно!</h1>
        <p className={styles.message}>
          Ваша подписка активирована. Теперь вам доступны все возможности сервиса.
        </p>
        <Link href="/map" className={styles.button}>
          Перейти на карту
        </Link>
      </div>
    </div>
  );
}
