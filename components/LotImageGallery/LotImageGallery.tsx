'use client';

import React, { useState, useRef, useEffect, useCallback, TouchEvent } from 'react';
import styles from './LotImageGallery.module.css';

interface LotImageGalleryProps {
  images: string[];
  title?: string;
  badges?: string[];
}

// Иконки SVG для модалки
const CloseIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);
const ChevronLeftIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export default function LotImageGallery({ images, title, badges = [] }: LotImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null); // Реф для ленты на странице
  const modalScrollRef = useRef<HTMLDivElement>(null); // Реф для ленты в модалке

  // Состояния для обработки свайпов на мобильных
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  // Автопрокрутка миниатюр к активному элементу (для обеих лент)
  useEffect(() => {
    const scrollToActive = (ref: React.RefObject<HTMLDivElement | null>) => {
      if (ref.current) {
        const activeThumb = ref.current.children[selectedIndex] as HTMLElement;
        if (activeThumb) {
          const container = ref.current;
          const scrollLeft = activeThumb.offsetLeft - (container.offsetWidth / 2) + (activeThumb.offsetWidth / 2);
          container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
      }
    };
    
    scrollToActive(scrollRef);
    if (isModalOpen) {
      scrollToActive(modalScrollRef);
    }
  }, [selectedIndex, isModalOpen]);

  // Навигация
  const goToNext = useCallback(() => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images?.length]);

  const goToPrev = useCallback(() => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images?.length]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Управление с клавиатуры и блокировка скролла сайта
  useEffect(() => {
    if (!isModalOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isModalOpen, goToNext, goToPrev]);

  // Обработка свайпов
  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    
    if (distance > minSwipeDistance) goToNext(); // Свайп влево
    if (distance < -minSwipeDistance) goToPrev(); // Свайп вправо
  };

  // Защита от пустых данных
  if (!images || images.length === 0) {
    return (
      <div className={styles.emptyGallery}>
        <span>Нет фото</span>
      </div>
    );
  }

  const currentImage = images[selectedIndex];

  return (
    <div className={styles.galleryContainer}>
      
      {/* === ГЛАВНОЕ ФОТО НА СТРАНИЦЕ === */}
      <div className={styles.mainImageWrapper} onClick={openModal}>
        <img 
          src={currentImage} 
          alt={title || `Фото ${selectedIndex + 1}`} 
          className={styles.mainImage} 
        />
        
        {/* Бейджи поверх фото */}
        {badges.length > 0 && (
          <div className={styles.badgesOverlay}>
            {badges.map((badge, idx) => (
              <span key={idx} className={styles.badge}>
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* === ЛЕНТА МИНИАТЮР НА СТРАНИЦЕ === */}
      {images.length > 1 && (
        <div className={styles.thumbnailsScrollWrapper}>
          <div className={styles.thumbnailsTrack} ref={scrollRef}>
            {images.map((img, idx) => (
              <button
                key={idx}
                className={`${styles.thumbnailBtn} ${idx === selectedIndex ? styles.activeThumb : ''}`}
                onClick={() => setSelectedIndex(idx)}
                aria-label={`Переключить на фото ${idx + 1}`}
              >
                <img src={img} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* === ПОЛНОЭКРАННОЕ МОДАЛЬНОЕ ОКНО === */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          
          <div className={styles.modalHeader}>
            <button className={styles.closeButton} onClick={closeModal} aria-label="Закрыть">
              <CloseIcon />
            </button>
          </div>

          <div 
            className={styles.modalMainArea}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onClick={(e) => e.stopPropagation()} // Клик по зоне фото не должен закрывать модалку
          >
            {/* Кнопка Влево (показываем на десктопе) */}
            {images.length > 1 && (
              <button className={`${styles.navButton} ${styles.prevButton}`} onClick={goToPrev}>
                <ChevronLeftIcon />
              </button>
            )}

            <img
              src={currentImage}
              alt={`Фото ${selectedIndex + 1} в полном размере`}
              className={styles.modalImage}
            />

            {/* Кнопка Вправо (показываем на десктопе) */}
            {images.length > 1 && (
              <button className={`${styles.navButton} ${styles.nextButton}`} onClick={goToNext}>
                <ChevronRightIcon />
              </button>
            )}
          </div>

          {/* === ЛЕНТА МИНИАТЮР В МОДАЛЬНОМ ОКНЕ === */}
          {images.length > 1 && (
            <div 
              className={styles.modalThumbnailsTrack} 
              ref={modalScrollRef} 
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, idx) => (
                <button
                  key={idx}
                  className={`${styles.modalThumbBtn} ${idx === selectedIndex ? styles.activeModalThumb : ''}`}
                  onClick={() => setSelectedIndex(idx)}
                  aria-label={`Смотреть фото ${idx + 1}`}
                >
                  <img src={img} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  );
}