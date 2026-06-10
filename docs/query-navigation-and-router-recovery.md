# Навигация по query-параметрам и восстановление роутера

Документ описывает, как работает связка **`lib/queryNavigation.ts` → `hooks/useQueryNavigation.ts` → `components/RouterRecovery.tsx`** и как через неё обновляется пагинация после долгого простоя вкладки.

## Проблема

На главной странице, в избранном и в объявлениях состояние списка хранится в URL (`page`, `categories`, `regions` и т.д.).

После того как вкладка долго неактивна (свернута, ноутбук уснул, браузер «заморозил» вкладку), **клиентский роутер Next.js App Router может устареть**. Тогда при клике на пагинацию:

- `router.push()` молча не срабатывает;
- параметр `page` в адресной строке не меняется;
- список лотов не перезагружается.

Это клиентская проблема Next.js, а не бэкенда или Istio.

## Общая схема

Два слоя решают задачу по-разному:

| Компонент | Когда работает | Задача |
|---|---|---|
| **`RouterRecovery`** | Пользователь **вернулся** на вкладку | Профилактика: «оживить» роутер до клика |
| **`useQueryNavigation`** + **`queryNavigation`** | Пользователь **кликнул** на страницу / фильтр | Надёжно обновить URL и перезагрузить данные |

```
  Долгий простой вкладки
           │
           ▼
  ┌─────────────────────┐
  │   RouterRecovery    │  visibilitychange / pageshow / popstate
  │   router.refresh()  │  → роутер снова синхронизирован с URL
  └─────────────────────┘

  Клик на «28» в пагинации
           │
           ▼
  ┌─────────────────────┐
  │ useQueryNavigation  │  onPageChange({ page: 28 })
  └──────────┬──────────┘
             ▼
  ┌─────────────────────┐
  │ queryNavigation.ts  │  pushState + router.refresh()
  └──────────┬──────────┘
             ▼
  URL: ?page=28&…  →  useSearchParams()  →  fetchLots()
```

---

## 1. `lib/queryNavigation.ts` — ядро навигации

Файл содержит три функции.

### `applyQueryUpdates(baseParams, updates)`

Берёт текущие query-параметры и применяет изменения:

- `{ page: 28 }` — установить параметр;
- `{ page: null }` или `{ biddingType: 'Все' }` — удалить;
- `{ categories: ['Квартира', 'Жилой дом'] }` — заменить массив (сначала удаляет старые значения ключа, потом добавляет новые).

### `buildQueryUrl(pathname, params)`

Собирает итоговый URL: `/` + `?categories=…&page=28`.

### `navigateWithQueryParams(pathname, updates, router, options?)`

**Главная функция.** Вызывается при каждом изменении фильтров или страницы пагинации.

```typescript
// Упрощённый алгоритм
const params = applyQueryUpdates(
  new URLSearchParams(window.location.search),  // актуальный URL из браузера
  { page: 28 },
);
const url = buildQueryUrl(pathname, params);

window.history.pushState(null, '', url);  // 1. адресная строка обновляется всегда
router.refresh();                          // 2. Next.js подхватывает новый URL
```

**Почему `window.location.search`, а не `useSearchParams()`?**  
На момент клика адресная строка — единственный надёжный источник правды. React-хук `searchParams` после «заморозки» вкладки может отставать от реального URL.

**Почему `pushState`, а не `router.push`?**  
`pushState` выполняется браузером напрямую и всегда меняет URL. `router.push` зависит от внутреннего состояния Next.js, которое как раз и «ломается» после простоя.

**Почему сразу после `pushState` вызывается `router.refresh()`?**  
Next.js не узнаёт об изменении URL, сделанном вручную через History API. `refresh()` заставляет приложение перечитать текущий URL: обновляется `useSearchParams()`, срабатывают `useEffect` с зависимостью от `searchParams`, уходит новый запрос к API.

---

## 2. `hooks/useQueryNavigation.ts` — хук для страниц

Тонкая обёртка над `navigateWithQueryParams` для использования в React-компонентах.

