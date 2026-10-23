import { zodResolver } from '@hookform/resolvers/zod';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';

import { loginSchema } from '../schemas/sample';

import type { z } from 'zod';

type LoginFormData = z.infer<typeof loginSchema>;

type LoginFormProps = {
    onLogin: (
        username: string,
        password: string,
    ) => Promise<void>;
    error: string;
};

// Демо-аккаунты из server/src/db/seed.ts.
// Нужны, чтобы стенд можно было проверить, не открывая README.
const demoAccounts = [
    {
        role: 'Администратор',
        username: 'admin',
        password: 'Admin2026',
    },
    {
        role: 'Гематология',
        username: 'labuser1',
        password: 'Hemato2026',
    },
    {
        role: 'Иммунология',
        username: 'labuser2',
        password: 'Immuno2026',
    },
] as const;

function LoginForm({
                       onLogin,
                       error,
                   }: LoginFormProps) {
    const submitRef =
        useRef<HTMLButtonElement>(null);

    const {
        register,
        handleSubmit,
        setValue,
        formState: {
            errors,
            isSubmitting,
        },
    } = useForm<LoginFormData>({
        resolver: zodResolver(
            loginSchema,
        ),
    });

    async function onSubmit(
        data: LoginFormData,
    ) {
        await onLogin(
            data.username,
            data.password,
        );
    }

    function fillDemoAccount(
        username: string,
        password: string,
    ) {
        setValue('username', username, {
            shouldValidate: true,
        });

        setValue('password', password, {
            shouldValidate: true,
        });

        submitRef.current?.focus();
    }

    return (
        <div className="login">
            <div className="login-panel">
                <form
                    className="login-form"
                    onSubmit={handleSubmit(
                        onSubmit,
                    )}
                >
                    <h1>Вход</h1>

                    <div className="form-field">
                        <label htmlFor="username">
                            Логин
                        </label>

                        <input
                            id="username"
                            autoComplete="username"
                            {...register(
                                'username',
                            )}
                        />

                        {errors.username && (
                            <p className="error">
                                {
                                    errors
                                        .username
                                        .message
                                }
                            </p>
                        )}
                    </div>

                    <div className="form-field">
                        <label htmlFor="password">
                            Пароль
                        </label>

                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            {...register(
                                'password',
                            )}
                        />

                        {errors.password && (
                            <p className="error">
                                {
                                    errors
                                        .password
                                        .message
                                }
                            </p>
                        )}
                    </div>

                    {error && (
                        <p className="error">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        ref={submitRef}
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? 'Вход…'
                            : 'Войти'}
                    </button>
                </form>

                <aside
                    className="demo-accounts"
                    aria-labelledby="demo-accounts-title"
                >
                    <h2 id="demo-accounts-title">
                        Демо-доступ
                    </h2>

                    <p>
                        Нажмите на строку — логин и
                        пароль подставятся в форму.
                    </p>

                    <ul>
                        {demoAccounts.map(
                            (account) => (
                                <li
                                    key={
                                        account.username
                                    }
                                >
                                    <button
                                        type="button"
                                        className="demo-account"
                                        aria-label={`Подставить логин ${account.username}`}
                                        onClick={() =>
                                            fillDemoAccount(
                                                account.username,
                                                account.password,
                                            )
                                        }
                                    >
                                        <span className="demo-account-role">
                                            {
                                                account.role
                                            }
                                        </span>

                                        <span className="demo-account-credentials">
                                            <span>
                                                {
                                                    account.username
                                                }
                                            </span>

                                            <span>
                                                {
                                                    account.password
                                                }
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            ),
                        )}
                    </ul>
                </aside>
            </div>
        </div>
    );
}

export default LoginForm;
