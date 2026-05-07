'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from './AuthContext';

interface ChatContextType {
    unreadCount: number;
    setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
    connection: signalR.HubConnection | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

    useEffect(() => {
        if (!user) {
            if (connection) {
                connection.stop();
                setConnection(null);
            }
            return;
        }

        // Загружаем начальное количество непрочитанных
        fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/chat/inbox`, {
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                const count = data.reduce((acc: number, item: any) => acc + item.unreadCount, 0);
                setUnreadCount(count);
            })
            .catch(console.error);

        // Подключаемся к SignalR
        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/chathub`, {
                withCredentials: true // Важно для передачи куки
            })
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);
    }, [user]);

    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    console.log('Connected to SignalR');
                    connection.on('ReceiveMessage', (message) => {
                        // При получении нового сообщения увеличиваем счетчик
                        // (если мы не находимся в активном чате, но это можно будет обработать на странице inbox)
                        setUnreadCount(prev => prev + 1);
                    });
                })
                .catch(e => console.log('Connection failed: ', e));
        }
    }, [connection]);

    return (
        <ChatContext.Provider value={{ unreadCount, setUnreadCount, connection }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}
