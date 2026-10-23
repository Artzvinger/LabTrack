import { Router } from 'express';
import bcrypt from 'bcrypt';
import { and, eq, ne } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../db';
import {
    laboratories,
    users,
} from '../db/schema';
import { parse } from '../schemas/parse';

const router = Router();

// Поля пользователя, которые можно отдавать клиенту
const userFields = {
    id: users.id,
    username: users.username,
    role: users.role,
    laboratoryId: users.laboratoryId,
    laboratoryName: laboratories.name,
    fullName: users.fullName,
    email: users.email,
    createdAt: users.createdAt,
};

const loginSchema = z.object({
    username: z.string().trim().min(1),
    password: z.string().min(1),
});

const profileSchema = z.object({
    fullName: z.string().trim().min(2).max(150),
    email: z
        .union([z.email().max(150), z.literal('')])
        .nullable()
        .transform((value) => (value ? value : null)),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(72),
});

type UserWithLab = {
    id: number;
    username: string;
    role: string;
    laboratoryId: number | null;
    laboratoryName: string | null;
    fullName: string | null;
    email: string | null;
    createdAt: Date;
};

function toPayload(user: UserWithLab) {
    return {
        id: user.id,
        username: user.username,
        role: user.role,
        laboratoryId: user.laboratoryId,
        laboratoryName: user.laboratoryName,
        fullName: user.fullName,
        email: user.email,
        createdAt: user.createdAt,
    };
}

async function findUser(id: number) {
    const result = await db
        .select({
            ...userFields,
            passwordHash: users.passwordHash,
        })
        .from(users)
        .leftJoin(
            laboratories,
            eq(users.laboratoryId, laboratories.id),
        )
        .where(eq(users.id, id))
        .limit(1);

    return result[0] ?? null;
}

async function findUserByUsername(username: string) {
    const result = await db
        .select({
            ...userFields,
            passwordHash: users.passwordHash,
        })
        .from(users)
        .leftJoin(
            laboratories,
            eq(users.laboratoryId, laboratories.id),
        )
        .where(eq(users.username, username))
        .limit(1);

    return result[0] ?? null;
}

router.post('/login', async (req, res) => {
    const { username, password } = parse(
        loginSchema,
        req.body,
        'Укажите логин и пароль',
    );

    const user = await findUserByUsername(username);

    const passwordValid =
        user !== null &&
        (await bcrypt.compare(
            password,
            user.passwordHash,
        ));

    if (!user || !passwordValid) {
        return res.status(401).json({
            message: 'Неверный логин или пароль',
        });
    }

    req.session.userId = user.id;

    return res.json({
        user: toPayload(user),
    });
});

router.get('/me', async (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({
            message: 'Требуется авторизация',
        });
    }

    const user = await findUser(userId);

    if (!user) {
        req.session.destroy(() => {});

        return res.status(401).json({
            message: 'Требуется авторизация',
        });
    }

    return res.json({
        user: toPayload(user),
    });
});

// Редактирование личных данных: ФИО и email
router.patch('/me', async (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({
            message: 'Требуется авторизация',
        });
    }

    const data = parse(
        profileSchema,
        req.body,
        'Некорректные данные профиля',
    );

    if (data.email) {
        const taken = await db
            .select({ id: users.id })
            .from(users)
            .where(
                and(
                    eq(users.email, data.email),
                    ne(users.id, userId),
                ),
            )
            .limit(1);

        if (taken.length > 0) {
            return res.status(409).json({
                message: 'Этот email уже используется',
            });
        }
    }

    await db
        .update(users)
        .set({
            fullName: data.fullName,
            email: data.email,
        })
        .where(eq(users.id, userId));

    const updated = await findUser(userId);

    if (!updated) {
        return res.status(404).json({
            message: 'Пользователь не найден',
        });
    }

    return res.json({
        user: toPayload(updated),
    });
});

// Смена пароля
router.post('/password', async (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({
            message: 'Требуется авторизация',
        });
    }

    const data = parse(
        passwordSchema,
        req.body,
        'Некорректные данные пароля',
    );

    if (data.newPassword === data.currentPassword) {
        return res.status(400).json({
            message:
                'Новый пароль должен отличаться от текущего',
        });
    }

    const user = await findUser(userId);

    if (!user) {
        return res.status(401).json({
            message: 'Требуется авторизация',
        });
    }

    const currentValid = await bcrypt.compare(
        data.currentPassword,
        user.passwordHash,
    );

    if (!currentValid) {
        return res.status(400).json({
            message: 'Неверный текущий пароль',
        });
    }

    const passwordHash = await bcrypt.hash(
        data.newPassword,
        10,
    );

    await db
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, userId));

    return res.json({
        message: 'Пароль обновлён',
    });
});

router.post('/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({
                message: 'Не удалось выйти',
            });
        }

        res.clearCookie('connect.sid');

        return res.json({
            message: 'Выход выполнен',
        });
    });
});

export default router;
