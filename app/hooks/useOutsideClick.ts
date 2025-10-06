import { useEffect, RefObject } from 'react';

type Event = MouseEvent | TouchEvent;

// Хук для отслеживания кликов вне указанного элемента
export function useOutsideClick(
  ref: RefObject<HTMLElement | null>, // <--- ИСПРАВЛЕНИЕ 1: Допускаем null
  callback: () => void // <--- ИСПРАВЛЕНИЕ 2: Упрощаем callback
) {
  useEffect(() => {
    const listener = (event: Event) => {
      // Если ref не назначен или клик был внутри элемента, ничего не делаем
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      // Иначе вызываем callback
      callback();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
    // Перезапускаем эффект, только если меняется ref или callback
  }, [ref, callback]);
}