// context/AuthContext.tsx

'use client';

import { createContext, useState, useContext, ReactNode } from 'react';

// Определяем типы
interface User {
    email: string;
}

interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    // Здесь можно добавить функции login, logout, register
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    return (
        <AuthContext.Provider value={{ user, setUser }}>
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
