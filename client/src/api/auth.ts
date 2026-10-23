import { userSchema } from '../schemas/sample';
import type { User } from '../types/sample';

import { API_URL } from './base';

import type { z } from 'zod';

type UserPayload = z.infer<typeof userSchema>;

export function toUser(data: UserPayload): User {
    return {
        id: data.id,
        username: data.username,
        role: data.role,
        laboratoryId: data.laboratoryId,
        laboratoryName: data.laboratoryName,
        fullName: data.fullName,
        email: data.email,
        createdAt: data.createdAt,
    };
}

export async function getCurrentUser(): Promise<User | null> {
    const response = await fetch(
        `${API_URL}/auth/me`,
        {
            credentials: 'include',
        },
    );

    if (!response.ok) {
        return null;
    }

    const data = await response.json();

    const result = userSchema.safeParse(data.user);

    if (!result.success) {
        throw new Error(
            'Сервер вернул некорректные данные пользователя',
        );
    }

    return toUser(result.data);
}

export async function login(
    username: string,
    password: string,
): Promise<User> {
    const response = await fetch(
        `${API_URL}/auth/login`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                username,
                password,
            }),
        },
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || 'Ошибка входа',
        );
    }

    const result = userSchema.safeParse(data.user);

    if (!result.success) {
        throw new Error(
            'Сервер вернул некорректные данные пользователя',
        );
    }

    return toUser(result.data);
}

export async function logout(): Promise<void> {
    const response = await fetch(
        `${API_URL}/auth/logout`,
        {
            method: 'POST',
            credentials: 'include',
        },
    );

    if (!response.ok) {
        throw new Error('Ошибка выхода');
    }
}
