import {
    useEffect,
    useState,
} from 'react';

import { Link } from 'react-router';

import {
    changePassword,
    updateProfile,
} from '../api/profile';
import { getSamples } from '../api/samples';

import PasswordForm from '../components/PasswordForm';
import ProfileForm from '../components/ProfileForm';

import {
    formatDateTime,
    formatNumber,
} from '../lib/format';
import { statusLabels } from '../lib/status';

import type {
    StatusCounts,
    User,
} from '../types/sample';

type ProfilePageProps = {
    user: User;
    onUserChange: (user: User) => void;
    onLogout: () => Promise<void>;
    onSessionExpired: () => void;
};

const EMPTY_COUNTS: StatusCounts = {
    received: 0,
    processing: 0,
    completed: 0,
};

function ProfilePage({
                         user,
                         onUserChange,
                         onLogout,
                         onSessionExpired,
                     }: ProfilePageProps) {
    const [counts, setCounts] =
        useState<StatusCounts>(EMPTY_COUNTS);

    const [total, setTotal] =
        useState(0);

    const [summaryError, setSummaryError] =
        useState(false);

    useEffect(() => {
        async function loadSummary() {
            try {
                const result = await getSamples({
                    page: 1,
                    limit: 1,
                    status: '',
                    search: '',
                    sort: 'receivedAt',
                    order: 'desc',
                });

                setCounts(result.counts);
                setTotal(result.total);
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.message ===
                        'SESSION_EXPIRED'
                ) {
                    onSessionExpired();
                    return;
                }

                setSummaryError(true);
            }
        }

        loadSummary();
    }, [onSessionExpired]);

    async function handleProfileSubmit(input: {
        fullName: string;
        email: string | null;
    }): Promise<User> {
        try {
            return await updateProfile(input);
        } catch (error) {
            if (
                error instanceof Error &&
                error.message === 'SESSION_EXPIRED'
            ) {
                onSessionExpired();
            }

            throw error;
        }
    }

    async function handlePasswordSubmit(
        currentPassword: string,
        newPassword: string,
    ) {
        try {
            await changePassword(
                currentPassword,
                newPassword,
            );
        } catch (error) {
            if (
                error instanceof Error &&
                error.message === 'SESSION_EXPIRED'
            ) {
                onSessionExpired();
            }

            throw error;
        }
    }

    const roleLabel =
        user.role === 'admin'
            ? 'Администратор'
            : 'Пользователь лаборатории';

    const laboratoryLabel =
        user.laboratoryName ?? 'Все лаборатории';

    return (
        <div className="page">
            <div className="container">
                <div className="header">
                    <div>
                        <h1>Личный кабинет</h1>

                        <p>
                            {roleLabel}
                            {' · '}
                            {laboratoryLabel}
                        </p>
                    </div>

                    <div className="header-actions">
                        <Link
                            to="/samples"
                            className="button"
                        >
                            К образцам
                        </Link>

                        <button onClick={onLogout}>
                            Выйти
                        </button>
                    </div>
                </div>

                <div className="profile-grid">
                    <section className="profile-card">
                        <h2>Профиль</h2>

                        <dl className="profile-fields">
                            <div>
                                <dt>Логин</dt>
                                <dd>
                                    {user.username}
                                </dd>
                            </div>

                            <div>
                                <dt>ФИО</dt>
                                <dd>
                                    {user.fullName ?? '—'}
                                </dd>
                            </div>

                            <div>
                                <dt>Email</dt>
                                <dd>
                                    {user.email ?? '—'}
                                </dd>
                            </div>

                            <div>
                                <dt>Роль</dt>
                                <dd>{roleLabel}</dd>
                            </div>

                            <div>
                                <dt>Лаборатория</dt>
                                <dd>
                                    {laboratoryLabel}
                                </dd>
                            </div>

                            <div>
                                <dt>Аккаунт создан</dt>
                                <dd>
                                    {formatDateTime(
                                        user.createdAt,
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    <section className="profile-card">
                        <h2>Данные сотрудника</h2>

                        <ProfileForm
                            user={user}
                            onSubmit={
                                handleProfileSubmit
                            }
                            onSaved={onUserChange}
                        />
                    </section>

                    <section className="profile-card">
                        <h2>Смена пароля</h2>

                        <PasswordForm
                            onSubmit={
                                handlePasswordSubmit
                            }
                        />
                    </section>

                    <section className="profile-card">
                        <h2>Доступные образцы</h2>

                        {summaryError ? (
                            <p>
                                Не удалось загрузить
                                сводку.
                            </p>
                        ) : (
                            <dl className="profile-fields">
                                <div>
                                    <dt>
                                        {
                                            statusLabels.received
                                        }
                                    </dt>
                                    <dd>
                                        {formatNumber(
                                            counts.received,
                                        )}
                                    </dd>
                                </div>

                                <div>
                                    <dt>
                                        {
                                            statusLabels.processing
                                        }
                                    </dt>
                                    <dd>
                                        {formatNumber(
                                            counts.processing,
                                        )}
                                    </dd>
                                </div>

                                <div>
                                    <dt>
                                        {
                                            statusLabels.completed
                                        }
                                    </dt>
                                    <dd>
                                        {formatNumber(
                                            counts.completed,
                                        )}
                                    </dd>
                                </div>

                                <div>
                                    <dt>Всего</dt>
                                    <dd>
                                        {formatNumber(
                                            total,
                                        )}
                                    </dd>
                                </div>
                            </dl>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;
