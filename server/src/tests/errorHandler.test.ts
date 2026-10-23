import express from 'express';
import request from 'supertest';
import {
    afterEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { HttpError } from '../errors/HttpError';
import {
    errorHandler,
    notFoundHandler,
} from '../middleware/errorHandler';

// Приложение-заглушка: проверяем сам обработчик, без базы данных
function createApp() {
    const app = express();

    app.use(express.json());

    app.get('/http-error', () => {
        throw new HttpError(403, 'Access denied', {
            field: 'laboratoryId',
        });
    });

    app.get('/boom', () => {
        throw new Error(
            'connect ECONNREFUSED 127.0.0.1:5432',
        );
    });

    app.post('/echo', (_req, res) => {
        res.json({ ok: true });
    });

    app.use('/api', notFoundHandler);
    app.use(errorHandler);

    return app;
}

describe('errorHandler', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns the status and details of an HttpError', async () => {
        const response = await request(createApp()).get(
            '/http-error',
        );

        expect(response.status).toBe(403);
        expect(
            response.headers['content-type'],
        ).toContain('application/json');
        expect(response.body).toEqual({
            message: 'Access denied',
            errors: { field: 'laboratoryId' },
        });
    });

    it('returns 400 for a malformed JSON body', async () => {
        const response = await request(createApp())
            .post('/echo')
            .set('Content-Type', 'application/json')
            .send('{"broken": ');

        expect(response.status).toBe(400);
        expect(
            response.headers['content-type'],
        ).toContain('application/json');
        expect(response.body).toEqual({
            message: 'Некорректный JSON',
        });
    });

    it('hides internal error details behind a generic 500', async () => {
        vi.spyOn(console, 'error').mockImplementation(
            () => {},
        );

        const response = await request(createApp()).get(
            '/boom',
        );

        expect(response.status).toBe(500);
        expect(response.body).toEqual({
            message: 'Внутренняя ошибка сервера',
        });
        expect(JSON.stringify(response.body)).not.toContain(
            'ECONNREFUSED',
        );
    });

    it('returns 404 as JSON for an unknown API route', async () => {
        const response = await request(createApp()).get(
            '/api/unknown',
        );

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            message: 'Не найдено',
        });
    });
});
