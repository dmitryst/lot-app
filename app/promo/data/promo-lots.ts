// data/promo-lots.ts

export type PromoLot = {
  id: string;
  title: string;
  subtitle?: string; // Для баннера на главной
  address: string;
  description: string;
  priceStart: string;
  priceTarget: string; // Целевая цена для инвестора
  img: string;  // Обложка (для превью и мета-тегов)
  images: string[]; // Массив всех фото
  features: string[];
  schedule: {
    date: string;
    price: string;
    deposit: string;
    status: 'previous' | 'wait' | 'recommended' | 'hot' | 'sold'; // Статусы для стилизации
    statusText: string;
  }[];
  expertOpinion: string;
  managerTg: string; // Имя пользователя без @
  keywords?: string[];
};

export const PROMO_LOTS: Record<string, PromoLot> = {
  'dom-v-glazinino': {
    id: 'dom-v-glazinino',
    title: 'Дом 550 м² + 17 соток ИЖС (д. Глазынино, Одинцово)',
    subtitle: 'Вход 28 млн ₽ (Ниже рынка земли!). Потенциал х2.',
    address: 'Московская обл., г. Одинцово, д. Глазынино, д. 126',
    description: `
      Продается коттедж 557,1 кв.м на земельном участке 17,21 сотки (ИЖС) в черте города Одинцово, д. Глазынино, д. 126. Престижная локация, всего 5 км от МКАД по Минскому шоссе.

      Ключевые преимущества:
      • Транспортная доступность: 17 минут пешком до станции МЦД "Одинцово", быстрый выезд на Москву.
      • Инвестиционный потенциал: Объект реализуется через торги по банкротству. Текущая цена лота уже ниже рыночной стоимости аналогичного земельного участка без построек в этом районе (30-35 млн руб). Дом достается покупателю фактически бесплатно.
      • Характеристики: 3 этажа, материал стен — из прочих материалов. Требуется косметический ремонт или реконструкция, что позволяет реализовать собственный дизайн-проект или стратегию флиппинга.

      Идеальный вариант для инвесторов, ищущих активы с дисконтом 40-50% от рынка, или для тех, кто хочет купить большой дом в Одинцово по цене "однушки" в Москве.
    `.trim(),
    priceStart: '40 160 700',
    priceTarget: '28 112 490', // Целимся в этот этап
    img: '/images/promo/dom-v-glazinino/01.jpeg',
    images: [
      '/images/promo/dom-v-glazinino/01.jpeg',
      '/images/promo/dom-v-glazinino/02.jpeg',
      '/images/promo/dom-v-glazinino/03.jpeg',
      '/images/promo/dom-v-glazinino/04.jpeg',
      '/images/promo/dom-v-glazinino/05.jpeg',
      '/images/promo/dom-v-glazinino/06.jpeg',
      '/images/promo/dom-v-glazinino/07.jpeg',
      '/images/promo/dom-v-glazinino/08.jpeg',
      '/images/promo/dom-v-glazinino/09.jpeg',
      '/images/promo/dom-v-glazinino/10.jpeg',
      '/images/promo/dom-v-glazinino/11.jpeg',
      '/images/promo/dom-v-glazinino/12.jpeg',
      '/images/promo/dom-v-glazinino/13.jpeg',
      '/images/promo/dom-v-glazinino/14.jpeg',
      '/images/promo/dom-v-glazinino/15.jpeg',
      '/images/promo/dom-v-glazinino/16.jpeg',
      '/images/promo/dom-v-glazinino/17.jpeg',
      '/images/promo/dom-v-glazinino/18.jpeg',
      '/images/promo/dom-v-glazinino/19.jpeg',
      '/images/promo/dom-v-glazinino/20.jpeg',
      '/images/promo/dom-v-glazinino/21.jpeg',
      '/images/promo/dom-v-glazinino/22.jpeg',
      '/images/promo/dom-v-glazinino/23.jpeg',
      '/images/promo/dom-v-glazinino/24.jpeg',
      '/images/promo/dom-v-glazinino/25.jpeg',
      '/images/promo/dom-v-glazinino/26.jpeg',
      '/images/promo/dom-v-glazinino/27.jpeg',
      '/images/promo/dom-v-glazinino/28.jpeg',
    ],
    features: [
      '<strong>Локация:</strong> 17 минут пешком до МЦД "Одинцово"',
      '<strong>Адрес:</strong> Московская область, Одинцовский район, городское поселение Одинцово, д. Глазынино, дом 126',
      '<strong>Участок:</strong> 17,21 сотки ИЖС, кадастровый номер: 50:20:0020402:55, (рыночная цена земли здесь ~30-35 млн)',
      '<strong>Дом:</strong> 557 кв.м, кадастровый номер 50:20:0000000:286674, из прочих материалов, 3 этажа (возможно требует ремонта/реконструкции)',
      '<strong>Вид торгов:</strong> Публичное предложение (цена падает каждую неделю)',
      '<strong>Риск:</strong> Возможно требуется судебное выселение, должник препятствует осмотру (управляющий судится за доступ в дом)'
    ],
    // график снижения цены
    schedule: [
      { date: '23.12.2025', price: '40 160 700', deposit: '2 008 035', status: 'previous', statusText: '' },
      { date: '30.12.2025', price: '38 152 665', deposit: '1 907 633', status: 'wait', statusText: '' },
      { date: '06.01.2026', price: '36 144 630', deposit: '1 807 231', status: 'wait', statusText: '' },
      { date: '13.01.2026', price: '34 136 595', deposit: '1 706 829', status: 'wait', statusText: '' },
      { date: '20.01.2026', price: '32 128 560', deposit: '1 606 428', status: 'wait', statusText: '' },
      { date: '27.01.2026', price: '30 120 525', deposit: '1 506 026', status: 'wait', statusText: '' },
      { date: '03.02.2026', price: '28 112 490', deposit: '1 405 624', status: 'recommended', statusText: '✅' },
      { date: '10.02.2026', price: '26 104 455', deposit: '1 305 222', status: 'hot', statusText: '' },
      { date: '17.02.2026', price: '24 096 420', deposit: '1 204 821', status: 'hot', statusText: '' },
      // Можно добавить остальные этапы, если нужно, но обычно инвестору интересны эти
    ],
    expertOpinion: 'Рыночная стоимость такого участка без дома — около 30 млн руб. Мы заходим в сделку по цене ниже рынка земли. Дом (550 кв.м) получаем фактически бесплатно. Основная задача здесь — юридическая "очистка". Покупая этот объект, вы покупаете не просто ключи, а проект по юридической «очистке» и выселению (срок 6–12 мес.). Если готовы на это, доходность будет выше 50% годовых.',
    managerTg: 'dmitstep', // ник в телеграм
    keywords: [
      'купить дом Одинцово',
      'купить дом Глазынино',
      'участок ИЖС купить',
      'коттедж Минское шоссе',
      'торги по банкротству недвижимость',
      'инвестиции в землю подмосковье',
      'дом с участком дешево',
      'дом 500 кв м одинцово',
      'купить участок 17 соток одинцово',
      '50:20:0020402:55',
      '50:20:0000000:286674',
      'Одинцово, д. Глазынино, участок 126',
    ],
  },

  // Сюда можно добавить 'magnit-saratov'
};
