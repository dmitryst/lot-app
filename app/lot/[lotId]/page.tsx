// app/lot/[lotId]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation'; // <-- Используем хук для получения lotId

import { Lot } from '../../../types'; // <-- Убедитесь, что путь к типам правильный
import styles from './lot.module.css'; // <-- Используем стили для этой страницы

// Компонент для отображения одного этапа покупки
const PurchaseStep = ({ title, description }: { title: string; description: string }) => (
  <div className={styles.step}>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

export default function LotPage() {
  const params = useParams();
  const lotId = params.lotId;

  const [lot, setLot] = useState<Lot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lotId) return;

    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_CSHARP_BACKEND_URL;
    if (!apiUrl) {
      setError("URL бэкенда не настроен.");
      setLoading(false);
      return;
    }

    fetch(`${apiUrl}/api/lots/${lotId}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) throw new Error('Лот не найден');
          throw new Error('Не удалось загрузить данные лота');
        }
        return res.json();
      })
      .then((data) => {
        setLot(data);
      })
      .catch(error => {
        setError(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [lotId]);

  if (loading) return <div className={styles.centeredMessage}>Загрузка...</div>;
  if (error) return <div className={styles.centeredMessage}>Ошибка: {error}</div>;
  if (!lot) return <div className={styles.centeredMessage}>Лот не найден.</div>;

  return (
    <main className={styles.container}>
      <Link href="/" className={styles.backLink}>← Вернуться к списку лотов</Link>

      {/* === НОВЫЙ МАКЕТ СЕТКИ === */}
      <div className={styles.lotDetailGrid}>

        {/* --- ЭЛЕМЕНТЫ ПЕРВОЙ СТРОКИ --- */}

        {/* Левая колонка: Фотография */}
        <div className={styles.imageSection}>
          <Image
            src={lot.imageUrl || '/placeholder.png'}
            alt={`Изображение для лота: ${lot.description}`}
            width={500}
            height={400}
            className={styles.mainImage}
          />
        </div>

        {/* Правая колонка: Информация о лоте */}
        <div className={styles.infoSection}>
          <p className={styles.lotInfo}><b>Номер лота:</b> {lot.id}</p>
          <p className={styles.lotInfo}><b>Тип торгов:</b> {lot.bidding?.type}</p>
          <div className={styles.priceInfo}>
            {/* Блок для начальной цены остался без изменений */}
            <div>
              <span className={styles.priceLabel}>Начальная цена:</span>
              <span className={styles.priceValue}>{lot.startPrice ? `${lot.startPrice.toLocaleString()} ₽` : 'Не указана'}</span>
            </div>

            {/* === НОВЫЙ БЛОК: УСЛОВНЫЙ РЕНДЕРИНГ ЗАДАТКА === */}
            {lot.deposit && (
              <div className={styles.depositInfo}>
                <span className={styles.depositLabel}>Величина задатка:</span>
                <span className={styles.depositValue}>
                  {lot.deposit.toLocaleString()} ₽
                </span>
              </div>
            )}
          </div>

          {/* Можно добавить кнопку "купить" прямо сюда */}
          <button className={styles.ctaButton} style={{ marginTop: '2rem' }}>Оставить заявку</button>
        </div>

        {/* --- ЭЛЕМЕНТЫ ВТОРОЙ СТРОКИ --- */}

        {/* Описание лота (занимает всю ширину) */}
        <div className={styles.descriptionSection}>
          <h2 className={styles.sectionTitle}>Описание лота</h2>
          <div className={styles.descriptionText}>
            {/* Здесь должен быть полный текст описания лота */}
            {lot.description}
          </div>
        </div>

      </div>

      {/* Информация о покупке (остается без изменений) */}
      <div className={styles.purchaseInfo}>
        <h2>Как купить лот через агента</h2>
        <PurchaseStep
          title="1. Договор"
          description="Мы заключаем с вами договор, в котором прописаны все условия нашего сотрудничества и наша ответственность."
        />
        <PurchaseStep
          title="2. Задаток и комиссия"
          description="Вы переводите задаток на специальный счет торговой площадки и оплачиваете нашу комиссию по договору."
        />
        <PurchaseStep
          title="3. Участие в торгах"
          description="Наш специалист подает заявку, участвует в торгах от вашего имени и борется за победу по согласованной с вами стратегии."
        />
        <PurchaseStep
          title="4. Завершение сделки"
          description="В случае победы мы подписываем протокол торгов. Вы оплачиваете оставшуюся стоимость лота напрямую продавцу."
        />
        <button className={styles.ctaButton}>Оставить заявку на участие</button>
      </div>
    </main>
  );
}
