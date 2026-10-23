import { z } from 'zod';

// Профиль сотрудника: ФИО обязательно, email — нет
export const profileSchema = z.object({
    fullName: z
        .string()
        .trim()
        .min(2, 'Укажите ФИО')
        .max(150, 'Слишком длинное ФИО'),
    email: z
        .string()
        .trim()
        .max(150, 'Слишком длинный email')
        .refine(
            (value) =>
                value === '' ||
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                    value,
                ),
            'Некорректный email',
        ),
});

export const passwordChangeSchema = z
    .object({
        currentPassword: z
            .string()
            .min(1, 'Введите текущий пароль'),
        newPassword: z
            .string()
            .min(8, 'Минимум 8 символов')
            .max(72, 'Максимум 72 символа'),
        confirmPassword: z
            .string()
            .min(1, 'Повторите новый пароль'),
    })
    .refine(
        (data) =>
            data.newPassword === data.confirmPassword,
        {
            message: 'Пароли не совпадают',
            path: ['confirmPassword'],
        },
    );
