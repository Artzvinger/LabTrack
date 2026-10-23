import {
    useEffect,
    useState,
} from 'react';

import {
    Link,
    useNavigate,
} from 'react-router';

import { getSamples } from '../api/samples';

import { formatNumber } from '../lib/format';

import Pagination from '../components/Pagination';
import SamplesFilters from '../components/SamplesFilters';
import SamplesStats from '../components/SamplesStats';
import SamplesTable from '../components/SamplesTable';

import type {
    User,
    Sample,
    StatusCounts,
} from '../types/sample';

type SamplesPageProps = {
    user: User;
    onLogout: () => Promise<void>;
    onSessionExpired: () => void;
};

const EMPTY_COUNTS: StatusCounts = {
    received: 0,
    processing: 0,
    completed: 0,
};

function SamplesPage({
                         user,
                         onLogout,
                         onSessionExpired,
                     }: SamplesPageProps) {
    const navigate =
        useNavigate();

    const [samples, setSamples] =
        useState<Sample[]>([]);

    const [samplesLoading, setSamplesLoading] =
        useState(false);

    const [samplesError, setSamplesError] =
        useState('');

    const [page, setPage] =
        useState(1);

    const [total, setTotal] =
        useState(0);

    const [counts, setCounts] =
        useState<StatusCounts>(
            EMPTY_COUNTS,
        );

    const [searchInput, setSearchInput] =
        useState('');

    const [search, setSearch] =
        useState('');

    const [status, setStatus] =
        useState('');

    const [sort, setSort] =
        useState('receivedAt');

    const [order, setOrder] =
        useState('desc');

    const limit = 10;

    // Ввод поиска применяем с небольшой задержкой,
    // чтобы не дёргать API на каждую букву
    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 300);

        return () => clearTimeout(timeout);
    }, [searchInput]);

    useEffect(() => {
        async function loadSamples() {
            setSamplesLoading(true);
            setSamplesError('');

            try {
                const result =
                    await getSamples({
                        page,
                        limit,
                        status,
                        search,
                        sort,
                        order,
                    });

                setSamples(
                    result.data,
                );

                setTotal(
                    result.total,
                );

                setCounts(
                    result.counts,
                );
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.message ===
                    'SESSION_EXPIRED'
                ) {
                    onSessionExpired();
                    return;
                }

                setSamplesError(
                    error instanceof Error
                        ? error.message
                        : 'Не удалось загрузить образцы',
                );
            } finally {
                setSamplesLoading(false);
            }
        }

        loadSamples();
    }, [
        page,
        status,
        search,
        sort,
        order,
        onSessionExpired,
    ]);

    function handleSearchChange(
        event: React.ChangeEvent<HTMLInputElement>,
    ) {
        setSearchInput(event.target.value);
    }

    function handleStatusChange(
        event: React.ChangeEvent<HTMLSelectElement>,
    ) {
        setStatus(
            event.target.value,
        );
        setPage(1);
    }

    function handleSortChange(
        event: React.ChangeEvent<HTMLSelectElement>,
    ) {
        setSort(
            event.target.value,
        );
        setPage(1);
    }

    function handleOrderChange(
        event: React.ChangeEvent<HTMLSelectElement>,
    ) {
        setOrder(
            event.target.value,
        );
        setPage(1);
    }

    const totalPages =
        Math.ceil(total / limit);

    return (
        <div className="page">
            <div className="container">
                <div className="header">
                    <div>
                        <h1>
                            Образцы
                        </h1>

                        <p>
                            {user.fullName ??
                                user.username}
                            {' · '}
                            {user.laboratoryName ??
                                'все лаборатории'}
                        </p>
                    </div>

                    <div className="header-actions">
                        <Link
                            to="/profile"
                            className="button"
                        >
                            Кабинет
                        </Link>

                        <button
                            onClick={
                                onLogout
                            }
                        >
                            Выйти
                        </button>
                    </div>
                </div>

                <SamplesStats counts={counts} />

                <SamplesFilters
                    search={searchInput}
                    status={status}
                    sort={sort}
                    order={order}
                    onSearchChange={
                        handleSearchChange
                    }
                    onStatusChange={
                        handleStatusChange
                    }
                    onSortChange={
                        handleSortChange
                    }
                    onOrderChange={
                        handleOrderChange
                    }
                />

                {samplesLoading && (
                    <p>
                        Загрузка образцов...
                    </p>
                )}

                {samplesError && (
                    <p className="error">
                        {samplesError}
                    </p>
                )}

                {!samplesLoading &&
                    !samplesError && (
                        <SamplesTable
                            samples={
                                samples
                            }
                            onSampleClick={(
                                id,
                            ) =>
                                navigate(
                                    `/samples/${id}`,
                                )
                            }
                        />
                    )}

                <Pagination
                    page={page}
                    totalPages={
                        totalPages
                    }
                    onPrevious={() =>
                        setPage(
                            page - 1,
                        )
                    }
                    onNext={() =>
                        setPage(
                            page + 1,
                        )
                    }
                />

                <p>
                    Найдено:{' '}
                    {formatNumber(total)}
                </p>
            </div>
        </div>
    );
}

export default SamplesPage;