```typescript
export function useQueryNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const updateQuery = useCallback(
    (updates, options?) => {
      navigateWithQueryParams(pathname, updates, router, options);
    },
    [pathname, router],
  );

  return { updateQuery };
}
```

Хук скрывает детали: странице не нужно знать про `pushState` и `refresh` — она просто вызывает `updateQuery`.

### Связка с пагинацией

На главной странице (`app/page.tsx`):

```typescript
const { updateQuery } = useQueryNavigation();

const onPageChange = (nextPage: number) => {
  updateQuery({ page: nextPage }, { scroll: false });
};

<Pagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={onPageChange}   // ← клик по «28» попадает сюда
/>
```

Цепочка при клике на страницу **28**:

1. `Pagination` вызывает `onPageChange(28)`.
2. `onPageChange` → `updateQuery({ page: 28 })`.
3. `useQueryNavigation` → `navigateWithQueryParams('/', { page: 28 }, router)`.
4. `queryNavigation.ts` читает текущие фильтры из URL, подставляет `page=28`, делает `pushState` + `refresh`.
5. `useSearchParams()` возвращает новый `page=28`.
6. `useEffect` → `fetchLots()` → запрос `/api/lots/list?page=28&…`.

Тот же хук используется для **фильтров** (`<Filters onUpdate={updateQuery} />`) — логика одна, меняются только передаваемые `updates`.

Аналогично подключено в `app/favorites/page.tsx` и `app/ads/page.tsx`.

---

## 3. `components/RouterRecovery.tsx` — восстановление после простоя

Компонент монтируется один раз в `app/layout.tsx` и ничего не рендерит (`return null`). Его задача — **профилактика**: обновить роутер, когда пользователь возвращается на «устаревшую» вкладку, *до* того как он нажмёт на пагинацию.

| Событие | Условие | Действие |
|---|---|---|
| `visibilitychange` | Вкладка снова видима, простой **≥ 5 минут** | `router.refresh()` |
| `pageshow` | Страница восстановлена из **bfcache** (`event.persisted`) | `router.refresh()` |
| `popstate` | Пользователь нажал **Назад / Вперёд** в браузере | `router.refresh()` |

Порог 5 минут (`INACTIVITY_THRESHOLD_MS`) выбран как типичное время, после которого браузер может «заморозить» вкладку и оборвать внутренние соединения Next.js.

### Как `RouterRecovery` дополняет `queryNavigation`

- **`RouterRecovery`** — страховка *до* действия пользователя: «подтянуть» роутер, когда вкладка проснулась.
- **`queryNavigation`** — страховка *во время* действия: даже если роутер всё ещё сломан, `pushState` гарантированно меняет URL, а `refresh()` подтягивает данные.

Вместе они закрывают оба сценария: профилактику и принудительную навигацию.

---

## Где что подключено

| Файл | Роль |
|---|---|
| `lib/queryNavigation.ts` | Логика: собрать URL, `pushState`, `router.refresh()` |
| `hooks/useQueryNavigation.ts` | React-хук `updateQuery` для страниц |
| `components/RouterRecovery.tsx` | Глобальное восстановление роутера |
| `app/layout.tsx` | `<RouterRecovery />` — работает на всём сайте |
| `app/page.tsx` | Пагинация и фильтры лотов |
| `app/favorites/page.tsx` | Пагинация избранного |
| `app/ads/page.tsx` | Пагинация объявлений |

---

## Как проверить локально

Режим `npm run dev` ведёт себя иначе — нужна production-сборка:

```bash
npm run build
npm start
```

1. Открыть главную с фильтрами, перейти на страницу 2–3.
2. Оставить вкладку неактивной 5–10 минут.
3. Вернуться и нажать другую страницу в пагинации.
4. Убедиться: `page=` в адресной строке изменился, список перезагрузился.

---

## Связанные, но отдельные проблемы

- **Istio / 503 от API** после простоя — отдельный фикс в `k8s/web-api/web-api-dr.yaml`. Запросы не доходят до бэкенда, но URL при этом может меняться.
- **Устаревший роутер Next.js** — URL **не меняется** при клике. Решается описанной здесь связкой.
