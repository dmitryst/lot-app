import { Metadata } from 'next';
import Link from 'next/link';
import styles from '../alerts/alerts-info.module.css';

export const metadata: Metadata = {
  title: 'Глубокий анализ лотов с ИИ (AI Assessment) | s-lot.ru',
  description: 'Голосуйте за лоты! Мы свяжемся с арбитражным управляющим, соберем инсайды и проведем детальную оценку ликвидности и рисков с помощью нейросетей.',
  openGraph: {
    title: 'Глубокий анализ лотов с ИИ (AI Assessment) | s-lot.ru',
    description: 'Узнайте, как мы используем ИИ и работу наших аналитиков для создания эксклюзивных инвест-разборов лотов по банкротству.',
  },
};

export default function AiAssessmentInfoPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Что такое 'Детальная оценка ИИ'?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Это эксклюзивный аналитический отчет по лоту. Мы не просто скачиваем документы с Федресурса — мы связываемся с арбитражным управляющим или должником, выясняем скрытые детали (состояние объекта, наличие жильцов, готовность документов), а затем загружаем все данные в мощную нейросеть для оценки юридических рисков и инвестиционного потенциала."
        }
      },
      {
        "@type": "Question",
        "name": "Для каких лотов проводится такой анализ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Мы делаем такие разборы для лотов, которые вызывают наибольший интерес у нашей аудитории. На странице каждого лота вы найдете кнопку 'Голосовать за детальный разбор'. Лоты, набравшие больше всего голосов, уходят в работу к нашим специалистам."
        }
      },
      {
        "@type": "Question",
        "name": "В чем отличие детального разбора от кнопки «Запустить анализ»?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Кнопка на странице лота запускает базовый экспресс-анализ (DeepSeek), который опирается только на текст объявления. А эксклюзивный разбор (Gemini), за который вы голосуете, включает ручную работу наших аналитиков: звонки конкурсному управляющему, извлечение текста из отчетов об оценке и поиск скрытых проблем объекта."
        }
      },
      {
        "@type": "Question",
        "name": "Сколько стоит посмотреть детальный разбор?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "На данный момент результаты детального разбора публикуются в открытом доступе на странице лота для всех пользователей абсолютно бесплатно."
        }
      },
      {
        "@type": "Question",
        "name": "Сколько лотов можно поддержать голосом одновременно?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Обычные пользователи могут одновременно голосовать за 3 лота. Обладатели PRO-подписки — за 10 лотов. Голос можно снять в любой момент и отдать за другой лот."
        }
      },
      {
        "@type": "Question",
        "name": "Где посмотреть, за какие лоты я уже проголосовал?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Все ваши активные голоса собраны в Личном кабинете во вкладке «Мои голоса за ИИ-анализ». Там отображаются карточки лотов — можно быстро перейти на нужный и снять голос, если лимит исчерпан."
        }
      }
    ]
  };

  return (
    <div className={styles.container}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <header className={styles.header}>
        <h1 className={styles.title}>Детальный разбор лотов с ИИ</h1>
        <p className={styles.subtitle}>
          Вы голосуете — мы проверяем. Эксклюзивная аналитика, инсайды от конкурсных управляющих и глубокая юридическая экспертиза с помощью нейросетей.
        </p>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2>Как работает механика голосования?</h2>
          <p>
            Торги по банкротству часто продают «кота в мешке». В официальных публикациях нет фотографий,
            непонятно состояние объекта и скрытые юридические риски. Чтобы разобраться в одном лоте, нужно
            потратить несколько дней. Мы делаем эту работу за вас для самых интересных объектов платформы.
          </p>

          <div className={styles.stepsGrid}>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>1</div>
              <h3>Вы голосуете</h3>
              <p>
                На странице любого лота нажмите кнопку <b>«Голосовать за детальный разбор»</b>. Наша система в реальном времени формирует топ самых желанных лотов.
                <br /><br />
                <span style={{ fontSize: '0.9em', color: '#4a5568' }}>
                  <i>Обычные пользователи могут голосовать одновременно за 3 лота, а обладатели PRO-подписки — за 10. Управлять своими голосами можно в Личном кабинете во вкладке «Мои голоса за ИИ-анализ».</i>
                </span>
              </p>
            </div>
            
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>2</div>
              <h3>Мы собираем инсайды</h3>
              <p>Наши аналитики звонят арбитражному управляющему (или должнику). Мы выясняем всё: кто прописан, можно ли посмотреть объект внутри, есть ли долги по коммуналке и скрытые обременения.</p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>3</div>
              <h3>Анализ ИИ</h3>
              <p>Собранные инсайды, текст оценки, выписки из Росреестра и документы с торгов загружаются в нейросеть. ИИ выявляет строительные дефекты, юридические риски и оценивает ликвидность.</p>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>4</div>
              <h3>Публикация отчета</h3>
              <p>Развернутый инвест-разбор с оценкой по 10-балльной шкале и стратегиями монетизации (сдача в аренду, флиппинг) публикуется на странице лота. Это экономит вам недели исследований.</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Лимиты и управление голосами</h2>
          <p>
            Голосование бесплатно для всех авторизованных пользователей, но количество одновременных голосов ограничено —
            так мы просим расставлять приоритеты и голосовать за лоты, которые вам действительно интересны.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
            <div style={{ backgroundColor: '#f7fafc', padding: '18px 20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '1.05rem' }}>Лимиты</h3>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#4a5568' }}>
                <li><b>Бесплатный тариф:</b> до 3 одновременных голосов</li>
                <li><b>PRO-подписка:</b> до 10 одновременных голосов</li>
              </ul>
            </div>
            <div style={{ backgroundColor: '#fffff0', padding: '18px 20px', borderRadius: '8px', border: '1px solid #f6e05e' }}>
              <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '1.05rem' }}>Где посмотреть свои голоса</h3>
              <p style={{ margin: 0, color: '#4a5568' }}>
                Откройте <Link href="/account?tab=my-votes" style={{ color: '#3182ce', fontWeight: 'bold' }}>Личный кабинет</Link> → вкладка{' '}
                <b>«Мои голоса за ИИ-анализ»</b>. Там отображаются все лоты, за которые вы сейчас голосуете.
                Из списка можно перейти на страницу лота и снять голос повторным нажатием кнопки «Мой голос учтён».
              </p>
            </div>
            <div style={{ backgroundColor: '#fff5f5', padding: '18px 20px', borderRadius: '8px', border: '1px solid #feb2b2' }}>
              <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '1.05rem' }}>Если лимит исчерпан</h3>
              <p style={{ margin: 0, color: '#4a5568' }}>
                При попытке проголосовать за новый лот вы увидите сообщение о достижении лимита.
                Чтобы отдать голос за другой объект, зайдите в{' '}
                <Link href="/account?tab=my-votes" style={{ color: '#3182ce', fontWeight: 'bold' }}>Личный кабинет</Link>{' '}
                или на страницу менее актуального лота и снимите свой голос — после этого лимит освободится.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Базовый ИИ vs Детальный разбор</h2>
          <p>
            На платформе s-lot.ru предусмотрено два уровня работы с искусственным интеллектом. Важно понимать разницу между ними:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #cbd5e0' }}>
              <h3 style={{ marginTop: 0, color: '#4a5568' }}>🤖 Базовый анализ (Запускаете вы)</h3>
              <p style={{ marginBottom: 0 }}>
                Вы можете самостоятельно нажать кнопку <b>«Запустить анализ»</b> на карточке подходящего лота (кнопка доступна для лотов с ценой от 1 млн рублей). 
                Система отправит <b>только открытый текст описания лота</b> в нейросеть DeepSeek. Это быстрый способ прикинуть базовые риски за 10 секунд, 
                но этот ИИ не видит прикрепленных файлов отчета об оценке и не знает скрытых деталей, которые можно получить только по телефону.
                <br /><br />
                <i>*Функция доступна как пользователям с PRO-подпиской (безлимитно), так и пользователям на бесплатном тарифе (не более 3-х запусков в месяц).</i>
              </p>
            </div>
            
            <div style={{ backgroundColor: '#fffff0', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #d69e2e' }}>
              <h3 style={{ marginTop: 0, color: '#b7791f' }}>🌟 Детальный экспертный разбор (Запускаем мы по итогам голосования)</h3>
              <p style={{ marginBottom: 0 }}>
                Лоты, набравшие наибольшее количество голосов пользователей, уходят в ручную проработку. Мы скачиваем объемные документы с торгов, 
                дозваниваемся до арбитражного управляющего, выясняем инсайды (жильцы, состояние, долги). Весь этот массив новых данных 
                загружается в продвинутую нейросеть, которая выдает максимально глубокий инвестиционный вердикт.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Примеры наших разборов</h2>
          <p>
            Посмотрите, как выглядят результаты нашей работы. Эти лоты уже получили глубокую оценку:
          </p>
          <ul className={styles.examplesList} style={{ listStyleType: 'none', padding: 0, marginTop: '20px' }}>
            <li style={{ marginBottom: '15px' }}>
              <Link href="/lot/imuschestvennyy-kompleks-zemelnyy-uchastok-nezhilye-zdaniya-gazoprovod-garazhi-161331" style={{ color: '#3182ce', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '1.2rem', marginRight: '10px' }}>🏭</span>
                Разбор имущественного комплекса с критическими дефектами в Балашихе (Ликвидность 1/10)
              </Link>
            </li>
            <li style={{ marginBottom: '15px' }}>
              <Link href="/lot/pravo-trebovaniya-na-kvartiru-4404-kvm-moskva-ul-lyublinskaya-vl-72-186105" style={{ color: '#3182ce', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '1.2rem', marginRight: '10px' }}>🏗️</span>
                Инвест-анализ замороженного долгостроя в Москве (Ликвидность 2/10)
              </Link>
            </li>
            <li style={{ marginBottom: '15px' }}>
              <Link href="/lot/kvartira-373-kvm-g-moskva-staromarinskoe-shosse-d-12-kv-6-182429" style={{ color: '#3182ce', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '1.2rem', marginRight: '10px' }}>🔑</span>
                Находка для флиппинга: 2-комнатная квартира в Марьиной Роще без скрытых жильцов (Ликвидность 7/10)
              </Link>
            </li>
          </ul>
        </section>

        <section className={styles.ctaSection}>
          <h2>Повлияйте на следующий разбор!</h2>
          <p>
            Вам не нужно быть платным подписчиком, чтобы проголосовать. Найдите лот, который вы рассматриваете к покупке, и отдайте свой голос.
            Управлять активными голосами можно в{' '}
            <Link href="/account?tab=my-votes" style={{ color: '#3182ce', fontWeight: 'bold' }}>Личном кабинете</Link>.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginTop: '1rem' }}>
            <Link href="/" className={styles.ctaButton}>
              Перейти к поиску лотов
            </Link>
            <Link href="/account?tab=my-votes" className={styles.ctaButton} style={{ backgroundColor: '#4a5568' }}>
              Мои голоса за ИИ-анализ
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}