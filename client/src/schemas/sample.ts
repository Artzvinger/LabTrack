import { z } from 'zod';

export const userSchema = z.object({
    id: z.number(),
    username: z.string(),
    role: z.string(),
    laboratoryId: z.number().nullable(),
    laboratoryName: z.string().nullable(),
    fullName: z.string().nullable(),
    email: z.string().nullable(),
    createdAt: z.string(),
});

export const sampleStatusSchema = z.enum([
    'received',
    'processing',
    'completed',
]);

export const sampleSchema = z.object({
    id: z.number(),
    code: z.string(),
    patientName: z.string(),
    anamnesis: z.string().nullable(),
    conclusion: z.string().nullable(),
    status: sampleStatusSchema,
    receivedAt: z.string(),
    laboratoryId: z.number(),
    laboratoryName: z.string().nullable(),
    createdAt: z.string(),
});

export const statusCountsSchema = z.object({
    received: z.number(),
    processing: z.number(),
    completed: z.number(),
});

export const samplesResponseSchema = z.object({
    data: z.array(sampleSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    counts: statusCountsSchema,
});

export const loginSchema = z.object({
    username: z.string().min(1, 'Введите логин'),
    password: z.string().min(1, 'Введите пароль'),
});
