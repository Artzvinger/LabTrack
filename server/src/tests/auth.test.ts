import request from 'supertest';
import { describe, expect, it } from 'vitest';

import app from '../app';
import { loginAs } from './helpers';

describe('Samples API authentication', () => {
    it('returns 401 for unauthenticated request', async () => {
        const response = await request(app).get('/api/samples');

        expect(response.status).toBe(401);
        expect(response.body.message).toBe(
            'Требуется авторизация',
        );
    });
});

describe('Samples API success response', () => {
    it('returns 200 for authenticated admin request', async () => {
        const agent = await loginAs('admin');

        const response = await agent.get('/api/samples');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('total');
        expect(response.body).toHaveProperty('page', 1);
        expect(response.body).toHaveProperty('limit', 20);
        expect(Array.isArray(response.body.data)).toBe(true);
    });
});

describe('Samples API validation', () => {
    it('returns 400 for invalid sample id', async () => {
        const agent = await loginAs('admin');

        const response = await agent.get('/api/samples/abc');

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
            'Некорректный номер образца',
        );
    });
});

describe('Samples API permissions', () => {
    it('returns 403 when user tries to access sample from another laboratory', async () => {
        const agent = await loginAs('labuser1');

        const response = await agent.get('/api/samples/1');

        expect(response.status).toBe(403);
        expect(response.body.message).toBe(
            'Доступ запрещён',
        );
    });

    it('shows each laboratory user only samples of their own laboratory', async () => {
        const userA = await loginAs('labuser1');
        const userB = await loginAs('labuser2');

        const meA = await userA.get('/api/auth/me');
        const meB = await userB.get('/api/auth/me');

        const laboratoryA = meA.body.user.laboratoryId;
        const laboratoryB = meB.body.user.laboratoryId;

        expect(laboratoryA).not.toBe(laboratoryB);

        const listA = await userA.get('/api/samples?limit=50');
        const listB = await userB.get('/api/samples?limit=50');

        expect(listA.status).toBe(200);
        expect(listB.status).toBe(200);
        expect(listA.body.data.length).toBeGreaterThan(0);
        expect(listB.body.data.length).toBeGreaterThan(0);

        expect(
            listA.body.data.every(
                (sample: { laboratoryId: number }) =>
                    sample.laboratoryId === laboratoryA,
            ),
        ).toBe(true);

        expect(
            listB.body.data.every(
                (sample: { laboratoryId: number }) =>
                    sample.laboratoryId === laboratoryB,
            ),
        ).toBe(true);

        const idsB = new Set(
            listB.body.data.map(
                (sample: { id: number }) => sample.id,
            ),
        );

        expect(
            listA.body.data.some(
                (sample: { id: number }) =>
                    idsB.has(sample.id),
            ),
        ).toBe(false);

        // В сиде по 200 образцов на каждую лабораторию
        expect(listA.body.total).toBe(200);
        expect(listB.body.total).toBe(200);
    });
});
