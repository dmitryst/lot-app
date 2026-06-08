## Выкатка фронта с помощью скрипта (в cloud k8s)

1. Изменить версию **NEXT_PUBLIC_APP_VERSION** в файле .env.production
2. запустить Git Bash и перейти в папку командой cd /b/Projects/lot-app
3. запустить скрипт ./build-k8s.sh prod

## Узнать хэш последнего комита образа/контейнера

В контейнере:

```bash
kubectl exec deploy/frontend-deployment -c frontend-container -- cat /app/BUILD_INFO
```

Через Docker (если есть доступ к registry/образу):

```bash
docker inspect dmitryst/lot-app:1.4.10 --format='{{index .Config.Labels "org.opencontainers.image.revision"}}'
```