import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import { Pool } from 'pg';

import authRouter from './routes/auth';
import samplesRouter from './routes/samples';

import {
    errorHandler,
    notFoundHandler,
} from './middleware/errorHandler';

const app = express();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const PgSession = pgSession(session);

// Origины клиента: список из env (через запятую) плюс любые loopback-порты,
// чтобы приложение работало и на localhost:5173, и на 127.0.0.1:5174 и т.п.
const allowedOrigins = (
    process.env.CLIENT_ORIGINS ??
    'http://localhost:5173,http://127.0.0.1:5173'
)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const loopbackOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

console.log('CORS origins:', allowedOrigins.join(', '), '+ loopback');

app.use(
    cors({
        origin(origin, callback) {
            // Запросы без Origin (curl, серверные вызовы) не ограничиваем
            if (!origin) {
                callback(null, true);
                return;
            }

            const allowed =
                allowedOrigins.includes(origin) ||
                loopbackOrigin.test(origin);

            // false — заголовки CORS не выставляются, браузер блокирует ответ
            callback(null, allowed);
        },
        credentials: true,
    }),
);

app.use(express.json());

app.use(
    session({
        store: new PgSession({
            pool,
            tableName: 'user_sessions',
            createTableIfMissing: true,
        }),
        secret: process.env.SESSION_SECRET!,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            maxAge: 1000 * 60 * 60,
        },
    }),
);

app.use('/api/auth', authRouter);
app.use('/api/samples', samplesRouter);

app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
    });
});

// Неизвестный метод API отвечает JSON, а не HTML-страницей Express
app.use('/api', notFoundHandler);

// Обработчик ошибок обязан идти последним
app.use(errorHandler);

export default app;