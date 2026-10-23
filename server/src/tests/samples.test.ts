import { describe, expect, it } from 'vitest';

import { loginAs } from './helpers';

describe('Samples API list', () => {
    it('returns code, laboratory name and status counts', async () => {
        const agent = await loginAs('admin');

        const response = await agent.get(
            '/api/samples?limit=5',
        );

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(5);

        const sample = response.body.data[0];

        expect(sample.code).toMatch(
            /^S-\d{4}-\d{4,5}$/,
        );
        expect(typeof sample.laboratoryName).toBe(
            'string',
        );

        const {
            received,
            processing,
            completed,
        } = response.body.counts;

        expect(
            received + processing + completed,
        ).toBe(response.body.total);

        expect(received).toBeGreaterThan(0);
        expect(processing).toBeGreaterThan(0);
        expect(completed).toBeGreaterThan(0);
    });

    it('searches by patient name', async () => {
        const agent = await loginAs('admin');

        const response = await agent.get(
            `/api/samples?search=${encodeURIComponent('Иван')}&limit=100`,
        );

        expect(response.status).toBe(200);
        expect(
            response.body.data.length,
        ).toBeGreaterThan(0);

        for (const sample of response.body.data) {
            const haystack =
                `${sample.patientName} ${sample.code}`.toLowerCase();

            expect(haystack).toContain('иван');
        }
    });

    it('searches by sample code', async () => {
        const agent = await loginAs('admin');
        const year = new Date().getFullYear();
        const code = `S-${year}-0042`;

        const response = await agent.get(
            `/api/samples?search=${code}`,
        );

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].code).toBe(code);
    });

    it('keeps counts independent from the status filter', async () => {
        const agent = await loginAs('admin');

        const all = await agent.get(
            '/api/samples?limit=1',
        );
        const filtered = await agent.get(
            '/api/samples?limit=1&status=received',
        );

        expect(filtered.status).toBe(200);
        expect(filtered.body.total).toBe(
            filtered.body.counts.received,
        );
        expect(filtered.body.counts).toEqual(
            all.body.counts,
        );
    });

    it('restricts search results to the user laboratory', async () => {
        const agent = await loginAs('labuser1');

        const response = await agent.get(
            '/api/samples?search=S-&limit=100',
        );

        expect(response.status).toBe(200);
        expect(
            response.body.data.length,
        ).toBeGreaterThan(0);

        for (const sample of response.body.data) {
            expect(sample.laboratoryName).toBe(
                'Гематология',
            );
        }
    });

    it('returns 400 for a too long search query', async () => {
        const agent = await loginAs('admin');

        const response = await agent.get(
            `/api/samples?search=${'a'.repeat(101)}`,
        );

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
            'Некорректные параметры запроса',
        );
    });

    it('returns empty medical fields', async () => {
        const agent = await loginAs('admin');

        const response = await agent.get(
            '/api/samples?limit=1',
        );
        const sample = response.body.data[0];

        expect(sample.anamnesis).toBeNull();
        expect(sample.conclusion).toBeNull();
    });

    it('changes status of own sample and restores it', async () => {
        const agent = await loginAs('admin');

        const list = await agent.get(
            '/api/samples?limit=1',
        );
        const sample = list.body.data[0];
        const target =
            sample.status === 'completed'
                ? 'processing'
                : 'completed';

        const updated = await agent
            .patch(`/api/samples/${sample.id}`)
            .send({ status: target });

        expect(updated.status).toBe(200);
        expect(updated.body.status).toBe(target);
        expect(updated.body.code).toBe(sample.code);

        // Возвращаем исходный статус, чтобы не менять данные
        const restored = await agent
            .patch(`/api/samples/${sample.id}`)
            .send({ status: sample.status });

        expect(restored.body.status).toBe(sample.status);
    });

    it('forbids changing status of another laboratory sample', async () => {
        const other = await loginAs('labuser2');
        const list = await other.get('/api/samples?limit=1');
        const foreignId = list.body.data[0].id;

        const agent = await loginAs('labuser1');

        const response = await agent
            .patch(`/api/samples/${foreignId}`)
            .send({ status: 'completed' });

        expect(response.status).toBe(403);
        expect(response.body.message).toBe(
            'Доступ запрещён',
        );
    });

    it('saves anamnesis and conclusion, then clears them', async () => {
        const agent = await loginAs('labuser1');

        const list = await agent.get(
            '/api/samples?limit=1',
        );
        const sample = list.body.data[0];

        const saved = await agent
            .patch(`/api/samples/${sample.id}`)
            .send({
                anamnesis:
                    'Аллергия на пенициллин.',
                conclusion:
                    'Рекомендован повторный анализ через месяц.',
            });

        expect(saved.status).toBe(200);
        expect(saved.body.anamnesis).toBe(
            'Аллергия на пенициллин.',
        );
        expect(saved.body.conclusion).toBe(
            'Рекомендован повторный анализ через месяц.',
        );

        const cleared = await agent
            .patch(`/api/samples/${sample.id}`)
            .send({
                anamnesis: null,
                conclusion: null,
            });

        expect(cleared.body.anamnesis).toBeNull();
        expect(cleared.body.conclusion).toBeNull();
    });

    it('rejects empty update payload', async () => {
        const agent = await loginAs('admin');
        const list = await agent.get('/api/samples?limit=1');

        const response = await agent
            .patch(
                `/api/samples/${list.body.data[0].id}`,
            )
            .send({});

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
            'Нет данных для обновления',
        );
    });

    it('rejects invalid status', async () => {
        const agent = await loginAs('admin');
        const list = await agent.get('/api/samples?limit=1');

        const response = await agent
            .patch(
                `/api/samples/${list.body.data[0].id}`,
            )
            .send({ status: 'lost' });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
            'Некорректные данные образца',
        );
    });
});
