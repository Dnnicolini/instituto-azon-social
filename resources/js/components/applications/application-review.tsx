import { formatAnswer, isPresentationField } from '@/lib/applications';
import type {
    ApplicationAnswerValue,
    ApplicationField,
    ApplicationFile,
} from '@/types/applications';

export function ApplicationReview({
    fields,
    answers,
    files,
    existingFiles,
    onEdit,
}: {
    fields: ApplicationField[];
    answers: Record<string, ApplicationAnswerValue>;
    files: Record<string, File | null>;
    existingFiles: ApplicationFile[];
    onEdit: () => void;
}) {
    const answerFields = fields.filter(
        (field) =>
            !isPresentationField(field) &&
            !['file', 'image'].includes(field.type),
    );
    const uploadFields = fields.filter((field) =>
        ['file', 'image'].includes(field.type),
    );

    return (
        <div className="application-review">
            <section aria-labelledby="application-review-answers">
                <header>
                    <h2 id="application-review-answers">Seus dados</h2>
                    <button type="button" onClick={onEdit}>
                        Editar respostas
                    </button>
                </header>
                <dl>
                    {answerFields.map((field) => (
                        <div key={field.id}>
                            <dt>{field.label}</dt>
                            <dd>
                                {formatAnswer(field, answers[field.identifier])}
                            </dd>
                        </div>
                    ))}
                </dl>
            </section>

            {uploadFields.length > 0 && (
                <section aria-labelledby="application-review-files">
                    <header>
                        <h2 id="application-review-files">Documentos</h2>
                        <button type="button" onClick={onEdit}>
                            Editar documentos
                        </button>
                    </header>
                    <ul className="application-review-files">
                        {uploadFields.map((field) => {
                            const selected = files[field.identifier];
                            const existing = existingFiles.find(
                                (file) => file.identifier === field.identifier,
                            );
                            return (
                                <li key={field.id}>
                                    <div>
                                        <strong>{field.label}</strong>
                                        <span>
                                            {selected?.name ??
                                                existing?.name ??
                                                'Nenhum arquivo selecionado'}
                                        </span>
                                    </div>
                                    {(selected || existing) && (
                                        <small>
                                            Documento pronto para envio
                                        </small>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}
        </div>
    );
}
