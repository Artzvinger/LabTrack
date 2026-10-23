import { formatDateTime } from '../lib/format';
import {
    statuses,
    statusLabels,
} from '../lib/status';

import SampleNotes from './SampleNotes';

import type {
    Sample,
    SampleStatus,
} from '../types/sample';

type SaveNotesInput = {
    anamnesis: string | null;
    conclusion: string | null;
};

type SampleDetailsProps = {
    sample: Sample;
    onSaveNotes: (input: SaveNotesInput) => Promise<void>;
    onBack: () => void;
    onStatusChange: (status: SampleStatus) => void;
    statusSaving: boolean;
    statusError: string;
};

function SampleDetails({
    sample,
    onSaveNotes,
    onBack,
    onStatusChange,
    statusSaving,
    statusError,
}: SampleDetailsProps) {
    return (
        <div className="sample-details">
            <p>
                <strong>Номер:</strong>{' '}
                <span className="sample-details-code">
                    {sample.code}
                </span>
            </p>

            <p>
                <strong>Пациент:</strong>{' '}
                {sample.patientName}
            </p>

            <p>
                <strong>Статус:</strong>{' '}

                <span
                    className={`status status-${sample.status}`}
                >
                    {statusLabels[sample.status]}
                </span>
            </p>

            <p>
                <strong>Дата получения:</strong>{' '}
                {formatDateTime(
                    sample.receivedAt,
                )}
            </p>

            <p>
                <strong>Лаборатория:</strong>{' '}
                {sample.laboratoryName ?? '—'}
            </p>

            <p>
                <strong>Дата создания:</strong>{' '}
                {formatDateTime(
                    sample.createdAt,
                )}
            </p>

            {/* Ключ сбрасывает локальное состояние при смене образца */}
            <SampleNotes
                key={sample.id}
                sample={sample}
                onSave={onSaveNotes}
            />

            <div className="status-switch">
                <span className="status-switch-label">
                    Сменить статус:
                </span>

                <div
                    className="status-switch-buttons"
                    role="group"
                    aria-label="Сменить статус"
                >
                    {statuses.map((value) => (
                        <button
                            key={value}
                            type="button"
                            className={
                                sample.status === value
                                    ? 'is-active'
                                    : ''
                            }
                            aria-pressed={
                                sample.status === value
                            }
                            disabled={statusSaving}
                            onClick={() =>
                                onStatusChange(value)
                            }
                        >
                            {statusLabels[value]}
                        </button>
                    ))}
                </div>
            </div>

            {statusError && (
                <p className="error">{statusError}</p>
            )}

            <button onClick={onBack}>Назад</button>
        </div>
    );
}

export default SampleDetails;
