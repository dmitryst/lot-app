// app/promo/[slug]/ImageGallery.tsx
'use client';

import { useState } from 'react';
import styles from './ImageGallery.module.css'; //

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
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
        <div className={styles.imageOverlay}>
          <span className={styles.badge}>Доходность x2</span>
          <span className={styles.badge}>Банкротство</span>
        </div>
      </div>

      {/* Карусель миниатюр */}
      <div className={styles.thumbnailsScroll}>
        <div className={styles.thumbnailsTrack}>
          {images.map((img, idx) => (
            <button
              key={idx}
              className={`${styles.thumbnailBtn} ${currentImage === img ? styles.activeThumb : ''}`}
              onClick={() => setCurrentImage(img)}
              aria-label={`Показать фото ${idx + 1}`}
            >
              <img src={img} alt={`Фото ${idx + 1}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
