import request from 'supertest';
import { expect } from 'vitest';

import app from '../app';

// Пароли демо-аккаунтов из server/src/db/seed.ts
export const passwords: Record<string, string> = {
    admin: 'Admin2026',
    labuser1: 'Hemato2026',
    labuser2: 'Immuno2026',
};

export async function loginAs(username: string) {
    const agent = request.agent(app);

    const response = await agent
        .post('/api/auth/login')
        .send({
            username,
            password: passwords[username],
        });

    expect(response.status).toBe(200);

    return agent;
}
