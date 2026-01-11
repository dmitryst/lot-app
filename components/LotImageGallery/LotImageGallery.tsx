'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './LotImageGallery.module.css';

interface LotImageGalleryProps {
  images: string[];
  title?: string;
  badges?: string[];
}

export default function LotImageGallery({ images, title, badges = [] }: LotImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Защита от пустых данных
  if (!images || images.length === 0) {
    return (
      <div className={styles.emptyGallery}>
        <span>Нет фото</span>
      </div>
    );
  }

  const currentImage = images[selectedIndex];

  // Автопрокрутка миниатюр к активному элементу
  useEffect(() => {
    if (scrollRef.current) {
      const activeThumb = scrollRef.current.children[selectedIndex] as HTMLElement;
      if (activeThumb) {
        // Простая логика: центрируем активную миниатюру
        const container = scrollRef.current;
        const scrollLeft = activeThumb.offsetLeft - (container.offsetWidth / 2) + (activeThumb.offsetWidth / 2);
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  return (
    <div className={styles.galleryContainer}>
      
      {/* === ГЛАВНОЕ ФОТО === */}
      <div className={styles.mainImageWrapper}>
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

      {/* === ЛЕНТА МИНИАТЮР === */}
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
    </div>
  );
}
