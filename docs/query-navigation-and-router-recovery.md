# Навигация по query-параметрам и восстановление роутера

Документ описывает, как работает связка **`lib/queryNavigation.ts` → `hooks/useQueryNavigation.ts` → `components/RouterRecovery.tsx`** и как через неё обновляются пагинация и фильтры на страницах со списками.

## Проблема

На главной странице, в избранном и в объявлениях состояние списка хранится в URL (`page`, `categories`, `regions` и т.д.).

Иногда (дефект **плавающий**, не воспроизводится на каждом клике) при переходе по страницам или нажатии «Найти лоты»:

- клик **ничего не делает** — запрос к `/api/lots/list` не уходит;
- помогает только **обновление страницы** (F5).

При этом подряд можно пролистать хоть 20 страниц без ошибок — сбой проявляется в определённых условиях, а не «на N-й странице».

### Типичные триггеры

| Условие | Что может случиться |
|---|---|
| Вкладка долго неактивна (5–10+ мин) | App Router Next.js «засыпает» |
| Быстрое листание без пауз | Обычно работает нормально |
| Рассинхрон URL и React-состояния | Клик попадает в «ту же» страницу → ранний выход без действия |
| Несколько `router.refresh()` подряд | Редкий deadlock роутера в Next.js 16 |

Это **клиентская** проблема Next.js App Router, не бэкенда и не Istio.

### Почему первый фикс был недостаточен

Первоначально использовалась схема `pushState` + `router.refresh()`:

- `pushState` менял URL в адресной строке;
- `useSearchParams()` **часто не обновлялся** — Next.js не знает о ручном `pushState`;
- `fetchLots` зависел от `searchParams` → запрос к API **не уходил**, хотя URL уже мог измениться;
- UI показывал старую страницу пагинации, URL — новую → повторный клик давал early return (`currentUrl === url`);
- `router.refresh()` на **каждый** клик мог усугублять нестабильность роутера.

---

## Общая схема (текущая)

Два независимых слоя:

| Комponent | Когда работает | Задача |
|---|---|---|
| **`RouterRecovery`** | Пользователь **вернулся** на вкладку после простоя | Профилактика для остального App Router |
| **`useQueryNavigation`** + **`queryNavigation`** | Пользователь **кликнул** пагинацию / «Найти лоты» | URL, React-state и запрос к API **без участия** `router.push` / `refresh` |

```
  Долгий простой вкладки
           │
           ▼
  ┌─────────────────────┐
  │   RouterRecovery    │  visibilitychange (≥5 мин) / pageshow (bfcache)
  │   router.refresh()  │  → подтягивает App Router для прочих маршрутов
  └─────────────────────┘

  Клик на «20» в пагинации
           │
           ▼
  ┌─────────────────────┐
  │ useQueryNavigation  │  updateQuery({ page: 20 })
  └──────────┬──────────┘
             ▼
  ┌─────────────────────┐
  │ queryNavigation.ts  │  pushState → возвращает новый query string
  └──────────┬──────────┘
             ▼
  ┌─────────────────────┐
  │ setQueryString()    │  React-state обновляется сразу
  └──────────┬──────────┘
             ▼
  params  →  fetchLots()  →  /api/lots/list?page=20&…
```

**Источник правды для списков:** `params` из `useQueryNavigation`, а не `useSearchParams()`.

---

## 1. `lib/queryNavigation.ts` — ядро навигации

### `applyQueryUpdates(baseParams, updates)`

Применяет изменения к query-параметрам:

- `{ page: 20 }` — установить;
- `{ page: null }` или `{ biddingType: 'Все' }` — удалить;
- `{ categories: ['Квартира', …] }` — заменить массив.

### `buildQueryUrl(pathname, params)`

Собирает URL: `/?categories=…&page=20`.

### `readQueryStringFromWindow()`

Читает актуальную query-строку из `window.location.search` (без `?`).

### `navigateWithQueryParams(pathname, updates, options?)`

**Главная функция.** Вызывается при каждом изменении фильтров или страницы.

```typescript
const params = applyQueryUpdates(
  new URLSearchParams(window.location.search),
  { page: 20 },
);
const url = buildQueryUrl(pathname, params);

if (currentUrl === url) return params.toString();  // уже на этой странице

window.history.pushState(null, '', url);
return params.toString();  // новая query-строка для React-state
```

**Почему `window.location.search`?**  
На момент клика адресная строка — надёжный источник. `useSearchParams()` может отставать.

**Почему `pushState`, а не `router.push`?**  
`pushState` выполняется браузером всегда. `router.push` зависит от внутреннего состояния Next.js, которое иногда «ломается».

