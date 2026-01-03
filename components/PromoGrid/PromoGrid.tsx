// components/PromoGrid/PromoGrid.tsx
'use client';

import Link from 'next/link';
import PromoBanner from '@/components/PromoBanner/PromoBanner';
import styles from './PromoGrid.module.css';
import { PROMO_LOTS } from '@/app/promo/data/promo-lots';
import { hot_lot_id } from '../../app/data/constants';

type PromoGridProps = {
  hotSlug?: string;        // если нужно явно указать “лот месяца”
  maxArchived?: number;    // сколько показывать завершённых
  title?: string;
};

export default function PromoGrid({
  hotSlug,
  maxArchived = 6,
  title = 'Инвест-лот месяца и кейсы',
}: PromoGridProps) {
  const entries = Object.entries(PROMO_LOTS).map(([slug, lot]) => ({
    slug,
    lot,
  }));

  const featured =
    (hotSlug && PROMO_LOTS[hotSlug] ? { slug: hotSlug, lot: PROMO_LOTS[hotSlug] } : null) ??
    entries.find(({ lot }) => (lot as any).status === 'hot') ??
    (entries.length > 0 ? entries[0] : null);

  const archived = entries
    .filter(({ slug }) => slug !== featured?.slug)
    .filter(({ lot }) => (lot as any).status === 'archive')
    .slice(0, maxArchived);

  // fallback: показываем “остальные”
  const fallbackArchived =
    archived.length > 0
      ? archived
      : entries.filter(({ slug }) => slug !== featured?.slug).slice(0, maxArchived);

  return (
    <section className={styles.section}>
      {/* <div className={styles.headerRow}>
        <h2 className={styles.title}>{title}</h2>
        <Link className={styles.allLink} href="/promo">
          Все кейсы →
        </Link>
      </div> */}

      {featured && (
        <div className={styles.featured}>
          <PromoBanner
            id = {hot_lot_id}
            badge="🔥 Лот месяца"
            title={featured.lot.title}
            subtitle={featured.lot.subtitle ?? featured.lot.description}
            href={`/promo/${featured.slug}`}
            buttonText="Подробнее"
          />
        </div>
      )}

      {fallbackArchived.length > 0 && (
        <>
          <h3 className={styles.subTitle}>Завершённые кейсы</h3>

          <div className={styles.grid}>
            {fallbackArchived.map(({ slug, lot }) => (
              <Link key={slug} href={`/promo/${slug}`} className={styles.card}>
                <div className={styles.cardImageWrap}>
                  <img className={styles.cardImage} src={lot.img} alt={lot.title} />
                  <div className={styles.badges}>
                    {(lot.badges ?? []).slice(0, 2).map((b: string, i: number) => (
                      <span key={i} className={styles.badge}>{b}</span>
                    ))}
                    {(lot as any).status === 'archive' && (
                      <span className={styles.archiveBadge}>Завершён</span>
                    )}
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardTitle}>{lot.title}</div>
                  <div className={styles.cardText}>
                    {lot.metaDescription ?? lot.subtitle ?? lot.description}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
