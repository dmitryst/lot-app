// Файл: app/login/register/page.tsx

'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from '../login.module.css';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (res.ok) {
                // Получаем returnUrl из параметров URL или используем referrer
                const returnUrl = searchParams.get('returnUrl') || searchParams.get('redirect');
                let redirectUrl = '/login?registered=true';
                
                if (returnUrl) {
                    redirectUrl += `&returnUrl=${encodeURIComponent(returnUrl)}`;
                } else if (typeof window !== 'undefined' && document.referrer) {
                    // Используем referrer, если он есть и это не страница регистрации/логина
                    const referrer = new URL(document.referrer);
                    if (referrer.pathname !== '/login/register' && referrer.pathname !== '/login') {
                        redirectUrl += `&returnUrl=${encodeURIComponent(referrer.pathname + referrer.search)}`;
                    }
                }

                // Успешная регистрация, перенаправляем на страницу входа с сохранением returnUrl
                router.push(redirectUrl);
            } else {
                const data = await res.json();
                setError(data.message || 'Ошибка регистрации. Попробуйте снова.');
            }
        } catch (err) {
            setError('Не удалось связаться с сервером. Проверьте ваше соединение.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.formWrapper}>
                <h1 className={styles.title}>Регистрация</h1>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="email" className={styles.label}>Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className={styles.input}
                            placeholder="you@example.com"
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="password" className={styles.label}>Пароль</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className={styles.input}
                            placeholder="••••••••"
                        />
                    </div>
                    {error && <p className={styles.errorMessage}>{error}</p>}
                    <button type="submit" className={styles.button} disabled={isLoading}>
                        {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                    </button>
                </form>
                <p className={styles.linkText}>
                    Уже есть аккаунт? <Link href="/login">Войти</Link>
                </p>
            </div>
        </div>
    );
}
