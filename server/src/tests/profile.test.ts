import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import {
    afterAll,
    beforeAll,
    describe,
    expect,
    it,
} from 'vitest';

import app from '../app';
import { db } from '../db';
import { users } from '../db/schema';

// Отдельный пользователь, чтобы тест смены пароля
// не мешал остальным наборам тестов
const TEST_USERNAME = 'profile_test_user';
const TEST_PASSWORD = 'ProfileTest1';
const NEW_PASSWORD = 'ProfileTest2';

async function login(password: string) {
    const agent = request.agent(app);

    const response = await agent
        .post('/api/auth/login')
        .send({
            username: TEST_USERNAME,
            password,
        });

    return { agent, response };
}

beforeAll(async () => {
    await db
        .delete(users)
        .where(eq(users.username, TEST_USERNAME));

    await db.insert(users).values({
        username: TEST_USERNAME,
        passwordHash: await bcrypt.hash(
            TEST_PASSWORD,
            10,
        ),
        role: 'user',
        laboratoryId: null,
        fullName: 'Тестовый Пользователь',
        email: `${TEST_USERNAME}@labtrack.local`,
    });
});

afterAll(async () => {
    await db
        .delete(users)
        .where(eq(users.username, TEST_USERNAME));
});

describe('Profile API', () => {
    it('returns profile fields in /auth/me', async () => {
        const { agent, response } = await login(TEST_PASSWORD);

        expect(response.status).toBe(200);

        const me = await agent.get('/api/auth/me');

        expect(me.status).toBe(200);
        expect(me.body.user).toMatchObject({
            username: TEST_USERNAME,
            fullName: 'Тестовый Пользователь',
            email: `${TEST_USERNAME}@labtrack.local`,
            laboratoryName: null,
        });
        expect(
            typeof me.body.user.createdAt,
        ).toBe('string');
    });

    it('updates name and email', async () => {
        const { agent } = await login(TEST_PASSWORD);

        const response = await agent
            .patch('/api/auth/me')
            .send({
                fullName: 'Обновлённое Имя',
                email: 'updated@labtrack.local',
            });

        expect(response.status).toBe(200);
        expect(response.body.user.fullName).toBe(
            'Обновлённое Имя',
        );
        expect(response.body.user.email).toBe(
            'updated@labtrack.local',
        );
    });

    it('clears email when an empty string is sent', async () => {
        const { agent } = await login(TEST_PASSWORD);

        const response = await agent
            .patch('/api/auth/me')
            .send({
                fullName: 'Обновлённое Имя',
                email: '',
            });

        expect(response.status).toBe(200);
        expect(response.body.user.email).toBeNull();
    });

    it('rejects invalid email', async () => {
        const { agent } = await login(TEST_PASSWORD);

        const response = await agent
            .patch('/api/auth/me')
            .send({
                fullName: 'Обновлённое Имя',
                email: 'not-an-email',
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
            'Некорректные данные профиля',
        );
    });

    it('rejects email taken by another user', async () => {
        const { agent } = await login(TEST_PASSWORD);

        const response = await agent
            .patch('/api/auth/me')
            .send({
                fullName: 'Обновлённое Имя',
                email: 'o.smirnova@labtrack.local',
            });

        expect(response.status).toBe(409);
        expect(response.body.message).toBe(
            'Этот email уже используется',
        );
    });

    it('rejects wrong current password', async () => {
        const { agent } = await login(TEST_PASSWORD);

        const response = await agent
            .post('/api/auth/password')
            .send({
                currentPassword: 'WrongPassword1',
                newPassword: NEW_PASSWORD,
            });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe(
            'Неверный текущий пароль',
        );
    });

    it('changes password and accepts the new one', async () => {
        const { agent } = await login(TEST_PASSWORD);

        const changed = await agent
            .post('/api/auth/password')
            .send({
                currentPassword: TEST_PASSWORD,
                newPassword: NEW_PASSWORD,
            });

        expect(changed.status).toBe(200);

        const withOld = await login(TEST_PASSWORD);
        expect(withOld.response.status).toBe(401);

        const withNew = await login(NEW_PASSWORD);
        expect(withNew.response.status).toBe(200);
    });
});
