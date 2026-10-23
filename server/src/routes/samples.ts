import { Router } from 'express';
import {
    and,
    asc,
    count,
    desc,
    eq,
    ilike,
    or,
} from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../db';
import {
    laboratories,
    samples,
    users,
} from '../db/schema';
import { requireAuth } from '../middleware/authCheck';
import { parse } from '../schemas/parse';

const router = Router();

const sampleStatusSchema = z.enum([
    'received',
    'processing',
    'completed',
]);

// Проверяем параметры для списка образцов
const samplesQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: sampleStatusSchema.optional(),
    search: z.string().trim().max(100).optional(),
    sort: z
        .enum(['receivedAt', 'createdAt'])
        .default('receivedAt'),
    order: z
        .enum(['asc', 'desc'])
        .default('desc'),
});

type StatusCounts = Record<
    z.infer<typeof sampleStatusSchema>,
    number
>;

const sampleUpdateSchema = z.object({
    status: sampleStatusSchema.optional(),
    anamnesis: z.string().max(2000).nullable().optional(),
    conclusion: z.string().max(2000).nullable().optional(),
});

// Поля образца вместе с названием лаборатории
const sampleFields = {
    id: samples.id,
    code: samples.code,
    patientName: samples.patientName,
    anamnesis: samples.anamnesis,
    conclusion: samples.conclusion,
    status: samples.status,
    receivedAt: samples.receivedAt,
    laboratoryId: samples.laboratoryId,
    laboratoryName: laboratories.name,
    createdAt: samples.createdAt,
};

// Экранируем спецсимволы LIKE, чтобы поиск не превращался в шаблон
function escapeLike(value: string): string {
    return value.replace(
        /[\\%_]/g,
        (char) => `\\${char}`,
    );
}

// Получаем список образцов
router.get('/', requireAuth, async (req, res) => {

    // Проверяем параметры из URL; ошибка уходит в общий обработчик
    const {
        page,
        limit,
        status,
        search,
        sort,
        order,
    } = parse(
        samplesQuerySchema,
        req.query,
        'Некорректные параметры запроса',
    );

    // Находим текущего пользователя по его сессии
    const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, req.session.userId!))
        .limit(1);

    const user = userResult[0];

    if (!user) {
        return res.status(401).json({
            message: 'Пользователь не найден',
        });
    }

    // Условия области видимости: лаборатория и поиск.
    // Статус в них не входит — он нужен только выборке,
    // а счётчики считаем по всей области.
    const scopeConditions: SQL[] = [];

    // Обычный пользователь видит только свою лабораторию
    if (user.role !== 'admin') {
        if (user.laboratoryId === null) {
            return res.status(403).json({
                message: 'Доступ запрещён',
            });
        }

        scopeConditions.push(
            eq(samples.laboratoryId, user.laboratoryId),
        );
    }

    // Поиск по ФИО пациента или номеру образца
    if (search) {
        const pattern = `%${escapeLike(search)}%`;

        const searchCondition = or(
            ilike(samples.patientName, pattern),
            ilike(samples.code, pattern),
        );

        if (searchCondition) {
            scopeConditions.push(searchCondition);
        }
    }

    const scopeCondition =
        scopeConditions.length > 0
            ? and(...scopeConditions)
            : undefined;

    // С учётом статуса — для самой выборки
    const whereCondition = status
        ? scopeCondition
            ? and(
                  scopeCondition,
                  eq(samples.status, status),
              )
            : eq(samples.status, status)
        : scopeCondition;

    // Выбираем поле для сортировки
    const sortColumn =
        sort === 'createdAt'
            ? samples.createdAt
            : samples.receivedAt;

    // Выбираем направление сортировки
    const orderBy =
        order === 'asc'
            ? asc(sortColumn)
            : desc(sortColumn);

    // Считаем сколько записей нужно пропустить
    const offset = (page - 1) * limit;

    // Выборка страницы, общее количество и разбивка по статусам
    const [data, totalResult, statusRows] =
        await Promise.all([
            db
                .select(sampleFields)
                .from(samples)
                .leftJoin(
                    laboratories,
                    eq(
                        samples.laboratoryId,
                        laboratories.id,
                    ),
                )
                .where(whereCondition)
                .orderBy(orderBy)
                .limit(limit)
                .offset(offset),
            db
                .select({ count: count() })
                .from(samples)
                .where(whereCondition),
            db
                .select({
                    status: samples.status,
                    count: count(),
                })
                .from(samples)
                .where(scopeCondition)
                .groupBy(samples.status),
        ]);

    const counts: StatusCounts = {
        received: 0,
        processing: 0,
        completed: 0,
    };

    for (const row of statusRows) {
        counts[row.status] = Number(row.count);
    }

    // Возвращаем образцы, пагинацию и счётчики для сводки
    return res.json({
        data,
        total: Number(totalResult[0].count),
        page,
        limit,
        counts,
    });
});

