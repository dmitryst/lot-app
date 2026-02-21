'use client';

import Link from 'next/link';
import { Lot } from '@/types';
import LotCard from '@/components/LotCard';
import { FavoriteButton } from '@/components/FavoriteButton';
import styles from './styles.module.css';
import { generateSlug } from '@/utils/slugify';

interface LotItemProps {
  lot: Lot;
  // Класс от сетки (lotsGrid) снаружи, чтобы не мешать layout страницы
  className?: string;
}

export const LotItem = ({ lot, className }: LotItemProps) => {
  const handleMouseDown = () => {
    // Сохраняем позицию скролла и query — логика общая для главной и избранного
    if (typeof window === 'undefined') return;

    sessionStorage.setItem('scrollPosition', String(window.scrollY));
    sessionStorage.setItem('lotListQuery', window.location.search);
  };

  // Если есть PublicId: берём slug из БД или генерируем на фронте для старых лотов
  const slug = lot.slug ?? generateSlug(lot.title || lot.description);
  const lotUrl = lot.publicId 
    ? `/lot/${slug}-${lot.publicId}` 
    : `/lot/${lot.id}`;

  return (
    <div
      className={`${styles.container} ${className ?? ''}`}
      onMouseDown={handleMouseDown}
    >
      <FavoriteButton lotId={lot.id} />

      <Link
        href={lotUrl}
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        <LotCard lot={lot} imageUrl={lot.imageUrl} />
      </Link>
    </div>
  );
};
