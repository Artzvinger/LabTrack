import {
    useEffect,
    useState,
} from 'react';

import {
    useNavigate,
    useParams,
} from 'react-router';

import {
    getSample,
    patchSample,
} from '../api/samples';

import SampleDetails from '../components/SampleDetails';

import type {
    Sample,
    SampleStatus,
} from '../types/sample';

type SaveNotesInput = {
    anamnesis: string | null;
    conclusion: string | null;
};

type SampleDetailsPageProps = {
    onSessionExpired: () => void;
};

function SampleDetailsPage({
                               onSessionExpired,
                           }: SampleDetailsPageProps) {
    const { id } = useParams();

    const navigate = useNavigate();

    const [sample, setSample] =
        useState<Sample | null>(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState('');

    const [statusSaving, setStatusSaving] =
        useState(false);

    const [statusError, setStatusError] =
        useState('');

    useEffect(() => {
        async function loadSample() {
            if (!id) {
                setError(
                    'Некорректный ID образца',
                );
                setLoading(false);
                return;
            }

            const sampleId = Number(id);

            if (
                !Number.isInteger(
                    sampleId,
                ) ||
                sampleId < 1
            ) {
                setError(
                    'Некорректный ID образца',
                );
                setLoading(false);
                return;
            }

            try {
                const result =
                    await getSample(
                        sampleId,
                    );

                setSample(result);
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.message ===
                        'SESSION_EXPIRED'
                ) {
                    // Сбрасываем пользователя в App,
                    // иначе LoginPage вернёт его обратно на /samples
                    onSessionExpired();
                    return;
                }

                setError(
                    error instanceof Error
                        ? error.message
                        : 'Не удалось загрузить образец',
                );
            } finally {
                setLoading(false);
            }
        }

        loadSample();
    }, [id, onSessionExpired]);

    async function handleStatusChange(
        status: SampleStatus,
    ) {
        if (!sample || sample.status === status) {
            return;
        }

        setStatusSaving(true);
        setStatusError('');

        try {
            const updated = await patchSample(
                sample.id,
                { status },
            );

            setSample(updated);
        } catch (statusUpdateError) {
            if (
                statusUpdateError instanceof Error &&
                statusUpdateError.message ===
                    'SESSION_EXPIRED'
            ) {
                onSessionExpired();
                return;
            }

            setStatusError(
                statusUpdateError instanceof Error
                    ? statusUpdateError.message
                    : 'Не удалось изменить статус',
            );
        } finally {
            setStatusSaving(false);
        }
    }

    async function handleSaveNotes(
        input: SaveNotesInput,
    ) {
        if (!sample) {
            return;
        }

        try {
            const updated = await patchSample(
                sample.id,
                input,
            );

            setSample(updated);
        } catch (notesError) {
            if (
                notesError instanceof Error &&
                notesError.message ===
                    'SESSION_EXPIRED'
            ) {
                onSessionExpired();
                throw new Error(
                    'Сессия истекла. Войдите снова.',
                    { cause: notesError },
                );
            }

            throw notesError;
        }
    }

    return (
        <div className="page">
            <div className="container">
                <div className="header">
                    <h1>
                        Образец №{id}
                    </h1>

                    <button
                        onClick={() =>
                            navigate(
                                '/samples',
                            )
                        }
                    >
                        Назад
                    </button>
                </div>

                {loading && (
                    <p>
                        Загрузка...
                    </p>
                )}

                {error && (
                    <p className="error">
                        {error}
                    </p>
                )}

                {sample && (
                    <SampleDetails
                        sample={sample}
                        onSaveNotes={
                            handleSaveNotes
                        }
                        onBack={() =>
                            navigate(
                                '/samples',
                            )
                        }
                        onStatusChange={
                            handleStatusChange
                        }
                        statusSaving={
                            statusSaving
                        }
                        statusError={
                            statusError
                        }
                    />
                )}
            </div>
        </div>
    );
}

export default SampleDetailsPage;
