# Инструкции для coding-агентов

Проект — работающий Telegram-бот AAA Store для розничного и оптового каталога, импорта двух XLSX-прайсов, корзины и заказов. Стек: Node.js, TypeScript (strict, ES2020, CommonJS), node-telegram-bot-api (polling), SheetJS `xlsx`, Google Sheets API через `googleapis`, OpenRouter через `fetch`, Bottleneck и node-cron. Данные хранятся в JSON-файлах и памяти процесса.

## Ориентиры

- `src/index.ts` — bootstrap; `src/bot.ts` — подключение Telegram.
- `src/handlers/document.handler.ts`, `src/services/xlsx.service.ts` — импорт прайсов.
- `src/services/products/`, `src/services/catalog/`, `src/utils/priceFormat.ts` — идентификация товаров, предложения, каталог и цены.
- `src/handlers/callback.handler.ts`, `src/state/chat.state.ts`, `src/services/orders.service.ts` — корзина и отправка заказа.
- `src/services/sheets.service.ts`, `src/services/warehouse.service.ts`, `ingestWarehousePrices` в `src/services/xlsx.service.ts` — складские USD-предложения: `loadWarehouseFromConfig` по кнопке «Обновить конфиг», кеш в памяти и `warehouse.json`, `loadWarehouseFromFile` при старте без Google-запроса. Правила — [warehouse-prices.md](docs/tasks/warehouse-prices.md).
- Подробности: [архитектура](docs/architecture.md). Задачи ведутся в Git issues; [docs/tasks/](docs/tasks/README.md) — только для дополнительного контекста при необходимости. Читать только документы, относящиеся к задаче.

## Команды и проверки

Package manager: `pnpm@11.5.2` из `package.json`, lock-файл — `pnpm-lock.yaml`.

По подтверждению владельца: Node.js на сервере — 24.13.1, prod разворачивается вручную из `main` через PM2 (stop → pull → build → start), stage при необходимости — из `dev`. Устаревший workflow удалён владельцем; автоматического продакшен-деплоя нет. Эти сведения не проверялись подключением к серверу.

| Команда | Основание и статус на 2026-11-17 |
| --- | --- |
| `pnpm install --frozen-lockfile` | Обычная установка по имеющемуся lock-файлу; отдельного install-script нет. Не выполнялась. Требует разрешённой установки зависимостей. |
| `pnpm exec tsc --noEmit` | Проверка по `tsconfig.json`, отдельного script нет. Эквивалент `node node_modules/typescript/bin/tsc --noEmit` выполнен успешно. Сам `pnpm exec` не проверялся. |
| `node -r ts-node/register --test tests/warehouse-prices.test.ts` | Целевые тесты склада и регрессии XLSX/корзины; без внешних сервисов и рабочих файлов. Результаты — в документе складской задачи. |
| `pnpm run build` | Script `build`: `tsc && cpx` с шаблоном `src/**/*.json` и целью `dist`; не выполнялся, корректность shell-экранирования шаблона не проверена. |
| `pnpm run dev`, `pnpm start` | Scripts запуска через `ts-node src/index.ts` и `node dist/index.js`; не выполнялись. Они подключаются к рабочим сервисам. |

Scripts тестов и линтера отсутствуют. Тесты в `tests/warehouse-prices.test.ts` используют встроенный `node:test` и установленный `ts-node`, без новых зависимостей. Конфигурация линтера не найдена. Не заявлять успешность непроверенных команд.

## Соглашения и безопасность

- Сохранять существующий стиль соседнего кода: ES imports, функции сервисов, общие типы `src/types`, тексты `src/texts`, клавиатуры `src/keyboards`, рендер `src/render`. Форматирование смешанное; единого настроенного форматтера не найдено.
- `CachedProduct` не содержит цен; цены принадлежат предложениям каталога. `PriceListType` использует точные строки источников; цены в типах — строки, валюта определяется источником и ролью.
- Наценки абсолютные; клиентские цены: опт — USD, розница — BYN. Курсы: `rub_to_usd` — RUB за 1 USD, `rub_to_byn` — BYN за 100 RUB, `usd_to_byn` — BYN за 1 USD. SIM, цвет и активация различают товары; для iPhone регион учитывается через SIM, отдельное различение регионов при одинаковом SIM сейчас не требуется. Определение цвета особенно важно для техники Apple. Склад хранится как источник `warehouse` в USD без количества и доставки +5 USD; резервирование/списание остатков и USDT не реализованы.
- После каждой реализованной функции и исправления ошибки актуализировать относящуюся к изменению документацию: фактическое поведение, ограничения и результаты проверок. Общее устройство отражать в `docs/architecture.md`, рабочие инструкции — в `AGENTS.md` и других соответствующих документах. Не описывать планы как готовые возможности и не дублировать список задач из Git issues.
- Не смешивать `getCatalogUIProducts` (фильтрация для интерфейса) с построением данных для отчётов/экспорта.
- Перед изменениями проверять `git status`; не откатывать чужие правки. Рабочие файлы могут отличаться от HEAD.
- Не читать `.env`, токены, credentials, приватные ключи, файлы авторизации (включая `google-service-account.json`); использовать имена переменных из исходников или безопасный пример окружения.
- Не запускать бота, watcher, dev-сервер, импорт, миграции, запись в рабочие JSON/CSV, Telegram-отправки и внешние запросы без явной авторизации задачи. Импорт может вызвать платный AI API и менять кеш ещё до обновления каталога.
- Не выполнять установку зависимостей, commit, push, deploy без соответствующего разрешения. Описание ручного деплоя не является разрешением его выполнять.
