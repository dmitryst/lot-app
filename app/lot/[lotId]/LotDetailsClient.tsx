'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import LotMap from '../../../components/LotMap';
import { Lot } from '../../../types';
import Breadcrumbs from '../../../components/Breadcrumbs';
import styles from './lot.module.css';

// Компонент для отображения одного этапа покупки
const PurchaseStep = ({ title, description }: { title: string; description: string }) => (
  <div className={styles.step}>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

// Компонент получает данные через пропсы
export default function LotDetailsClient({ lot }: { lot: Lot | null }) {
  const router = useRouter();

  const handleBackToList = () => {
    const savedQuery = sessionStorage.getItem('lotListQuery');
    router.push(`/${savedQuery || ''}`);
  };

  // Если данные не пришли с сервера
  if (!lot) {
    return (
      <div className={styles.container}>
        <button onClick={handleBackToList} className={styles.backLink}>
          &larr; Вернуться к списку лотов
        </button>
        <h1>Лот не найден</h1>
        <p>К сожалению, запрашиваемый лот не существует или был удален.</p>
      </div>
    );
  }

  // Формируем "хлебные крошки" для навигации и SEO
  const crumbs = [
    { label: 'Главная', href: '/' },
    { label: lot.description.substring(0, 50) + '...', href: `/lot/${lot.id}` }
  ];

  return (
    <main className={styles.container}>
      <Breadcrumbs crumbs={crumbs} />

      <button onClick={handleBackToList} className={styles.backLink}>
        &larr; Вернуться к списку лотов
      </button>

      <h1 className={styles.mainLotTitle}>{lot.title ? lot.title : lot.description}</h1>

      {/* === НОВЫЙ МАКЕТ СЕТКИ === */}
      <div className={styles.lotDetailGrid}>

        {/* --- ЭЛЕМЕНТЫ ПЕРВОЙ СТРОКИ --- */}

        {/* Левая колонка: Фотография */}
        <div className={styles.imageSection}>
          <Image
            src={lot.imageUrl || '/placeholder.png'}
            alt={`Фото лота: ${lot.title ? lot.title : lot.description}`}
            width={500}
            height={400}
            className={styles.mainImage}
            priority
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
          {/* <button className={styles.ctaButton} style={{ marginTop: '2rem' }}>Оставить заявку</button> */}
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

      {/* Показываем карту, только если есть координаты */}
      {lot.coordinates && lot.coordinates.length === 2 && (
        <div className={styles.mapSection}>
          <h2 className={styles.sectionTitle}>Расположение на карте</h2>
          <LotMap coordinates={lot.coordinates as [number, number]} />
        </div>
      )}

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
