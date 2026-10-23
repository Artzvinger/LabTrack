import { formatDateTime } from '../lib/format';
import { statusLabels } from '../lib/status';

import type { Sample } from '../types/sample';

type SamplesTableProps = {
    samples: Sample[];
    onSampleClick: (id: number) => void;
};

function SamplesTable({
    samples,
    onSampleClick,
}: SamplesTableProps) {
    if (samples.length === 0) {
        return (
            <p>
                Ничего не найдено. Измените
                поиск или фильтры.
            </p>
        );
    }

    return (
        <table className="samples-table">
            <thead>
                <tr>
                    <th>Номер</th>
                    <th>Пациент</th>
                    <th>Статус</th>
                    <th>Дата получения</th>
                    <th>Лаборатория</th>
                </tr>
            </thead>

            <tbody>
                {samples.map((sample) => (
                    <tr
                        key={sample.id}
                        onClick={() =>
                            onSampleClick(
                                sample.id,
                            )
                        }
                    >
                        <td>{sample.code}</td>

                        <td>
                            {sample.patientName}
                        </td>

                        <td>
                            <span
                                className={`status status-${sample.status}`}
                            >
                                {
                                    statusLabels[
                                        sample.status
                                    ]
                                }
                            </span>
                        </td>

                        <td>
                            {formatDateTime(
                                sample.receivedAt,
                            )}
                        </td>

                        <td>
                            {sample.laboratoryName ??
                                '—'}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default SamplesTable;
