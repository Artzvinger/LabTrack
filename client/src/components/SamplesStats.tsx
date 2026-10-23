import { formatNumber } from '../lib/format';
import { statusLabels } from '../lib/status';

import type { StatusCounts } from '../types/sample';

type SamplesStatsProps = {
    counts: StatusCounts;
};

function SamplesStats({
    counts,
}: SamplesStatsProps) {
    const total =
        counts.received +
        counts.processing +
        counts.completed;

    function share(value: number): string {
        if (total === 0) {
            return '0%';
        }

        return `${(value / total) * 100}%`;
    }

    return (
        <section
            className="stats"
            aria-label="Сводка по статусам"
        >
            <div className="stats-numbers">
                <div className="stat">
                    <span className="stat-value">
                        {formatNumber(counts.received)}
                    </span>

                    <span className="stat-label">
                        {statusLabels.received}
                    </span>
                </div>

                <div className="stat">
                    <span className="stat-value">
                        {formatNumber(counts.processing)}
                    </span>

                    <span className="stat-label">
                        {statusLabels.processing}
                    </span>
                </div>

                <div className="stat">
                    <span className="stat-value">
                        {formatNumber(counts.completed)}
                    </span>

                    <span className="stat-label">
                        {statusLabels.completed}
                    </span>
                </div>

                <div className="stat stat-total">
                    <span className="stat-value">
                        {formatNumber(total)}
                    </span>

                    <span className="stat-label">
                        Всего
                    </span>
                </div>
            </div>

            <div
                className="stats-bar"
                aria-hidden="true"
            >
                <span
                    className="stats-segment stats-segment-received"
                    style={{
                        width: share(
                            counts.received,
                        ),
                    }}
                />

                <span
                    className="stats-segment stats-segment-processing"
                    style={{
                        width: share(
                            counts.processing,
                        ),
                    }}
                />

                <span
                    className="stats-segment stats-segment-completed"
                    style={{
                        width: share(
                            counts.completed,
                        ),
                    }}
                />
            </div>
        </section>
    );
}

export default SamplesStats;
