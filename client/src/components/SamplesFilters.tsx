import type { ChangeEvent } from 'react';

import {
    statusLabels,
    statuses,
} from '../lib/status';

type SamplesFiltersProps = {
    search: string;
    status: string;
    sort: string;
    order: string;
    onSearchChange: (
        event: ChangeEvent<HTMLInputElement>,
    ) => void;
    onStatusChange: (
        event: ChangeEvent<HTMLSelectElement>,
    ) => void;
    onSortChange: (
        event: ChangeEvent<HTMLSelectElement>,
    ) => void;
    onOrderChange: (
        event: ChangeEvent<HTMLSelectElement>,
    ) => void;
};

function SamplesFilters({
                            search,
                            status,
                            sort,
                            order,
                            onSearchChange,
                            onStatusChange,
                            onSortChange,
                            onOrderChange,
                        }: SamplesFiltersProps) {
    return (
        <div className="filters">
            <label>
                Поиск:{' '}

                <input
                    type="search"
                    value={search}
                    placeholder="Фамилия или номер"
                    onChange={onSearchChange}
                />
            </label>

            <label>
                Статус:{' '}

                <select
                    value={status}
                    onChange={onStatusChange}
                >
                    <option value="">
                        Все
                    </option>

                    {statuses.map((value) => (
                        <option
                            key={value}
                            value={value}
                        >
                            {statusLabels[value]}
                        </option>
                    ))}
                </select>
            </label>

            <label>
                Сортировка:{' '}

                <select
                    value={sort}
                    onChange={onSortChange}
                >
                    <option value="receivedAt">
                        Дата получения
                    </option>

                    <option value="createdAt">
                        Дата создания
                    </option>
                </select>
            </label>

            <label>
                Порядок:{' '}

                <select
                    value={order}
                    onChange={onOrderChange}
                >
                    <option value="desc">
                        Сначала новые
                    </option>

                    <option value="asc">
                        Сначала старые
                    </option>
                </select>
            </label>
        </div>
    );
}

export default SamplesFilters;
