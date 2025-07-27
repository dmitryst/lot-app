# Развертывание Docker-приложения (Next.js + PostgreSQL) на VPS

Это руководство описывает полный процесс развертывания веб-приложения, состоящего из фронтенда на Next.js и базы данных PostgreSQL, на виртуальном сервере (VPS) с помощью Docker и Docker Compose. В качестве веб-сервера для проксирования запросов используется Nginx.

## Шаг 1: Подключение к серверу и установка зависимостей

Первым делом необходимо подключиться к вашему VPS и установить все необходимые инструменты.

### 1.1. Подключение по SSH

Подключитесь к серверу с вашего локального компьютера, используя IP-адрес и учетные данные, предоставленные хостинг-провайдером.

```
ssh root@ВАШ_IP_АДРЕС
```

### 1.2. Установка Docker

Обновите пакеты и установите Docker Engine, выполнив следующие команды на сервере:

```
sudo apt update
```

Устанавливаем пакеты для работы с HTTPS-репозиториями

```
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
```

Добавляем официальный GPG-ключ Docker

```
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
```

Добавляем репозиторий Docker в систему

```
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
```

Устанавливаем Docker

```
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io
```

### 1.3. Установка Docker Compose

Docker Compose упрощает управление мультиконтейнерными приложениями.

Скачиваем последнюю версию Docker Compose

```
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
```

Предоставляем права на выполнение файла

```
sudo chmod +x /usr/local/bin/docker-compose
```

Убедитесь, что все установлено корректно, проверив версии:

```
docker --version
docker-compose --version
```

## Шаг 2: Подготовка проекта на сервере
Теперь нужно перенести код вашего приложения на сервер и настроить переменные окружения.

### 2.1. Копирование файлов проекта
Самый удобный способ — клонировать репозиторий проекта из системы контроля версий (например, GitHub).

Устанавливаем Git, если его еще нет

```
sudo apt install git
```

Клонируем репозиторий

```
git clone https://адрес_вашего_репозитория.git
```

Переходим в папку проекта

```
cd lot-app
```

### 2.2. Создание файла с переменными окружения (.env)
Для безопасного хранения и передачи учетных данных (например, паролей от БД) в контейнеры используется файл .env. Docker Compose автоматически находит этот файл в корне проекта и использует его для подстановки переменных.

Создайте файл .env:

```
nano .env
```

Добавьте в него необходимые переменные. Их имена должны соответствовать тем, что используются в docker-compose.yml.

```
POSTGRES_USER=myuser
POSTGRES_PASSWORD=supersecretpassword123
POSTGRES_DB=mydatabase
# Имя хоста для подключения из приложения (должно совпадать с именем сервиса БД)
POSTGRES_HOST=postgres
```

Сохраните файл (Ctrl+O), нажмите Enter и закройте редактор (Ctrl+X).

# Шаг 3: Запуск контейнеров
Основная логика запуска описана в файле docker-compose.yml.

Находясь в корневой папке проекта (где лежат docker-compose.yml и .env), выполните одну команду для сборки образов и запуска контейнеров в фоновом режиме:

```
docker-compose up -d --build
```

--build: принудительно пересобирает образ вашего приложения.

-d: запускает контейнеры в фоновом (detached) режиме.

Проверить статус запущенных контейнеров можно командой:

```
docker-compose ps
```

# Шаг 4: Настройка Nginx как обратного прокси (Reverse Proxy)
Сейчас ваше приложение доступно по адресу http://ВАШ_IP_АДРЕС:3000. Чтобы сделать его доступным по стандартному порту 80 (и в будущем 443 для HTTPS) и привязать домен, настроим Nginx.

## 4.1. Установка Nginx

```
sudo apt install nginx
```

## 4.2. Конфигурация Nginx

Создайте новый файл конфигурации для вашего сайта:

```
sudo nano /etc/nginx/sites-available/lot-app
```

Вставьте в него следующий код. Он будет перенаправлять все входящие запросы на ваше приложение, работающее в Docker на порту 3000.

```
server {
    listen 80;
    server_name ваш_домен.com www.ваш_домен.com; # Укажите ваш домен или IP-адрес

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4.3. Активация конфигурации
Включите созданную конфигурацию, создав на нее символическую ссылку, и перезапустите Nginx.

Создаем символическую ссылку

```
sudo ln -s /etc/nginx/sites-available/lot-app /etc/nginx/sites-enabled/
```

Проверяем синтаксис конфигурации на наличие ошибок

```
sudo nginx -t
```

Если ошибок нет, перезапускаем Nginx

```
sudo systemctl restart nginx
```

После этих шагов ваше приложение будет доступно по вашему домену или IP-адресу без указания порта.

# Дальнейшие шаги

## 1. Привязка домена
В панели управления вашего доменного регистратора создайте A-запись, указывающую на IP-адрес вашего сервера.

## 2. Настройка HTTPS
Защитите свой сайт с помощью SSL-сертификата. Проще всего это сделать с помощью бесплатного сервиса Let's Encrypt и утилиты certbot.