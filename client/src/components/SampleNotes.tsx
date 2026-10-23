import { useState } from 'react';

import type { Sample } from '../types/sample';

type SaveNotesInput = {
    anamnesis: string | null;
    conclusion: string | null;
};

type SampleNotesProps = {
    sample: Sample;
    onSave: (input: SaveNotesInput) => Promise<void>;
};

// Заметки врача живут в своём состоянии: компонент монтируется
// с ключом по id образца и подхватывает сохранённый текст
function SampleNotes({
    sample,
    onSave,
}: SampleNotesProps) {
    const [anamnesis, setAnamnesis] = useState(
        sample.anamnesis ?? '',
    );

    const [conclusion, setConclusion] = useState(
        sample.conclusion ?? '',
    );

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    async function handleSave() {
        setSaving(true);
        setError('');
        setSaved(false);

        try {
            await onSave({
                anamnesis:
                    anamnesis.trim() === ''
                        ? null
                        : anamnesis,
                conclusion:
                    conclusion.trim() === ''
                        ? null
                        : conclusion,
            });

            setSaved(true);
        } catch (saveError) {
            setError(
                saveError instanceof Error
                    ? saveError.message
                    : 'Не удалось сохранить заметки',
            );
        } finally {
            setSaving(false);
        }
    }

    function handleAnamnesisChange(value: string) {
        setAnamnesis(value);
        setSaved(false);
    }

    function handleConclusionChange(value: string) {
        setConclusion(value);
        setSaved(false);
    }

    return (
        <div className="sample-notes">
            <h2>Заметки врача</h2>

            <div className="sample-notes-field">
                <label htmlFor="anamnesis">
                    Анамнез
                </label>

                <textarea
                    id="anamnesis"
                    rows={4}
                    maxLength={2000}
                    value={anamnesis}
                    placeholder="Пока не заполнен"
                    onChange={(event) =>
                        handleAnamnesisChange(
                            event.target.value,
                        )
                    }
                />
            </div>

            <div className="sample-notes-field">
                <label htmlFor="conclusion">
                    Заключение
                </label>

                <textarea
                    id="conclusion"
                    rows={4}
                    maxLength={2000}
                    value={conclusion}
                    placeholder="Пока не заполнено"
                    onChange={(event) =>
                        handleConclusionChange(
                            event.target.value,
                        )
                    }
                />
            </div>

            <div className="sample-notes-actions">
                <button
                    type="button"
                    disabled={saving}
                    onClick={handleSave}
                >
                    {saving
                        ? 'Сохранение…'
                        : 'Сохранить'}
                </button>

                {saved && (
                    <span className="form-success">
                        Сохранено
                    </span>
                )}
            </div>

            {error && <p className="error">{error}</p>}
        </div>
    );
}

export default SampleNotes;
