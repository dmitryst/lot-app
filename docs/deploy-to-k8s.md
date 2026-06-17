## Выкатка фронта с помощью скрипта (в cloud k8s)

1. изменить версию **NEXT_PUBLIC_APP_VERSION** в файле .env.production
2. в Git Bash перейти в директорию lot-app
```bash
cd /b/Projects/lot-app
```
3. запустить скрипт сборки образа:
```bash
./build-k8s.sh prod
```
4. перейти в директорию k8s
```bash
cd /b/Projects/k8s
```
5. изменить версию в deployment и применить его:
```bash
kubectl apply -f web-api/deployment.yaml
```

## Узнать хэш последнего комита образа/контейнера

В контейнере:

```bash
kubectl exec deploy/frontend-deployment -c frontend-container -- cat /app/BUILD_INFO
```

Через Docker (если есть доступ к registry/образу):

```bash
docker inspect dmitryst/lot-app:1.4.10 --format='{{index .Config.Labels "org.opencontainers.image.revision"}}'
```