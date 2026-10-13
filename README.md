# LabTrack

Небольшое fullstack-приложение для просмотра лабораторных образцов.

## Стек

* React + TypeScript + Vite
* React Router
* React Hook Form + Zod
* Node.js + Express + TypeScript
* PostgreSQL
* Drizzle ORM
* Vitest + Supertest
* Docker

## 1. Как запустить

Из корня проекта:

```bash
docker compose up -d --build
```

После запуска:

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:3000
```

PostgreSQL:

```text
localhost:5432
```

Проверить состояние контейнеров:

```bash
docker compose ps
```

Остановить проект:

```bash
docker compose down
```

Для полного удаления базы вместе с Docker volume:

```bash
docker compose down -v
```

## 2. База данных

Используется PostgreSQL и Drizzle ORM.

Схема:

```text
server/src/db/schema.ts
```

Миграции:

```text
server/drizzle/
```

Миграции запускаются отдельно:

```bash
cd server
npm run db:migrate
```

Seed:

```bash
npm run db:seed
```

Seed создаёт:

* 2 лаборатории;
* 2 пользователей;
* 10 000 образцов.

## 3. Тестовые пользователи

Администратор:

```text
login: admin
password: password123
```

Пользователь лаборатории:

```text
login: lab_user
password: password123
```

`admin` имеет доступ ко всем образцам.

`lab_user` имеет доступ только к образцам своей лаборатории.

Пароли хранятся в базе в виде bcrypt-хешей.

## 4. Структура проекта

Frontend разделён на:

```text
client/src/
├── api/          API-запросы
├── auth/         защита маршрутов
├── components/   UI-компоненты
├── pages/        страницы
├── providers/    маршрутизация
├── schemas/      Zod-схемы
└── types/        TypeScript-типы
```

Backend:

```text
server/src/
├── db/           база данных и seed
├── middleware/   middleware
├── routes/       API-маршруты
├── schemas/      валидация
├── tests/        API-тесты
└── types/        типы
```

Архитектура намеренно остаётся простой, без лишних слоёв и абстракций.

## 5. Авторизация

Используются серверные сессии.

После успешного входа сервер сохраняет `userId` в сессии. Сессии хранятся в PostgreSQL через `connect-pg-simple`.

Авторизация:

```text
POST /api/auth/login
```

Текущий пользователь:

```text
GET /api/auth/me
```

Выход:

```text
POST /api/auth/logout
```

Защищённые API-маршруты используют middleware `requireAuth`.

Если пользователь не авторизован:

```text
401 Unauthorized
```

Если пользователь пытается получить образец другой лаборатории:

```text
403 Forbidden
```

Проверка прав выполняется на backend, поэтому доступ нельзя обойти изменением URL на frontend.

## 6. Работа с образцами

Получение списка:

```text
GET /api/samples
```

Поддерживаются:

* пагинация;
* фильтрация по статусу;
* сортировка по дате получения;
* сортировка по дате создания;
* сортировка по возрастанию и убыванию.

Параметры:

```text
page
limit
status
sort
order
```

Получение конкретного образца:

```text
GET /api/samples/:id
```

Frontend использует React Router для маршрутов:

```text
/login
/samples
/samples/:id
```

Формы и API-ответы дополнительно проверяются через Zod.

## 7. Тесты

Добавлены API-тесты с Vitest и Supertest.

Проверяются:

1. Неавторизованный доступ к `/api/samples` → `401`.
2. Авторизованный запрос администратора → `200`.
3. Некорректный ID образца → `400`.
4. Доступ пользователя к образцу другой лаборатории → `403`.

Запуск:

```bash
cd server
npm test
```

## 8. Основные решения

### PostgreSQL + Drizzle

PostgreSQL подходит для реляционной структуры данных: пользователи, лаборатории и образцы.

Drizzle выбран как ORM, потому что позволяет работать с базой через TypeScript и сохранять запросы достаточно близкими к SQL.

### Серверные сессии

Для этого приложения серверные сессии проще JWT. Сервер хранит состояние сессии и может уничтожить её при выходе пользователя.

### Zod

Zod используется для валидации данных на frontend и backend.
