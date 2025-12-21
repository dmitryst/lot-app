'use client';

import Link from 'next/link';
import { Lot } from '@/types';
import LotCard from '@/components/LotCard';
import { FavoriteButton } from '@/components/FavoriteButton';
import styles from './styles.module.css';

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

  return (
    <div
      className={`${styles.container} ${className ?? ''}`}
      onMouseDown={handleMouseDown}
    >
      <FavoriteButton lotId={lot.id} />

      <Link
        href={`/lot/${lot.id}`}
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        <LotCard lot={lot} imageUrl={lot.imageUrl} />
      </Link>
    </div>
  );
};
