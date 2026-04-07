# AAA Store Bot

Телеграм-бот для управления розничным и оптовым магазином.

---

## Быстрый запуск на сервере

### 1. Подключение к серверу
```bash
ssh mobileti@93.125.99.154
```

### 2. Перейти в директорию проекта
```bash
cd ~/repositories/aaa-store-bot
```

### 3. Сделать билд (если было обновление с git)
```bash
pnpm run build
```

### 4. Запуск бота
```bash
pm2 start ecosystem.config.js
```

### 5. Сохраняем процесс, чтобы автозапускал при перезагрузке сервера:
```bash
pm2 save
pm2 startup
```

### 6. Проверка что бот запущен
```bash
pm2 list
```

### Просмотр логов
```bash
pm2 logs aaa-store-bot
```

### Перезапуск или остановка бота
```bash
pm2 restart aaa-store-bot
pm2 stop aaa-store-bot
```