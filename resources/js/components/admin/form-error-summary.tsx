import { humanizeIdentifier } from '@/lib/cms-form';

type FormErrors = Partial<Record<string, string>>;

export function FormErrorSummary({
    errors,
    labels = {},
    fieldIds = {},
}: {
    errors: FormErrors;
    labels?: Partial<Record<string, string>>;
    fieldIds?: Partial<Record<string, string>>;
}) {
    const entries = Object.entries(errors).filter(
        (entry): entry is [string, string] => Boolean(entry[1]),
    );

    if (!entries.length) return null;

    return (
        <section
            className="cms-error-summary"
            role="alert"
            aria-labelledby="form-error-title"
            tabIndex={-1}
        >
            <strong id="form-error-title">
                Revise{' '}
                {entries.length === 1 ? 'o campo abaixo' : 'os campos abaixo'}
            </strong>
            <p>As informações ainda não foram salvas.</p>
            <ul>
                {entries.map(([field, message]) => (
                    <li key={field}>
                        <a href={`#${fieldIds[field] ?? field}`}>
                            {labels[field] ?? humanizeIdentifier(field)}:{' '}
                            {message}
                        </a>
                    </li>
                ))}
            </ul>
        </section>
    );
}
