import {
    useCallback,
    useEffect,
    useState,
} from 'react';

import {
    getCurrentUser,
    login,
    logout,
} from './api/auth';

import AppRouterProvider from './providers/AppRouterProvider';

import type { User } from './types/sample';

// fetch падает с TypeError, когда сервер недоступен или запрос заблокирован CORS
function toErrorMessage(
    error: unknown,
    fallback: string,
): string {
    if (error instanceof TypeError) {
        return 'Не удалось связаться с сервером. Проверьте, что backend запущен.';
    }

    return error instanceof Error
        ? error.message
        : fallback;
}

function App() {
    const [user, setUser] =
        useState<User | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState('');

    useEffect(() => {
        getCurrentUser()
            .then((currentUser) => {
                setUser(currentUser);
            })
            .catch((error) => {
                setError(
                    toErrorMessage(
                        error,
                        'Не удалось подключиться к серверу',
                    ),
                );
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const handleLogin = useCallback(
        async (
            username: string,
            password: string,
        ) => {
            try {
                const currentUser =
                    await login(
                        username,
                        password,
                    );

                setUser(currentUser);
                setError('');
            } catch (error) {
                setError(
                    toErrorMessage(error, 'Ошибка входа'),
                );
            }
        },
        [],
    );

    const handleLogout = useCallback(
        async () => {
            try {
                await logout();
            } finally {
                setUser(null);
            }
        },
        [],
    );

    const handleSessionExpired =
        useCallback(() => {
            setUser(null);
            setError(
                'Сессия истекла. Войдите снова.',
            );
        }, []);

    // После правки профиля обновляем пользователя во всём приложении
    const handleUserChange = useCallback(
        (nextUser: User) => {
            setUser(nextUser);
            setError('');
        },
        [],
    );

    if (loading) {
        return (
            <div className="page">
                <p>Загрузка...</p>
            </div>
        );
    }

    return (
        <AppRouterProvider
            user={user}
            error={error}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onUserChange={handleUserChange}
            onSessionExpired={
                handleSessionExpired
            }
        />
    );
}

export default App;