# === Этап 1: Сборка приложения ===
# Используем стабильный образ Debian, чтобы избежать проблем с компиляцией
FROM node:18-buster-slim AS builder
WORKDIR /app

# Копируем файлы для установки ВСЕХ зависимостей
COPY package.json package-lock.json* ./

# Устанавливаем ВСЕ зависимости (включая dev), необходимые для сборки.
# Это гарантирует, что нативные модули компилируются для правильной Linux-среды.
RUN npm ci --legacy-peer-deps

# Копируем остальной код
COPY . .

# Объявляем и передаем переменные окружения для сборки
ARG NEXT_PUBLIC_CSHARP_BACKEND_URL
ARG NEXT_PUBLIC_FEATURE_PUBLISH_BUTTON_ENABLED
ARG NEXT_PUBLIC_YANDEX_MAPS_API_KEY
ENV NEXT_PUBLIC_CSHARP_BACKEND_URL=$NEXT_PUBLIC_CSHARP_BACKEND_URL
ENV NEXT_PUBLIC_FEATURE_PUBLISH_BUTTON_ENABLED=$NEXT_PUBLIC_FEATURE_PUBLISH_BUTTON_ENABLED
ENV NEXT_PUBLIC_YANDEX_MAPS_API_KEY=$NEXT_PUBLIC_YANDEX_MAPS_API_KEY

# Сборка Next.js приложения
RUN npm run build

# === Этап 2: Финальный образ для Production ===
FROM node:18-buster-slim AS runner
WORKDIR /app

# Создаем пользователя с ограниченными правами
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Копируем файлы для установки ТОЛЬКО production-зависимостей
COPY package.json package-lock.json* ./

# Устанавливаем ТОЛЬКО production-зависимости, чтобы образ был меньше
RUN npm ci --omit=dev --legacy-peer-deps

# Копируем собранное приложение со стадии сборки
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Устанавливаем пользователя
USER nextjs

# Открываем порт
EXPOSE 3000

# Команда для запуска
CMD ["npm", "start"]