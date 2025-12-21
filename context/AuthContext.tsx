// context/AuthContext.tsx

'use client';

import { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    email: string;
}

interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Проверка сессии при загрузке
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/auth/me`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (res.ok) {
                    const data = await res.json();
                    setUser({ email: data.email });
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error("Auth check failed", error);
                setUser(null);
            } finally {
                setLoading(false); // Загрузка завершена
            }
        };

        checkAuth();
    }, []);

    const logout = useCallback(async () => {
        try {
            // Вызываем сервер, чтобы он очистил куку
            await fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error("Logout error", error);
            // Даже если сервер упал, на клиенте мы все равно выходим
        } finally {
            setUser(null);
            router.push('/login');
            router.refresh();
        }
    }, [router]);

    return (
        <AuthContext.Provider value={{ user, setUser, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
