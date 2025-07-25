// app/buy/[lotId]/page.tsx

'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './buy.module.css'; // Стили для этой страницы
import LotCard from '../../../components/LotCard';
import { Lot } from '../../../types';

export default function BuyLotPage() {
  const params = useParams();
  const lotId = params.lotId as string;

  const [lot, setLot] = useState<Lot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (lotId) {
      fetch(`/api/lots/${lotId}`)
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Не удалось загрузить данные лота');
          }
          return res.json();
        })
        .then((data) => {
          setLot(data);
        })
        .catch((err) => {
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [lotId]);

  if (loading) return <div className={styles.container}><p>Загрузка...</p></div>;
  if (error) return <div className={styles.container}><p>Ошибка: {error}</p></div>;
  if (!lot) return <div className={styles.container}><p>Лот не найден.</p></div>;

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backLink}>← Вернуться к списку лотов</Link>
      
      <LotCard key={lot.Id} lot={lot} />

      {/* Информация о покупке */}
      <div className={styles.purchaseInfo}>
        <h2>Как купить лот через нашего агента</h2>
        <div className={styles.step}>
          <h3>Шаг 1. Заключение агентского договора</h3>
          <p>Мы заключаем с вами договор, в котором прописаны все условия нашего сотрудничества и наша ответственность.</p>
        </div>
        <div className={styles.step}>
          <h3>Шаг 2. Оплата задатка и услуг</h3>
          <p>Вы переводите задаток на специальный счет торговой площадки и оплачиваете нашу комиссию по договору.</p>
        </div>
        <div className={styles.step}>
          <h3>Шаг 3. Участие в торгах</h3>
          <p>Наш специалист подает заявку, участвует в торгах от вашего имени и борется за победу по согласованной с вами стратегии.</p>
        </div>
        <div className={styles.step}>
          <h3>Шаг 4. Подписание протокола и оплата</h3>
          <p>В случае победы мы подписываем протокол торгов. Вы оплачиваете оставшуюся стоимость лота напрямую продавцу.</p>
        </div>

        <button className={styles.ctaButton}>Оставить заявку на участие</button>
      </div>
    </div>
  );
}
