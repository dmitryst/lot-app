// app/components/ChatModel/ChatModel.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './ChatModal.module.css';

interface Message {
    id: string;
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
    // В будущем сюда нужно будет передавать currentUserId, чтобы отличать свои сообщения
}

export default function ChatModal({ adId, adTitle, isOpen, onClose }: ChatModalProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Имитация загрузки истории сообщений
    useEffect(() => {
        if (isOpen) {
            fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/chat/history?adId=${adId}`, {
                credentials: 'include' // Важно для передачи Cookie/Токена авторизации
            })
                .then(res => res.json())
                .then(data => setMessages(data))
                .catch(err => console.error(err));
        }
    }, [isOpen, adId]);

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
            await fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/chat/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ adId, text: tempMessage.text })
            });
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