**Почему нет `router.refresh()`?**  
`refresh()` не гарантирует обновление `useSearchParams` после `pushState` и при частых вызовах может дестабилизировать роутер. Вместо этого состояние обновляется **напрямую в React** (см. хук ниже).

---

## 2. `hooks/useQueryNavigation.ts` — хук для страниц

Хранит query-строку в React-state и синхронизирует её с браузером.

```typescript
export function useQueryNavigation() {
  const [queryString, setQueryString] = useState(readQueryStringFromWindow);
  const params = useMemo(() => new URLSearchParams(queryString), [queryString]);

  const updateQuery = (updates, options?) => {
    const next = navigateWithQueryParams(pathname, updates, options);
    setQueryString(next);  // ← сразу триггерит fetchLots через params
  };

  return { updateQuery, queryString, params };
}
```

### Синхронизация с App Router

| Ситуация | Поведение |
|---|---|
| Прямая ссылка / F5 | `searchParams` совпадает с `window.location` → `queryString` обновляется из роутера |
| Клик по пагинации (`pushState`) | `window.location` ≠ `searchParams` → **не перезаписываем** `queryString` из роутера |
| Back / Forward | `popstate` → `queryString` читается из `window.location` |

### Связка с пагинацией

На главной странице (`app/page.tsx`):

```typescript
const { updateQuery, params } = useQueryNavigation();

const page = Number(params.get('page')) || 1;

const onPageChange = (nextPage: number) => {
  updateQuery({ page: nextPage }, { scroll: false });
};

// fetchLots зависит от params, не от useSearchParams()
useEffect(() => { fetchLots(); }, [fetchLots]);
```

Цепочка при клике на страницу **20**:

1. `Pagination` → `onPageChange(20)`.
2. `updateQuery({ page: 20 })`.
3. `navigateWithQueryParams` → `pushState`, возвращает новую query-строку.
4. `setQueryString(...)` → `params` меняется **сразу**.
5. `fetchLots()` → запрос `/api/lots/list?page=20&…`.

Тот же хук используется для **фильтров** (`<Filters onUpdate={updateQuery} />`) и в `app/favorites/page.tsx`, `app/ads/page.tsx`.

---

## 3. `components/RouterRecovery.tsx` — восстановление после простоя

Монтируется в `app/layout.tsx`, ничего не рендерит. **Не участвует** в пагинации напрямую — только профилактика для App Router в целом.

| Событие | Условие | Действие |
|---|---|---|
| `visibilitychange` | Вкладка снова видима, простой **≥ 5 минут** | `router.refresh()` |
| `pageshow` | Восстановление из **bfcache** (`event.persisted`) | `router.refresh()` |

`popstate` (Back/Forward) обрабатывает **`useQueryNavigation`**, а не `RouterRecovery` — чтобы не дублировать `refresh()` и не конфликтовать с `pushState`.

---

## Где что подключено

| Файл | Роль |
|---|---|
| `lib/queryNavigation.ts` | `pushState`, сбор URL, возврат query-строки |
| `hooks/useQueryNavigation.ts` | React-state `queryString`, `params`, `updateQuery` |
| `components/RouterRecovery.tsx` | `router.refresh()` после долгого простоя вкладки |
| `app/layout.tsx` | `<RouterRecovery />` глобально |
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

### Сценарий 1 — быстрое листание

1. Открыть главную с фильтрами.
2. Пролистать 1 → 20 без пауз.
3. В DevTools → Network: на каждый переход должен уходить `/api/lots/list`.

### Сценарий 2 — простой вкладки (основной для плавающего бага)

1. Открыть главную с фильтрами, перейти на страницу 2–3.
2. Оставить вкладку неактивной **5–10 минут**.
3. Вернуться, нажать другую страницу или «Найти лоты».
4. Убедиться: `page=` изменился, запрос ушёл, список обновился.

### Если сбой повторился на prod

За 30 секунд в DevTools зафиксировать:

| Наблюдение | Вероятная причина |
|---|---|
| URL не меняется, запроса нет | Зависший App Router / обработчики |
| URL меняется, запроса нет | Старый баг (до фикса с `params`) |
| Запрос есть, 503 | Istio / web-api |

---

## Связанные, но отдельные проблемы

- **Istio / 503 от API** после простоя — фикс в `k8s/web-api/web-api-dr.yaml` и `virtual-service.yaml`. Запросы не доходят до бэкенда; URL при этом может меняться.
- **Плавающий сбой пагинации** — клиентский App Router и рассинхрон состояния; решается связкой `queryNavigation` + `useQueryNavigation`.
