# Подключаем SSL-сертификат Let's Encrypt для Next.js + nginx + Docker

## Как это работает

**nginx выступает в роли обратного прокси**: он принимает HTTPS-запросы и перенаправляет их в ваш контейнер Docker с приложением (например, на http://localhost:3000). Сертификат устанавливается на уровень nginx, а не внутрь Docker-контейнера.

---

## 1. Убедитесь, что сайт доступен по вашему домену на http

Ваш домен должен вести на ваш сервер (проверьте это: сайт должен открываться по http://yourdomain.com).

## 2. Установите certbot и плагин для nginx

```
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

## 3. Проверьте конфиг nginx

Убедитесь, что в блоке server в конфиге nginx уже есть ваши домены. Пример (может отличаться вашим портом!):

```
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Важно:** Порт в proxy_pass должен совпадать с портом, который использует ваш контейнер (например, 3000).

## 4. Получите и настройте SSL через certbot

```
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Дальше следуйте инструкциям:
- Введите e-mail.
- Согласитесь с условиями.
- Certbot автоматически добавит SSL и настроит редирект с http на https.

## 5. Проверьте работу SSL

Откройте https://yourdomain.com  
Должен быть зеленый замок «Безопасно».  
Проверьте автоматическую переадресацию с http на https.

## 6. Проверьте автопродление сертификата

Let's Encrypt выдает сертификаты на 90 дней. Certbot обычно добавляет cron или systemd-задачу для автопродления.
Проверьте вручную:

```
sudo certbot renew --dry-run
```

## Важно

- **nginx и сертификат остаются за пределами Docker**: это стандартная практика.
- Если несколько сайтов — повторите шаги для каждого домена.
- Не меняйте настройки reverse proxy/nginx, если все работает, кроме SSL.
- После продления не забудьте перезагрузить nginx, если сертификаты обновились:

```
sudo systemctl reload nginx
```

## Дальнейшее изучение

С описанием файлов сертификата и их использованием при HTTPS можно ознакомиться [здесь](https://github.com/dmitryst/lot-app/blob/main/docs/cert-files-description.md).