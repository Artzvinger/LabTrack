import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { passwordChangeSchema } from '../schemas/profile';

import type { z } from 'zod';

type PasswordFormData = z.infer<
    typeof passwordChangeSchema
>;

type PasswordFormProps = {
    onSubmit: (
        currentPassword: string,
        newPassword: string,
    ) => Promise<void>;
};

function PasswordForm({
                          onSubmit,
                      }: PasswordFormProps) {
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    const {
        register,
        handleSubmit,
        reset,
        formState: {
            errors,
            isSubmitting,
        },
    } = useForm<PasswordFormData>({
        resolver: zodResolver(
            passwordChangeSchema,
        ),
    });

    async function submit(data: PasswordFormData) {
        setError('');
        setSaved(false);

        try {
            await onSubmit(
                data.currentPassword,
                data.newPassword,
            );

            reset();
            setSaved(true);
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : 'Не удалось изменить пароль',
            );
        }
    }

    return (
        <form
            onSubmit={handleSubmit(submit)}
            noValidate
        >
            <div className="form-field">
                <label htmlFor="currentPassword">
                    Текущий пароль
                </label>

                <input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    {...register(
                        'currentPassword',
                    )}
                />

                {errors.currentPassword && (
                    <p className="error">
                        {
                            errors.currentPassword
                                .message
                        }
                    </p>
                )}
            </div>

            <div className="form-field">
                <label htmlFor="newPassword">
                    Новый пароль
                </label>

                <input
                    id="newPassword"
                    type="password"
                    autoComplete="new-password"
                    {...register('newPassword')}
                />

                {errors.newPassword && (
                    <p className="error">
                        {errors.newPassword.message}
                    </p>
                )}
            </div>

            <div className="form-field">
                <label htmlFor="confirmPassword">
                    Повторите новый пароль
                </label>

                <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    {...register(
                        'confirmPassword',
                    )}
                />

                {errors.confirmPassword && (
                    <p className="error">
                        {
                            errors.confirmPassword
                                .message
                        }
                    </p>
                )}
            </div>

            {error && (
                <p className="error">{error}</p>
            )}

            {saved && (
                <p className="form-success">
                    Пароль обновлён
                </p>
            )}

            <div className="form-actions">
                <button
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting
                        ? 'Сохранение…'
                        : 'Изменить пароль'}
                </button>
            </div>
        </form>
    );
}

export default PasswordForm;
