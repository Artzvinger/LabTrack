import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { profileSchema } from '../schemas/profile';

import type { z } from 'zod';
import type { User } from '../types/sample';

type ProfileFormData = z.infer<typeof profileSchema>;

type ProfileFormProps = {
    user: User;
    onSubmit: (input: {
        fullName: string;
        email: string | null;
    }) => Promise<User>;
    onSaved: (user: User) => void;
};

function ProfileForm({
                         user,
                         onSubmit,
                         onSaved,
                     }: ProfileFormProps) {
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    const {
        register,
        handleSubmit,
        formState: {
            errors,
            isSubmitting,
        },
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            fullName: user.fullName ?? '',
            email: user.email ?? '',
        },
    });

    async function submit(data: ProfileFormData) {
        setError('');
        setSaved(false);

        try {
            const updated = await onSubmit({
                fullName: data.fullName,
                email: data.email || null,
            });

            onSaved(updated);
            setSaved(true);
        } catch (submitError) {
            setError(
                submitError instanceof Error
                    ? submitError.message
                    : 'Не удалось сохранить профиль',
            );
        }
    }

    return (
        <form
            onSubmit={handleSubmit(submit)}
            noValidate
        >
            <div className="form-field">
                <label htmlFor="fullName">
                    ФИО
                </label>

                <input
                    id="fullName"
                    autoComplete="name"
                    {...register('fullName')}
                />

                {errors.fullName && (
                    <p className="error">
                        {errors.fullName.message}
                    </p>
                )}
            </div>

            <div className="form-field">
                <label htmlFor="email">
                    Email
                </label>

                <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...register('email')}
                />

                {errors.email && (
                    <p className="error">
                        {errors.email.message}
                    </p>
                )}
            </div>

            {error && (
                <p className="error">{error}</p>
            )}

            {saved && (
                <p className="form-success">
                    Профиль сохранён
                </p>
            )}

            <div className="form-actions">
                <button
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting
                        ? 'Сохранение…'
                        : 'Сохранить'}
                </button>
            </div>
        </form>
    );
}

export default ProfileForm;
