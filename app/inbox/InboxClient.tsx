'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import styles from './inbox.module.css';
import Image from 'next/image';

interface InboxItem {
    roomId: string;
    adId: string;
    adTitle: string;
    adImageUrl: string;
    companionName: string;
    lastMessageText: string;
    lastMessageDate: string;
    unreadCount: number;
}

interface Message {
    id: string;
    roomId?: string;
    senderId: string;
    text: string;
    createdAt: string;
    isRead?: boolean;
}

export default function InboxClient() {
    const { user } = useAuth();
    const { connection, setUnreadCount } = useChat();
    const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
    const [activeRoom, setActiveRoom] = useState<InboxItem | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Загрузка списка диалогов
    const loadInbox = () => {
        fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/chat/inbox`, {
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => setInboxItems(data))
            .catch(console.error);
    };

    useEffect(() => {
        if (user) {
            loadInbox();
        }
    }, [user]);

    // Обработка входящих сообщений через SignalR
    useEffect(() => {
        if (connection) {
            const handleReceiveMessage = (message: Message) => {
                // Если сообщение для текущего активного чата
                if (activeRoom && message.roomId?.toLowerCase() === activeRoom.roomId.toLowerCase() && message.senderId !== 'me') {
                    setMessages(prev => [...prev, message]);
                    
                    // Сразу помечаем как прочитанное
                    fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/chat/read`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ roomId: activeRoom.roomId })
                    });
                }
                loadInbox();
            };

            const handleMessagesRead = (data: { roomId?: string, RoomId?: string }) => {
                const rId = data.roomId || data.RoomId;
                if (activeRoom && rId && activeRoom.roomId.toLowerCase() === rId.toLowerCase()) {
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
    }, [connection, activeRoom]);

    // Загрузка истории сообщений при выборе диалога
    useEffect(() => {
        if (activeRoom) {
            fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/chat/history?adId=${activeRoom.adId}`, {
                credentials: 'include'
            })
                .then(res => res.json())
                .then(data => {
                    setMessages(data);
                    // Прокрутка вниз
                    setTimeout(() => {
                        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);

                    // Помечаем как прочитанные
                    if (activeRoom.unreadCount > 0) {
                        fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/chat/read`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ roomId: activeRoom.roomId })
                        }).then(() => {
                            // Обновляем счетчики
                            setUnreadCount(prev => Math.max(0, prev - activeRoom.unreadCount));
                            setInboxItems(prev => prev.map(item => 
                                item.roomId === activeRoom.roomId ? { ...item, unreadCount: 0 } : item
                            ));
                        });
                    }
                })
                .catch(console.error);
        }
    }, [activeRoom]);

    // Прокрутка при новых сообщениях
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim() || !activeRoom) return;

        const tempMessage: Message = {
            id: Date.now().toString(), 
            roomId: activeRoom.roomId,
            senderId: 'me', 
            text: inputValue.trim(), 
            createdAt: new Date().toISOString(),
            isRead: false
        };
        
        setMessages(prev => [...prev, tempMessage]);
        setInputValue('');

        try {
            await fetch(`${process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL}/api/chat/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ adId: activeRoom.adId, text: tempMessage.text })
            });
            loadInbox(); // Обновляем список диалогов (последнее сообщение)
        } catch (e) {
            console.error('Ошибка отправки', e);
        }
    };

    if (!user) {
        return <div className={styles.container}>Пожалуйста, авторизуйтесь для просмотра сообщений.</div>;
    }

    return (
        <div className={styles.container}>
            {/* Список диалогов */}
            <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>Сообщения</div>
                <div className={styles.dialogList}>
                    {inboxItems.length === 0 ? (
                        <div style={{ padding: 20, color: '#888', textAlign: 'center' }}>
                            У вас пока нет сообщений
                        </div>
                    ) : (
                        inboxItems.map(item => (
                            <div 
                                key={item.roomId} 
                                className={`${styles.dialogItem} ${activeRoom?.roomId === item.roomId ? styles.active : ''}`}
                                onClick={() => setActiveRoom(item)}
                            >
                                <img 
                                    src={item.adImageUrl || '/placeholder.png'} 
                                    alt="Ad" 
                                    className={styles.adImage} 
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = '/placeholder.png';
                                    }}
                                />
                                <div className={styles.dialogInfo}>
                                    <div className={styles.dialogTop}>
                                        <span className={styles.companionName}>{item.companionName}</span>
                                        <span className={styles.date}>
                                            {new Date(item.lastMessageDate).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className={styles.adTitle}>{item.adTitle}</div>
                                    <div className={styles.lastMessage}>
                                        {item.lastMessageText}
                                        {item.unreadCount > 0 && (
                                            <span className={styles.unreadBadge}>{item.unreadCount}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Активный чат */}
            <div className={styles.chatArea}>
                {!activeRoom ? (
                    <div className={styles.emptyChat}>
                        Выберите диалог слева, чтобы начать общение
                    </div>
                ) : (
                    <>
                        <div className={styles.chatHeader}>
                            <img 
                                src={activeRoom.adImageUrl || '/placeholder.png'} 
                                alt="Ad" 
                                className={styles.chatHeaderImage}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder.png';
                                }}
                            />
                            <div className={styles.chatHeaderInfo}>
                                <div className={styles.chatHeaderTitle}>{activeRoom.adTitle}</div>
                                <div className={styles.chatHeaderCompanion}>{activeRoom.companionName}</div>
                            </div>
                        </div>

                        <div className={styles.messagesArea}>
                            {messages.map(msg => {
                                const isMe = msg.senderId === 'me';
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
                            <div ref={messagesEndRef} />
                        </div>

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
                    </>
                )}
            </div>
        </div>
    );
}
