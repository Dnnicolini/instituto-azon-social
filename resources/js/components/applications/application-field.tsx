import type { ChangeEvent } from 'react';
import { fieldErrorKey } from '@/lib/applications';
import type {
    ApplicationAnswerValue,
    ApplicationField as ApplicationFieldDefinition,
    ApplicationFile,
} from '@/types/applications';

type Errors = Partial<Record<string, string>>;

function stringValue(value: ApplicationAnswerValue | undefined): string {
    return typeof value === 'string' ? value : '';
}

function booleanValue(value: ApplicationAnswerValue | undefined): boolean {
    return value === true;
}

function selectedValues(value: ApplicationAnswerValue | undefined): string[] {
    return Array.isArray(value) ? value : [];
}

function optionValue(
    option: string | { value: string; label: string },
): string {
    return typeof option === 'string' ? option : option.value;
}

function optionLabel(
    option: string | { value: string; label: string },
): string {
    return typeof option === 'string' ? option : option.label;
}

function inputType(field: ApplicationFieldDefinition): string {
    if (field.type === 'email') return 'email';
    if (field.type === 'phone') return 'tel';
    if (field.type === 'date') return 'date';
    if (field.type === 'number') return 'number';
    if (field.type === 'url') return 'url';

    return 'text';
}

export function ApplicationField({
    field,
    value,
    existingFile,
    errors,
    disabled,
    onAnswerChange,
    onFileChange,
}: {
    field: ApplicationFieldDefinition;
    value?: ApplicationAnswerValue;
    existingFile?: ApplicationFile;
    errors: Errors;
    disabled: boolean;
    onAnswerChange: (identifier: string, value: ApplicationAnswerValue) => void;
    onFileChange: (identifier: string, file: File | null) => void;
}) {
    const id = `application-field-${field.identifier}`;
    const descriptionId = field.description ? `${id}-description` : undefined;
    const errorKey = fieldErrorKey(field);
    const error = errors[errorKey];
    const errorId = error ? `${id}-error` : undefined;
    const describedBy =
        [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

    if (field.type === 'heading') {
        return (
            <header className="application-form-heading">
                <h2>{field.label}</h2>
                {field.description && <p>{field.description}</p>}
            </header>
        );
    }

    if (field.type === 'paragraph') {
        return (
            <div className="application-form-copy">
                <strong>{field.label}</strong>
                {field.description && <p>{field.description}</p>}
            </div>
        );
    }

    if (
        field.type === 'radio' ||
        field.type === 'multiple_choice' ||
        field.type === 'checkbox'
    ) {
        const selected = selectedValues(value);

        return (
            <fieldset
                className="application-field application-choice-field"
                aria-describedby={describedBy}
                aria-invalid={Boolean(error)}
                disabled={disabled}
            >
                <legend>
                    {field.label}
                    {field.required && <span aria-hidden="true"> *</span>}
                </legend>
                {field.description && (
                    <p id={descriptionId}>{field.description}</p>
                )}
                <div className="application-choices">
                    {(field.options ?? []).map((option) => {
                        const currentValue = optionValue(option);
                        const checked =
                            field.type === 'radio'
                                ? value === currentValue
                                : selected.includes(currentValue);
                        return (
                            <label key={currentValue}>
                                <input
                                    type={
                                        field.type === 'radio'
                                            ? 'radio'
                                            : 'checkbox'
                                    }
                                    name={
                                        field.type === 'radio'
                                            ? `answers[${field.identifier}]`
                                            : undefined
                                    }
                                    value={currentValue}
                                    checked={checked}
                                    onChange={(event) => {
                                        if (field.type === 'radio') {
                                            onAnswerChange(
                                                field.identifier,
                                                currentValue,
                                            );
                                            return;
                                        }

                                        onAnswerChange(
                                            field.identifier,
                                            event.currentTarget.checked
                                                ? [...selected, currentValue]
                                                : selected.filter(
                                                      (item) =>
                                                          item !== currentValue,
                                                  ),
                                        );
                                    }}
                                />
                                <span>{optionLabel(option)}</span>
                            </label>
                        );
                    })}
                </div>
                {error && (
                    <p className="application-field-error" id={errorId}>
                        {error}
                    </p>
                )}
            </fieldset>
        );
    }

    if (field.type === 'acceptance') {
        return (
            <div className="application-field application-check-field">
                <label htmlFor={id}>
                    <input
                        id={id}
                        type="checkbox"
                        checked={booleanValue(value)}
                        disabled={disabled}
                        required={field.required}
                        aria-describedby={describedBy}
                        aria-invalid={Boolean(error)}
                        onChange={(event) =>
                            onAnswerChange(
                                field.identifier,
                                event.currentTarget.checked,
                            )
                        }
                    />
                    <span>
                        {field.label}
                        {field.required && <span aria-hidden="true"> *</span>}
                    </span>
                </label>
                {field.description && (
                    <p id={descriptionId}>{field.description}</p>
                )}
                {error && (
                    <p className="application-field-error" id={errorId}>
                        {error}
                    </p>
                )}
            </div>
        );
    }

    if (field.type === 'file' || field.type === 'image') {
        const accepted = (
            field.allowed_mime_types ?? field.validation?.accepted_mime_types
        )?.join(',');
        const maxSizeMb =
            field.max_file_size_kb !== null &&
            field.max_file_size_kb !== undefined
                ? field.max_file_size_kb / 1024
                : field.validation?.max_size_mb;

        return (
            <div className="application-field application-upload-field">
                <label htmlFor={id}>
                    {field.label}
                    {field.required && <span aria-hidden="true"> *</span>}
                </label>
                {field.description && (
                    <p id={descriptionId}>{field.description}</p>
                )}
                <input
                    id={id}
                    type="file"
                    accept={accepted}
                    disabled={disabled}
                    required={field.required && !existingFile}
                    aria-describedby={describedBy}
                    aria-invalid={Boolean(error)}
                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        onFileChange(
                            field.identifier,
                            event.currentTarget.files?.[0] ?? null,
                        )
                    }
                />
                <small>
                    {accepted ? `Formatos aceitos: ${accepted}. ` : ''}
                    {maxSizeMb
                        ? `Tamanho máximo: ${maxSizeMb.toLocaleString('pt-BR')} MB.`
                        : ''}
                </small>
                {existingFile && (
                    <p className="application-current-file">
                        Arquivo atual: {existingFile.name}
                    </p>
                )}
                {error && (
                    <p className="application-field-error" id={errorId}>
                        {error}
                    </p>
                )}
            </div>
        );
    }

    if (field.type === 'select') {
        return (
            <div className="application-field">
                <label htmlFor={id}>
                    {field.label}
                    {field.required && <span aria-hidden="true"> *</span>}
                </label>
                {field.description && (
                    <p id={descriptionId}>{field.description}</p>
                )}
                <select
                    id={id}
                    value={stringValue(value)}
                    disabled={disabled}
                    required={field.required}
                    aria-describedby={describedBy}
                    aria-invalid={Boolean(error)}
                    onChange={(event) =>
                        onAnswerChange(
                            field.identifier,
                            event.currentTarget.value,
                        )
                    }
                >
                    <option value="">
                        {field.placeholder ?? 'Selecione uma opção'}
                    </option>
                    {(field.options ?? []).map((option) => (
                        <option
                            value={optionValue(option)}
                            key={optionValue(option)}
                        >
                            {optionLabel(option)}
                        </option>
                    ))}
                </select>
                {error && (
                    <p className="application-field-error" id={errorId}>
                        {error}
                    </p>
                )}
            </div>
        );
    }

    const commonProps = {
        id,
        value: stringValue(value),
        disabled,
        required: field.required,
        placeholder: field.placeholder ?? undefined,
        'aria-describedby': describedBy,
        'aria-invalid': Boolean(error),
        maxLength:
            field.max_length ?? field.validation?.max_length ?? undefined,
    } as const;

    return (
        <div className="application-field">
            <label htmlFor={id}>
                {field.label}
                {field.required && <span aria-hidden="true"> *</span>}
            </label>
            {field.description && <p id={descriptionId}>{field.description}</p>}
            {field.type === 'long_text' ? (
                <textarea
                    {...commonProps}
                    rows={6}
                    onChange={(event) =>
                        onAnswerChange(
                            field.identifier,
                            event.currentTarget.value,
                        )
                    }
                />
            ) : (
                <input
                    {...commonProps}
                    type={inputType(field)}
                    min={field.min_value ?? field.validation?.min ?? undefined}
                    max={field.max_value ?? field.validation?.max ?? undefined}
                    inputMode={
                        ['phone', 'cpf', 'cnpj'].includes(field.type)
                            ? 'numeric'
                            : undefined
                    }
                    autoComplete={
                        field.type === 'email'
                            ? 'email'
                            : field.type === 'phone'
                              ? 'tel'
                              : undefined
                    }
                    onChange={(event) =>
                        onAnswerChange(
                            field.identifier,
                            event.currentTarget.value,
                        )
                    }
                />
            )}
            {error && (
                <p className="application-field-error" id={errorId}>
                    {error}
                </p>
            )}
        </div>
    );
}
