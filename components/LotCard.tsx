import Link from 'next/link';
import styles from '../app/page.module.css';
import { Lot } from '../types';
import { formatMoney } from '../utils/format';
import Accordion from './Accordion';

// --- ИКОНКИ ---
const IconArrowUp = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5" /><path d="m5 12 7-7 7 7" />
    </svg>
);
const IconArrowDown = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14" /><path d="m19 12-7 7-7-7" />
    </svg>
);

// --- ПРОПСЫ КОМПОНЕНТА ---
interface LotCardProps {
    lot: Lot;
}

export default function LotCard({ lot }: LotCardProps) {
    return (
        <div className={styles.card}>
            <div className={styles.cardContent}>
                <a href={lot.Url} target="_blank" rel="noopener noreferrer">
                    <h2>{lot.Description}</h2>
                </a>

                <p className={styles.priceDetail}>
                    <b>Начальная цена:</b>
                    <span className={styles.priceValue}>{formatMoney(lot.StartPrice)}</span>
                    {lot.BiddingType === 'Публичное предложение' ? (
                        <span className={styles.iconDown}><IconArrowDown /></span>
                    ) : (
                        <span className={styles.iconUp}><IconArrowUp /></span>
                    )}
                </p>

                {lot.Step && (
                    <p className={styles.priceDetail}>
                        <b>Шаг цены:</b>
                        <span className={styles.priceValue}>{formatMoney(lot.Step)}</span>
                    </p>
                )}

                {lot.Deposit && (
                    <p className={styles.priceDetail}>
                        <b>Задаток:</b>
                        <span className={styles.priceValue}>{formatMoney(lot.Deposit)}</span>
                    </p>
                )}

                {lot.ViewingProcedure && (
                    <Accordion title="Порядок ознакомления">
                        {lot.ViewingProcedure}
                    </Accordion>
                )}

                {lot.categories && lot.categories.length > 0 && (
                    <div className={styles.categoriesContainer}>
                        {lot.categories.map((cat) => (
                            <span key={cat.Id} className={styles.categoryTag}>
                                {cat.Name}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.cardFooter}>
                <Link href={`/buy/${lot.Id}`} className={styles.buyButton}>
                    Купить через агента
                </Link>
            </div>
        </div>
    );
}
