# === Этап 1: Установка зависимостей ===
FROM node:18-alpine AS deps
WORKDIR /app

# Копируем package.json и lock-файл
COPY package.json package-lock.json* ./

# Устанавливаем зависимости. Флаг --production не используем, так как
# для сборки TypeScript-проекта нужен сам typescript из devDependencies
RUN npm ci

# === Этап 2: Сборка приложения ===
FROM node:18-alpine AS builder
WORKDIR /app

# Объявляем аргументы, которые мы ожидаем получить при сборке
ARG POSTGRES_DB
ARG POSTGRES_USER
ARG POSTGRES_PASSWORD
ARG POSTGRES_HOST
ARG NODE_ENV=production

# Устанавливаем эти аргументы как переменные окружения для этого этапа
ENV POSTGRES_DB=$POSTGRES_DB
ENV POSTGRES_USER=$POSTGRES_USER
ENV POSTGRES_PASSWORD=$POSTGRES_PASSWORD
ENV POSTGRES_HOST=$POSTGRES_HOST
ENV NODE_ENV=$NODE_ENV

# Копируем зависимости с предыдущего этапа
COPY --from=deps /app/node_modules ./node_modules
# Копируем исходный код
COPY . .

# Сборка Next.js приложения
RUN npm run build

# === Этап 3: Финальный образ для Production ===
FROM node:18-alpine AS runner
WORKDIR /app

# Создаем пользователя с ограниченными правами для безопасности
RUN addgroup -S --gid 1001 nodejs
RUN adduser -S --uid 1001 nextjs

# Копируем только необходимые для запуска файлы со стадии сборки
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Устанавливаем пользователя
USER nextjs

# Открываем порт, на котором будет работать приложение
EXPOSE 3000

# Команда для запуска приложения
CMD ["npm", "start"]
