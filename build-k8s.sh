#!/bin/bash

# Принимаем аргумент: prod или dev
ENV_TYPE=$1

if [ "$ENV_TYPE" == "prod" ]; then
  ENV_FILE=".env.production"
  TAG_SUFFIX="" # Для прода чистая версия, например 1.1.10
elif [ "$ENV_TYPE" == "dev" ]; then
  ENV_FILE=".env.local" # Или .env.dev
  TAG_SUFFIX="-dev" # Версия будет 1.1.10-dev
else
  echo "Usage: ./build-k8s.sh [prod|dev]"
  exit 1
fi

echo "🏗️  Building for $ENV_TYPE using $ENV_FILE..."

# Достаем версию
RAW_VERSION=$(grep NEXT_PUBLIC_APP_VERSION "$ENV_FILE" | cut -d '=' -f2)
# Убираем возможные кавычки
VERSION="${RAW_VERSION%\"}"
VERSION="${VERSION#\"}"

FULL_TAG="${VERSION}${TAG_SUFFIX}"

# Билд с подстановкой переменных из конкретного файла
docker build \
  --no-cache \
  --build-arg NEXT_PUBLIC_CSHARP_BACKEND_URL=$(grep NEXT_PUBLIC_CSHARP_BACKEND_URL "$ENV_FILE" | cut -d '=' -f2) \
  --build-arg NEXT_PUBLIC_FEATURE_PUBLISH_BUTTON_ENABLED=$(grep NEXT_PUBLIC_FEATURE_PUBLISH_BUTTON_ENABLED "$ENV_FILE" | cut -d '=' -f2) \
  --build-arg NEXT_PUBLIC_YANDEX_MAPS_API_KEY=$(grep NEXT_PUBLIC_YANDEX_MAPS_API_KEY "$ENV_FILE" | cut -d '=' -f2) \
  --build-arg NEXT_PUBLIC_APP_VERSION="$FULL_TAG" \
  -t dmitryst/lot-app:"$FULL_TAG" .

echo "🚀 Pushing image dmitryst/lot-app:$FULL_TAG..."
docker push dmitryst/lot-app:"$FULL_TAG"

# 4. (Опционально) Обновляем деплоймент в K8s, если нужно
# sed -i "s|image: dmitryst/lot-app:.*|image: dmitryst/lot-app:$FULL_TAG|" k8s/deployment.yaml
