// app/lot/[id]/LotDetailsClient.tsx

'use client';

import { useRouter } from 'next/navigation';
import LotMap from '../../../components/LotMap';
import { Lot } from '../../../types';
import Breadcrumbs from '../../../components/Breadcrumbs';
import styles from './lot.module.css';
import LotImageGallery from '../../../components/LotImageGallery/LotImageGallery';
import { formatMoney } from '../../../utils/format';
import { generateSlug } from '../../../utils/slugify';

// Компонент для отображения одного этапа покупки
const PurchaseStep = ({ title, description }: { title: string; description: string }) => (
  <div className={styles.step}>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
);

// Функция форматирования даты
const formatDate = (dateString: string) => {
  if (!dateString || dateString === '0001-01-01T00:00:00') return '-';
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Функция определения активного этапа (примерная логика)
const isCurrentStage = (startDate: string, endDate: string) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  return now >= start && now < end;
};

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
  const slug = generateSlug(lot.title || lot.description);
  const lotUrl = lot.publicId 
    ? `/lot/${slug}-${lot.publicId}`
    : `/lot/${lot.id}`;
  const crumbs = [
    { label: 'Главная', href: '/' },
    { label: lot.description.substring(0, 50) + '...', href: lotUrl }
  ];

  const getRankColorClass = (rank: number | null | undefined) => {
    if (!rank) return styles.rankLow; // Если null или 0 — серый цвет

    if (rank >= 8) return styles.rankHigh;
    if (rank >= 5) return styles.rankMedium;
    return styles.rankLow;
  };

  // TODO: Подготовка бейджей
  const badges: any[] = [];

  // Подготовка картинок для галереи
  // Если массив images пуст, пытаемся взять imageUrl или ставим заглушку
  const galleryImages = (lot.images && lot.images.length > 0)
    ? lot.images
    : (lot.imageUrl ? [lot.imageUrl] : ['/placeholder.png']);

  // --- ИКОНКИ (Копируем из LotCard для единообразия) ---
  const IconArrowUp = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5" /><path d="m5 12 7-7 7 7" />
    </svg>
  );

  const IconArrowDown = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" /><path d="m19 12-7 7-7-7" />
    </svg>
  );

  // Определяем направление цены
  const getPriceDirectionIcon = () => {
    const type = lot.bidding?.type?.toLowerCase() || '';

    if (type.includes('аукцион')) {
      return (
        <span className={styles.iconUp} title="Цена повышается">
          <IconArrowUp />
        </span>
      );
    }

    if (type.includes('предложение')) {
      return (
        <span className={styles.iconDown} title="Цена понижается">
          <IconArrowDown />
        </span>
      );
    }

    return null;
  };

  // Проверяем, есть ли хоть одна запись с задатком > 0
  const showDepositColumn = lot.priceSchedules && lot.priceSchedules.some(s => s.deposit && s.deposit > 0);


  // Считаем взвешенную цену: 70% веса на Min (пессимизм), 30% на Max
  let displayPrice: number | null = null;
  if (lot.marketValueMin && lot.marketValueMax) {
    displayPrice = (lot.marketValueMin * 0.7) + (lot.marketValueMax * 0.3);
  } else if (lot.marketValueMin) {
    displayPrice = lot.marketValueMin;
  } else if (lot.marketValue) {
    displayPrice = lot.marketValue;
  }

  // Считаем апсайд от displayPrice
  let upsidePercent: number | null = null;
  if (displayPrice && lot.startPrice && lot.startPrice > 0) {
    upsidePercent = ((displayPrice - lot.startPrice) / lot.startPrice) * 100;
  }

  const getUpsideClass = (percent: number) => {
    if (percent > 20) return styles.upsidePositive;
    if (percent < -5) return styles.upsideNegative;
    return styles.upsideNeutral;
  }

  // Цвет уверенности
  const getConfidenceClass = (conf?: string | null) => {
    switch (conf?.toLowerCase()) {
      case 'high': return styles.confidenceHigh;
      case 'medium': return styles.confidenceMedium;
      case 'low': return styles.confidenceLow;
      default: return styles.confidenceMedium; // Fallback
    }
  };

  const getConfidenceLabel = (conf?: string | null) => {
    switch (conf?.toLowerCase()) {
      case 'high': return 'Высокая точность оценки';
      case 'medium': return 'Средняя точность';
      case 'low': return 'Низкая точность (мало данных)';
      default: return 'Точность оценки';
    }
  };


  return (

    <main className={styles.container}>
      <Breadcrumbs crumbs={crumbs} />

      <button onClick={handleBackToList} className={styles.backLink}>
        &larr; Вернуться к списку лотов
      </button>

      <h1 className={styles.mainLotTitle}>{lot.title ? lot.title : lot.description}</h1>

      <div className={styles.lotDetailGrid}>

        {/* --- ЭЛЕМЕНТЫ ПЕРВОЙ СТРОКИ --- */}

        {/* --- ЛЕВАЯ КОЛОНКА: ФОТОГАЛЕРЕЯ --- */}
        <div className={styles.imageSection}>
          <LotImageGallery
            images={galleryImages}
            title={lot.title || ''}
            badges={badges}
          />
        </div>

        {/* Правая колонка: Информация о лоте */}
        <div className={styles.infoSection}>
          <p className={styles.lotInfo}><b>Номер лота:</b> {lot.publicId}</p>
          <p className={styles.lotInfo}><b>Тип торгов:</b> {lot.bidding?.type}</p>
          <p className={styles.lotInfo}><b>Прием заявок:</b> {lot.bidding?.bidAcceptancePeriod}</p>
          <p className={styles.lotInfo}><b>Период торгов:</b> {lot.bidding?.tradePeriod}</p>

          <div className={styles.priceInfo}>
            {/* Блок для начальной цены */}
            <div>
              <span className={styles.priceLabel}>Начальная цена:</span>
              <span className={styles.priceValue}>
                {lot.startPrice ? `${lot.startPrice.toLocaleString()} ₽` : 'Не указана'}

                {/* Вставляем иконку */}
                {getPriceDirectionIcon()}
              </span>
            </div>

            {/* Задаток */}
            {lot.deposit && (
              <div className={styles.depositInfo}>
                <span className={styles.depositLabel}>Величина задатка:</span>
                <span className={styles.depositValue}>
                  {lot.deposit.toLocaleString()} ₽
                </span>
              </div>
            )}

            {/* Шаг цены (аукциона) */}
            {lot.step && (
              <div className={styles.depositInfo}>
                <span className={styles.depositLabel}>Шаг цены:</span>
                <span className={styles.depositValue}>
                  {lot.step.toLocaleString()} ₽
                </span>
              </div>
            )}
          </div>

          <p className={styles.lotInfo}><b>Площадка:</b> {lot.bidding?.platform}</p>

          {/* Можно добавить кнопку "купить" прямо сюда */}
          {/* <button className={styles.ctaButton} style={{ marginTop: '2rem' }}>Оставить заявку</button> */}
        </div>

        {/* --- ЭЛЕМЕНТЫ ВТОРОЙ СТРОКИ --- */}

        {/* Описание лота (занимает всю ширину) */}
        <div className={styles.descriptionSection}>
          <h2 className={styles.sectionTitle}>Описание лота</h2>
          <div className={styles.descriptionText}>
            {lot.description}
          </div>
        </div>

        {/* Отдельный блок для арбитражного управляющего и должника */}
        {(lot.bidding?.arbitrationManager || lot.bidding?.debtor) && (
          <div className={styles.descriptionSection}>
            <h2 className={styles.sectionTitle}>Участники процедуры банкротства</h2>
            
            <div className={styles.participantsContainer}>
              {/* Информация о должнике */}
              {lot.bidding?.debtor && (
                <div className={styles.participantBlock}>
                  <h3 className={styles.participantTitle}>Должник</h3>
                  <div className={styles.participantInfo}>
                    <span className={styles.participantName}>{lot.bidding.debtor.name}</span>
                    {lot.bidding.debtor.inn && (
                      <span className={styles.participantDetail}>ИНН: {lot.bidding.debtor.inn}</span>
                    )}
                    {lot.bidding.debtor.snils && (
                      <span className={styles.participantDetail}>СНИЛС: {lot.bidding.debtor.snils}</span>
                    )}
                    {lot.bidding.debtor.ogrn && (
                      <span className={styles.participantDetail}>ОГРН: {lot.bidding.debtor.ogrn}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Информация об арбитражном управляющем */}
              {lot.bidding?.arbitrationManager && (
                <div className={styles.participantBlock}>
                  <h3 className={styles.participantTitle}>Арбитражный управляющий</h3>
                  <div className={styles.participantInfo}>
                    <span className={styles.participantName}>{lot.bidding.arbitrationManager.name}</span>
                    {lot.bidding.arbitrationManager.inn && (
                      <span className={styles.participantDetail}>ИНН: {lot.bidding.arbitrationManager.inn}</span>
                    )}
                    {lot.bidding.arbitrationManager.snils && (
                      <span className={styles.participantDetail}>СНИЛС: {lot.bidding.arbitrationManager.snils}</span>
                    )}
                    {lot.bidding.arbitrationManager.ogrn && (
                      <span className={styles.participantDetail}>ОГРН: {lot.bidding.arbitrationManager.ogrn}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Оценка AI */}
        {(displayPrice || lot.investmentSummary) && (
          <div className={styles.descriptionSection}>
            <h2 className={styles.sectionTitle}>Оценка инвестиционной привлекательности (AI)</h2>
            
            {displayPrice && (
                <>
                    <div className={styles.aiPriceRow}>
                        <span className={styles.priceLabel} style={{ fontSize: '1.1rem', marginBottom: 0 }}>Рыночная цена:</span>
                        
                        {/* Точка уверенности с расшифровкой */}
                        <div className={styles.confidenceBadge}>
                            <div
                                className={`${styles.confidenceDot} ${getConfidenceClass(lot.priceConfidence)}`}
                            />
                            <span className={styles.confidenceText}>
                                {getConfidenceLabel(lot.priceConfidence)}
                            </span>
                        </div>

                        {/* Цена */}
                        <span className={styles.aiPriceValue}>
                            ~{formatMoney(displayPrice)}
                        </span>

                        {/* Апсайд с подписью */}
                        {upsidePercent !== null && (
                            <div className={styles.upsideContainer}>
                                <span className={`${styles.upsideBadge} ${getUpsideClass(upsidePercent)}`}>
                                    {upsidePercent > 0 ? '+' : ''}{upsidePercent.toFixed(0)}%
                                </span>
                                <span className={styles.upsideLabel}>
                                    {upsidePercent > 0 ? 'потенциал прибыли' : 'от начальной цены'}
                                </span>
                            </div>
                        )}
                    </div>
                </>
            )}

            {lot.investmentSummary && (
                <div className={styles.investmentSummaryText}>
                    {lot.investmentSummary}
                </div>
            )}
          </div>
        )}

        {/* Документы лота (если есть) */}
        {lot.documents && lot.documents.length > 0 && (
          <div className={styles.descriptionSection}>
            <h2 className={styles.sectionTitle}>Документы</h2>
            <ul className={styles.documentList}>
              {lot.documents.map((doc) => (
                <li key={doc.id}>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.documentLink}
                  >
                    {doc.title}
                    {doc.extension && (
                      <span className={styles.documentExt}> {doc.extension}</span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Показываем карту, только если есть координаты */}
      {lot.coordinates && lot.coordinates.length === 2 && (
        <div className={styles.mapSection}>
          <h2 className={styles.sectionTitle}>Расположение на карте</h2>
          <LotMap coordinates={lot.coordinates as [number, number]} />
        </div>
      )}

      {/* Порядок ознакомления с имуществом */}
      {lot.bidding?.viewingProcedure && (
        <div className={styles.descriptionSection}>
          <h2 className={styles.sectionTitle}>Порядок ознакомления с имуществом</h2>
          <div className={styles.descriptionText}>
            {lot.bidding.viewingProcedure}
          </div>
        </div>
      )}

      {/* ГРАФИК СНИЖЕНИЯ ЦЕНЫ */}
      {lot.priceSchedules && lot.priceSchedules.length > 0 && (
        <div className={styles.priceScheduleSection}>
          <h2 className={styles.sectionTitle}>График снижения цены</h2>
          <div className={styles.tableWrapper}>
            <table className={styles.priceScheduleTable}>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>№</th>

                  {/* Десктоп: Дата начала */}
                  <th className={styles.desktopOnly}>Дата начала</th>
                  {/* Мобильный: Дата начала + Цена */}
                  <th className={styles.mobileOnly}>
                    <div className={styles.thGroup}>
                      <span>Дата начала</span>
                      <span className={styles.subHeader}>Цена, руб.</span>
                    </div>
                  </th>

                  {/* Десктоп: Дата окончания */}
                  <th className={styles.desktopOnly}>Дата окончания</th>

                  {/* Десктоп: Цена */}
                  <th className={styles.desktopOnly}>Цена, руб.</th>

                  {/* Мобильный: Дата окончания + Задаток */}
                  <th className={styles.mobileOnly}>
                    <div className={styles.thGroup}>
                      <span>Дата окончания</span>
                      {showDepositColumn && (<span className={styles.subHeader}>Задаток, руб.</span>)}
                    </div>
                  </th>

                  {/* Десктоп: Задаток */}
                  {showDepositColumn && (
                    <th className={styles.desktopOnly}>Задаток, руб.</th>
                  )}

                  {/* <th style={{ textAlign: 'center' }}>Ранг</th> */}
                </tr>
              </thead>
              <tbody>
                {lot.priceSchedules.map((schedule) => (
                  <tr key={schedule.number}>
                    <td style={{ textAlign: 'center', color: '#888' }}>{schedule.number}</td>

                    {/* Десктоп: Дата начала */}
                    <td className={styles.desktopOnly}>{formatDate(schedule.startDate)}</td>

                    {/* Мобильный: Дата начала + Цена */}
                    <td className={styles.mobileOnly}>
                      <div className={styles.cellGroup}>
                        <div className={styles.dateRow}>{formatDate(schedule.startDate)}</div>
                        <div className={styles.priceRow}>
                          {schedule.price?.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </td>

                    {/* Десктоп: Дата окончания */}
                    <td className={styles.desktopOnly}>{formatDate(schedule.endDate)}</td>

                    {/* Десктоп: Цена */}
                    <td className={styles.desktopOnly} style={{ fontWeight: 600 }}>
                      {schedule.price?.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Мобильный: Дата окончания + Задаток */}
                    <td className={styles.mobileOnly}>
                      <div className={styles.cellGroup}>
                        <div className={styles.dateRow}>{formatDate(schedule.endDate)}</div>
                        {showDepositColumn && (<div className={styles.depositRow}>
                          {schedule.deposit?.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
                        </div>)}
                      </div>
                    </td>

                    {/* Десктоп: Задаток */}
                    {showDepositColumn && (
                      <td className={styles.desktopOnly}>
                        {schedule.deposit?.toLocaleString('ru-RU', { minimumFractionDigits: 2 })}
                      </td>
                    )}

                    {/* Ранг (Общий) */}
                    {/* <td className={styles.rankCell}>
                      {schedule.estimatedRank ? (
                        <span
                          className={styles.rankBadge}
                          style={{
                            backgroundColor:
                              schedule.estimatedRank >= 8 ? '#48bb78' :
                                schedule.estimatedRank >= 5 ? '#ecc94b' :
                                  '#f56565'
                          }}
                        >
                          {schedule.estimatedRank}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Информация о покупке */}
      <div className={styles.purchaseInfo}>
        <h2>Как купить лот</h2>
        <PurchaseStep
          title="1. Осмотр имущества"
          description={
            (lot.bidding?.viewingProcedure)
              ? `Вам необходимо самостоятельно ознакомиться с имуществом. Порядок ознакомления указан выше на этой странице.`
              : "Вам необходимо самостоятельно связаться с арбитражным управляющим для осмотра имущества. Напишите нам для получения контактов управляющего, если они не указаны в описании лота."
          }
        />
        <PurchaseStep
          title="2. Договор"
          description="Если после осмотра вы решили приобрести данный лот с нашей помощью, мы заключаем с вами договор, в котором прописаны все условия сотрудничества и наша ответственность."
        />
        <PurchaseStep
          title="3. Задаток и комиссия"
          description="Вы переводите задаток на специальный счет торговой площадки и оплачиваете нашу комиссию по договору."
        />
        <PurchaseStep
          title="4. Участие в торгах"
          description="Наш специалист подает заявку, участвует в торгах от вашего имени и борется за победу по согласованной с вами стратегии."
        />
        <PurchaseStep
          title="5. Завершение сделки"
          description="В случае победы мы подписываем протокол торгов. Вы оплачиваете оставшуюся стоимость лота напрямую продавцу. Если торги не выиграны, задаток возвращается вам в полном объеме."
        />

        <a
          href="https://t.me/+79269598508"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ctaButton}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            cursor: 'pointer'
          }}
        >
          Свяжитесь с нами
        </a>
      </div>
    </main>
  );
}
