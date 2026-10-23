import { userSchema } from '../schemas/sample';

import { toUser } from './auth';
import { API_URL } from './base';

import type { User } from '../types/sample';

type UpdateProfileInput = {
    fullName: string;
    email: string | null;
};

export async function updateProfile(
    input: UpdateProfileInput,
): Promise<User> {
    const response = await fetch(
        `${API_URL}/auth/me`,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(input),
        },
    );

    const data = await response.json();

    if (response.status === 401) {
        throw new Error('SESSION_EXPIRED');
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
                'Не удалось сохранить профиль',
        );
    }

    const result = userSchema.safeParse(data.user);

    if (!result.success) {
        throw new Error(
            'Сервер вернул некорректные данные профиля',
        );
    }

    return toUser(result.data);
}

export async function changePassword(
    currentPassword: string,
    newPassword: string,
): Promise<void> {
    const response = await fetch(
        `${API_URL}/auth/password`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                currentPassword,
                newPassword,
            }),
        },
    );

    const data = await response.json();

    if (response.status === 401) {
        throw new Error('SESSION_EXPIRED');
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
                'Не удалось изменить пароль',
        );
    }
}
