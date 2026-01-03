// hooks/usePromoVisibility.ts
'use client';

import { useState, useEffect } from 'react';

// Имя события для синхронизации вкладок/компонентов
const EVENT_NAME = 'promo_visibility_change';

// Хук, управляющий чтением/записью в localStorage и подписывающийся на изменения
export function usePromoVisibility(promoId: string) {
  const [isVisible, setIsVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Чтение при загрузке
  useEffect(() => {
    setIsMounted(true);
    const isHidden = localStorage.getItem(`promo_hidden_${promoId}`);
    setIsVisible(!isHidden);
  }, [promoId]);

  // Подписка на изменения (чтобы хедер узнал, что баннер закрыли)
  useEffect(() => {
    const handleStorage = () => {
      const isHidden = localStorage.getItem(`promo_hidden_${promoId}`);
      setIsVisible(!isHidden);
    };

    window.addEventListener(EVENT_NAME, handleStorage);
    // Также слушаем storage event для синхронизации между вкладками
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(EVENT_NAME, handleStorage);
      window.removeEventListener('storage', handleStorage);
    };
  }, [promoId]);

  const hidePromo = () => {
    localStorage.setItem(`promo_hidden_${promoId}`, 'true');
    setIsVisible(false);
    window.dispatchEvent(new Event(EVENT_NAME));
  };

  const showPromo = () => {
    localStorage.removeItem(`promo_hidden_${promoId}`);
    setIsVisible(true);
    window.dispatchEvent(new Event(EVENT_NAME));
  };

  return { isVisible, isMounted, hidePromo, showPromo };
}
