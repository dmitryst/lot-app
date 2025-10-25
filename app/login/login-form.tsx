// Файл: app/login/login-form.tsx

'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import styles from './login.module.css';

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { setUser } = useAuth();

    // useSearchParams безопасно используется в клиентском компоненте
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('registered') === 'true') {
            setSuccessMessage('Регистрация прошла успешно! Теперь вы можете войти.');
        }
    }, [searchParams]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
                credentials: 'include',
            });

            if (res.ok) {
                const data = await res.json();
                setUser({ email: data.email });
                router.push('/map');
                return;
            }
            
            if (res.status === 401) {
                setError('Ошибка входа. Проверьте email и пароль.');
            } else {
                try {
                    const errorData = await res.json();
                    setError(errorData.message || `Произошла ошибка: ${res.statusText}`);
                } catch {
                    setError(`Произошла ошибка на сервере: ${res.status} ${res.statusText}`);
                }
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
                <h1 className={styles.title}>Вход</h1>
                <form onSubmit={handleSubmit} className={styles.form}>
                    {successMessage && <div className={styles.successMessage}>{successMessage}</div>}
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
                            className={styles.input}
                            placeholder="••••••••"
                        />
                    </div>
                    {error && <div className={styles.errorMessage}>{error}</div>}
                    <button type="submit" className={styles.button} disabled={isLoading}>
                        {isLoading ? 'Вход...' : 'Войти'}
                    </button>
                </form>
                <p className={styles.linkText}>
                    Нет аккаунта? <Link href="/register">Зарегистрироваться</Link>
                </p>
            </div>
        </div>
    );
}
