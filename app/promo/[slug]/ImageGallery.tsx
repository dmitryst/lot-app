// app/promo/[slug]/ImageGallery.tsx
'use client';

import { useState } from 'react';
import styles from './ImageGallery.module.css'; //

interface ImageGalleryProps {
  images: string[];
  title: string;
  badges?: string[];
}

export default function ImageGallery({ images, title, badges = [] }: ImageGalleryProps) {
  const [currentImage, setCurrentImage] = useState(images[0]);

  return (
    <div className={styles.galleryContainer}>
      {/* Главное изображение */}
      <div className={styles.mainImageWrapper}>
        <img
          src={currentImage}
          alt={title}
          className={styles.mainImageImg}
        />

        {/* --- ДИНАМИЧЕСКИЙ ВЫВОД БЕЙДЖЕЙ --- */}
        {badges.length > 0 && (
          <div className={styles.imageOverlay}>
            {badges.map((badge, idx) => (
              <span key={idx} className={styles.badge}>
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Карусель миниатюр */}
      {images.length > 1 && (
        <div className={styles.thumbnailsScroll}>
          <div className={styles.thumbnailsTrack}>
            {images.map((img, idx) => (
              <button
                key={idx}
                className={`${styles.thumbnailBtn} ${currentImage === img ? styles.activeThumb : ''}`}
                onClick={() => setCurrentImage(img)}
                aria-label={`Показать фото ${idx + 1}`}
              >
                <img src={img} alt={`Миниатюра ${idx + 1}`} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
