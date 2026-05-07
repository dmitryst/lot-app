// app/components/ChatModel/ChatModel.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './ChatModal.module.css';
import { useChat } from '@/context/ChatContext';

interface Message {
    id: string;
    roomId?: string;
    senderId: string;
    text: string;
    createdAt: string;
    isRead?: boolean;
}

interface ChatModalProps {
    adId: string;
    adTitle: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function ChatModal({ adId, adTitle, isOpen, onClose }: ChatModalProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [roomId, setRoomId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { connection } = useChat();

    // Имитация загрузки истории сообщений
    useEffect(() => {
        if (isOpen) {
            fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/chat/history?adId=${adId}`, {
                credentials: 'include' // Важно для передачи Cookie/Токена авторизации
            })
                .then(res => res.json())
                .then((data: Message[]) => {
                    setMessages(data);
                    if (data.length > 0 && data[0].roomId) {
                        setRoomId(data[0].roomId);
                        // Помечаем как прочитанные
                        fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/chat/read`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ roomId: data[0].roomId })
                        });
                    }
                })
                .catch(err => console.error(err));
        }
    }, [isOpen, adId]);

    // Обработка входящих сообщений через SignalR
    useEffect(() => {
        if (connection && isOpen) {
            const handleReceiveMessage = (message: Message) => {
                // Если сообщение для текущего объявления
                // В идеале проверять по roomId, но если чат только начат, roomId может еще не быть.
                // Поэтому проверяем, если roomId совпадает или если это первое сообщение (тогда просто перезагрузим историю)
                if (roomId && message.roomId?.toLowerCase() === roomId.toLowerCase() && message.senderId !== 'me') {
                    setMessages(prev => [...prev, message]);
                    
                    fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/chat/read`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ roomId: roomId })
                    });
                } else if (!roomId) {
                    // Если комнаты еще не было, но пришло сообщение (например, мы сами только что написали и нам ответили)
                    // Просто перезагрузим историю
                    fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/chat/history?adId=${adId}`, {
                        credentials: 'include'
                    })
                        .then(res => res.json())
                        .then((data: Message[]) => {
                            setMessages(data);
                            if (data.length > 0 && data[0].roomId) setRoomId(data[0].roomId);
                        });
                }
            };

            const handleMessagesRead = (data: { roomId?: string, RoomId?: string }) => {
                const rId = data.roomId || data.RoomId;
                if (roomId && rId && roomId.toLowerCase() === rId.toLowerCase()) {
                    setMessages(prev => prev.map(m => m.senderId === 'me' ? { ...m, isRead: true } : m));
                }
            };

            connection.on('ReceiveMessage', handleReceiveMessage);
            connection.on('MessagesRead', handleMessagesRead);
            return () => {
                connection.off('ReceiveMessage', handleReceiveMessage);
                connection.off('MessagesRead', handleMessagesRead);
            };
        }
    }, [connection, isOpen, roomId, adId]);

    // Прокрутка вниз при новом сообщении
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!isOpen) return null;

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        // Временно добавляем в UI (чтобы пользователь не ждал)
        const tempMessage = {
            id: Date.now().toString(), senderId: 'me', text: inputValue.trim(), createdAt: new Date().toISOString(), isRead: false
        };
        setMessages(prev => [...prev, tempMessage]);
        setInputValue('');

        try {
            // Отправляем на бэкенд
            const res = await fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/chat/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ adId, text: tempMessage.text })
            });
            const data = await res.json();
            if (data.roomId && !roomId) {
                setRoomId(data.roomId);
            }
            // Если все ок - бэкенд сохранил сообщение. 
            // При обновлении страницы оно придет из истории.
        } catch (e) {
            console.error('Ошибка отправки', e);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>

                {/* Шапка чата */}
                <div className={styles.header}>
                    <div>
                        <h3 className={styles.title}>Чат с продавцом</h3>
                        <p className={styles.subtitle}>{adTitle}</p>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                {/* Область сообщений */}
                <div className={styles.messagesArea}>
                    {messages.map(msg => {
                        const isMe = msg.senderId === 'me';
                        const isSystem = msg.senderId === 'system';

                        if (isSystem) {
                            return <div key={msg.id} className={styles.systemMessage}>{msg.text}</div>;
                        }

                        return (
                            <div key={msg.id} className={`${styles.messageWrapper} ${isMe ? styles.myMessage : styles.theirMessage}`}>
                                <div className={styles.messageBubble}>
                                    {msg.text}
                                </div>
                                <span className={styles.time}>
                                    {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                    {isMe && (
                                        <span className={`${styles.checkmarks} ${msg.isRead ? styles.read : ''}`}>
                                            {msg.isRead ? '✓✓' : '✓'}
                                        </span>
                                    )}
                                </span>
                            </div>
                        );
                    })}
                    {isLoading && <div className={styles.typing}>Продавец печатает...</div>}
                    <div ref={messagesEndRef} />
                </div>

                {/* Ввод текста */}
                <div className={styles.inputArea}>
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="Напишите сообщение..."
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                    />
                    <button className={styles.sendBtn} onClick={handleSend} disabled={!inputValue.trim()}>
                        Отправить
                    </button>
                </div>

            </div>
        </div>
    );
}