// Получаем один образец по ID
router.get('/:id', requireAuth, async (req, res) => {

    // Проверяем что ID является положительным числом
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({
            message: 'Некорректный номер образца',
        });
    }

    // Находим текущего пользователя
    const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, req.session.userId!))
        .limit(1);

    const user = userResult[0];

    if (!user) {
        return res.status(401).json({
            message: 'Пользователь не найден',
        });
    }

    // Находим образец в базе вместе с лабораторией
    const sampleResult = await db
        .select(sampleFields)
        .from(samples)
        .leftJoin(
            laboratories,
            eq(samples.laboratoryId, laboratories.id),
        )
        .where(eq(samples.id, id))
        .limit(1);

    const sample = sampleResult[0];

    if (!sample) {
        return res.status(404).json({
            message: 'Образец не найден',
        });
    }

    // Проверяем имеет ли пользователь доступ к этому образцу
    if (
        user.role !== 'admin' &&
        sample.laboratoryId !== user.laboratoryId
    ) {
        return res.status(403).json({
            message: 'Доступ запрещён',
        });
    }

    // Возвращаем найденный образец
    return res.json(sample);
});

// Меняем статус образца
router.patch('/:id', requireAuth, async (req, res) => {

    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({
            message: 'Некорректный номер образца',
        });
    }

    const data = parse(
        sampleUpdateSchema,
        req.body,
        'Некорректные данные образца',
    );

    // Собираем только переданные поля
    const patch: {
        status?: z.infer<typeof sampleStatusSchema>;
        anamnesis?: string | null;
        conclusion?: string | null;
    } = {};

    if (data.status !== undefined) {
        patch.status = data.status;
    }

    if (data.anamnesis !== undefined) {
        patch.anamnesis = data.anamnesis?.trim()
            ? data.anamnesis.trim()
            : null;
    }

    if (data.conclusion !== undefined) {
        patch.conclusion = data.conclusion?.trim()
            ? data.conclusion.trim()
            : null;
    }

    if (Object.keys(patch).length === 0) {
        return res.status(400).json({
            message: 'Нет данных для обновления',
        });
    }

    const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, req.session.userId!))
        .limit(1);

    const user = userResult[0];

    if (!user) {
        return res.status(401).json({
            message: 'Пользователь не найден',
        });
    }

    const existingResult = await db
        .select({
            laboratoryId: samples.laboratoryId,
        })
        .from(samples)
        .where(eq(samples.id, id))
        .limit(1);

    const existing = existingResult[0];

    if (!existing) {
        return res.status(404).json({
            message: 'Образец не найден',
        });
    }

    // Менять статус можно только в своей лаборатории
    if (
        user.role !== 'admin' &&
        existing.laboratoryId !== user.laboratoryId
    ) {
        return res.status(403).json({
            message: 'Доступ запрещён',
        });
    }

    await db
        .update(samples)
        .set(patch)
        .where(eq(samples.id, id));

    const updatedResult = await db
        .select(sampleFields)
        .from(samples)
        .leftJoin(
            laboratories,
            eq(samples.laboratoryId, laboratories.id),
        )
        .where(eq(samples.id, id))
        .limit(1);

    return res.json(updatedResult[0]);
});

export default router;
