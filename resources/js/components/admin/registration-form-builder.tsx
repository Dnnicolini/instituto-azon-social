import { Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { EmptyState, FieldError } from './cms-ui';
import { FormErrorSummary } from './form-error-summary';
import { focusFirstFormError, slugifyTitle } from '@/lib/cms-form';
import type {
    Project,
    ProjectRegistrationField,
    RegistrationFieldType,
    RegistrationFormSource,
} from '@/types/cms';
import { registrationFieldTypeLabels } from '@/types/cms';

const fieldTypes = Object.entries(registrationFieldTypeLabels) as Array<
    [RegistrationFieldType, string]
>;

const choiceTypes: RegistrationFieldType[] = [
    'select',
    'radio',
    'multiple_choice',
];
const uploadTypes: RegistrationFieldType[] = ['file', 'image'];
const numericTypes: RegistrationFieldType[] = ['number'];
const textTypes: RegistrationFieldType[] = ['short_text', 'long_text'];

function blankField(
    type: RegistrationFieldType,
    sortOrder: number,
): ProjectRegistrationField {
    return {
        id: `new-${Date.now()}-${sortOrder}`,
        type,
        label: registrationFieldTypeLabels[type],
        identifier: `campo_${sortOrder + 1}`,
        description: '',
        placeholder: '',
        required: false,
        sort_order: sortOrder,
        options: [],
        validations: {},
        max_length: null,
        allowed_mime_types: [],
        max_file_size_kb: null,
        min_value: null,
        max_value: null,
    };
}

export function RegistrationFormBuilder({
    project,
    fields,
    formSources,
}: {
    project: Project;
    fields: ProjectRegistrationField[];
    formSources: RegistrationFormSource[];
}) {
    const formId = `project-${project.id}-registration-form`;
    const form = useForm({
        fields: fields.map((field, index) => ({
            ...field,
            sort_order: index,
        })),
    });
    const duplicateForm = useForm({ source_project_id: '' });

    function updateField(
        index: number,
        values: Partial<ProjectRegistrationField>,
    ) {
        form.setData(
            'fields',
            form.data.fields.map((field, fieldIndex) =>
                fieldIndex === index ? { ...field, ...values } : field,
            ),
        );
    }

    function addField(type: RegistrationFieldType) {
        form.setData('fields', [
            ...form.data.fields,
            blankField(type, form.data.fields.length),
        ]);
    }

    function moveField(index: number, direction: -1 | 1) {
        const target = index + direction;
        if (target < 0 || target >= form.data.fields.length) return;
        const next = [...form.data.fields];
        [next[index], next[target]] = [next[target], next[index]];
        form.setData(
            'fields',
            next.map((field, fieldIndex) => ({
                ...field,
                sort_order: fieldIndex,
            })),
        );
    }

    function removeField(index: number) {
        const field = form.data.fields[index];
        if (!window.confirm(`Remover o campo “${field.label}”?`)) return;
        form.setData(
            'fields',
            form.data.fields
                .filter((_, fieldIndex) => fieldIndex !== index)
                .map((item, fieldIndex) => ({
                    ...item,
                    sort_order: fieldIndex,
                })),
        );
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        if (form.processing) return;
        form.put(`/admin/projetos/${project.id}/inscricoes/formulario`, {
            onError: () => focusFirstFormError(formId),
        });
    }

    function duplicate(event: FormEvent) {
        event.preventDefault();
        if (duplicateForm.processing || !duplicateForm.data.source_project_id)
            return;
        if (
            form.data.fields.length > 0 &&
            !window.confirm(
                'Substituir os campos atuais pela estrutura do outro projeto? Nenhuma candidatura será copiada.',
            )
        )
            return;
        duplicateForm.post(
            `/admin/projetos/${project.id}/inscricoes/formulario/duplicar`,
        );
    }

    function errorFor(path: string) {
        return (form.errors as Record<string, string | undefined>)[path];
    }

    return (
        <div className="cms-form-single">
            {formSources.length > 0 && (
                <form className="cms-form-section" onSubmit={duplicate}>
                    <h2>Duplicar outro formulário</h2>
                    <p className="cms-form-section-intro">
                        Copia somente campos e validações. Candidaturas e
                        documentos nunca são copiados.
                    </p>
                    <div className="cms-form-grid two">
                        <div className="cms-field">
                            <label htmlFor="source-project">
                                Projeto de origem
                            </label>
                            <select
                                id="source-project"
                                value={duplicateForm.data.source_project_id}
                                onChange={(event) =>
                                    duplicateForm.setData(
                                        'source_project_id',
                                        event.target.value,
                                    )
                                }
                                aria-invalid={Boolean(
                                    duplicateForm.errors.source_project_id,
                                )}
                            >
                                <option value="">Selecione um projeto</option>
                                {formSources.map((source) => (
                                    <option key={source.id} value={source.id}>
                                        {source.title}
                                    </option>
                                ))}
                            </select>
                            <FieldError
                                message={duplicateForm.errors.source_project_id}
                            />
                        </div>
                        <div className="cms-inline-actions">
                            <button
                                className="cms-button secondary"
                                type="submit"
                                disabled={
                                    duplicateForm.processing ||
                                    !duplicateForm.data.source_project_id
                                }
                            >
                                {duplicateForm.processing
                                    ? 'Duplicando…'
                                    : 'Duplicar estrutura'}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <section className="cms-form-section">
                <h2>Adicionar campo</h2>
                <p className="cms-form-section-intro">
                    Escolha um tipo. Depois ajuste nome, obrigatoriedade e
                    validações no campo criado.
                </p>
                <div className="cms-inline-actions">
                    <label className="cms-field">
                        <span className="sr-only">Tipo do novo campo</span>
                        <select
                            defaultValue=""
                            onChange={(event) => {
                                if (!event.target.value) return;
                                addField(
                                    event.target.value as RegistrationFieldType,
                                );
                                event.target.value = '';
                            }}
                        >
                            <option value="">Escolha o tipo de campo…</option>
                            {fieldTypes.map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            </section>

            <form
                id={formId}
                className="cms-form-single"
                onSubmit={submit}
                noValidate
                aria-busy={form.processing}
            >
                <FormErrorSummary errors={form.errors} />
                {form.data.fields.length ? (
                    form.data.fields.map((field, index) => (
                        <section
                            key={field.id}
                            className="cms-form-section"
                            aria-labelledby={`field-${field.id}-title`}
                        >
                            <div className="admin-panel-heading">
                                <div>
                                    <h2 id={`field-${field.id}-title`}>
                                        {index + 1}.{' '}
                                        {field.label || 'Campo sem nome'}
                                    </h2>
                                    <p>
                                        {registrationFieldTypeLabels[
                                            field.type
                                        ] ?? field.type}
                                    </p>
                                </div>
                                <div className="cms-row-actions">
                                    <button
                                        type="button"
                                        disabled={index === 0}
                                        onClick={() => moveField(index, -1)}
                                        aria-label={`Mover ${field.label} para cima`}
                                    >
                                        Subir
                                    </button>
                                    <button
                                        type="button"
                                        disabled={
                                            index ===
                                            form.data.fields.length - 1
                                        }
                                        onClick={() => moveField(index, 1)}
                                        aria-label={`Mover ${field.label} para baixo`}
                                    >
                                        Descer
                                    </button>
                                    <button
                                        type="button"
                                        className="danger"
                                        onClick={() => removeField(index)}
                                    >
                                        Remover
                                    </button>
                                </div>
                            </div>
                            <div className="cms-form-grid two">
                                <div className="cms-field">
                                    <label htmlFor={`field-${field.id}-label`}>
                                        Nome/label
                                    </label>
                                    <input
                                        id={`field-${field.id}-label`}
                                        value={field.label}
                                        onChange={(event) => {
                                            const label = event.target.value;
                                            updateField(index, {
                                                label,
                                                identifier:
                                                    field.identifier.startsWith(
                                                        'campo_',
                                                    )
                                                        ? slugifyTitle(
                                                              label,
                                                          ).replaceAll('-', '_')
                                                        : field.identifier,
                                            });
                                        }}
                                        aria-invalid={Boolean(
                                            errorFor(`fields.${index}.label`),
                                        )}
                                    />
                                    <FieldError
                                        message={errorFor(
                                            `fields.${index}.label`,
                                        )}
                                    />
                                </div>
                                <div className="cms-field">
                                    <label htmlFor={`field-${field.id}-key`}>
                                        Identificador interno
                                    </label>
                                    <input
                                        id={`field-${field.id}-key`}
                                        value={field.identifier}
                                        onChange={(event) =>
                                            updateField(index, {
                                                identifier: event.target.value,
                                            })
                                        }
                                        aria-invalid={Boolean(
                                            errorFor(
                                                `fields.${index}.identifier`,
                                            ),
                                        )}
                                    />
                                    <small>
                                        Usado nas respostas e colunas de
                                        exportação.
                                    </small>
                                    <FieldError
                                        message={errorFor(
                                            `fields.${index}.identifier`,
                                        )}
                                    />
                                </div>
                            </div>
                            <div className="cms-field">
                                <label
                                    htmlFor={`field-${field.id}-description`}
                                >
                                    Descrição ou ajuda
                                </label>
                                <textarea
                                    id={`field-${field.id}-description`}
                                    rows={2}
                                    value={field.description ?? ''}
                                    onChange={(event) =>
                                        updateField(index, {
                                            description: event.target.value,
                                        })
                                    }
                                />
                            </div>
                            {!['heading', 'paragraph', 'acceptance'].includes(
                                field.type,
                            ) && (
                                <div className="cms-field">
                                    <label
                                        htmlFor={`field-${field.id}-placeholder`}
                                    >
                                        Exemplo/placeholder
                                    </label>
                                    <input
                                        id={`field-${field.id}-placeholder`}
                                        value={field.placeholder ?? ''}
                                        onChange={(event) =>
                                            updateField(index, {
                                                placeholder: event.target.value,
                                            })
                                        }
                                    />
                                </div>
                            )}
                            {!['heading', 'paragraph'].includes(field.type) && (
                                <label className="cms-check-row">
                                    <input
                                        type="checkbox"
                                        checked={field.required}
                                        onChange={(event) =>
                                            updateField(index, {
                                                required: event.target.checked,
                                            })
                                        }
                                    />
                                    <span>
                                        <strong>
                                            Preenchimento obrigatório
                                        </strong>
                                        <small>
                                            A candidatura não poderá ser enviada
                                            sem este campo.
                                        </small>
                                    </span>
                                </label>
                            )}
                            {choiceTypes.includes(field.type) && (
                                <div className="cms-field">
                                    <label
                                        htmlFor={`field-${field.id}-options`}
                                    >
                                        Opções
                                    </label>
                                    <textarea
                                        id={`field-${field.id}-options`}
                                        rows={5}
                                        placeholder={'Uma opção por linha'}
                                        value={field.options.join('\n')}
                                        onChange={(event) =>
                                            updateField(index, {
                                                options: event.target.value
                                                    .split('\n')
                                                    .map((option) =>
                                                        option.trim(),
                                                    )
                                                    .filter(Boolean),
                                            })
                                        }
                                        aria-invalid={Boolean(
                                            errorFor(`fields.${index}.options`),
                                        )}
                                    />
                                    <FieldError
                                        message={errorFor(
                                            `fields.${index}.options`,
                                        )}
                                    />
                                </div>
                            )}
                            {numericTypes.includes(field.type) && (
                                <div className="cms-form-grid two">
                                    <div className="cms-field">
                                        <label
                                            htmlFor={`field-${field.id}-min`}
                                        >
                                            Valor/tamanho mínimo
                                        </label>
                                        <input
                                            id={`field-${field.id}-min`}
                                            type="number"
                                            value={field.min_value ?? ''}
                                            onChange={(event) =>
                                                updateField(index, {
                                                    min_value: event.target
                                                        .value
                                                        ? Number(
                                                              event.target
                                                                  .value,
                                                          )
                                                        : null,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="cms-field">
                                        <label
                                            htmlFor={`field-${field.id}-max`}
                                        >
                                            Valor/tamanho máximo
                                        </label>
                                        <input
                                            id={`field-${field.id}-max`}
                                            type="number"
                                            value={field.max_value ?? ''}
                                            onChange={(event) =>
                                                updateField(index, {
                                                    max_value: event.target
                                                        .value
                                                        ? Number(
                                                              event.target
                                                                  .value,
                                                          )
                                                        : null,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                            {textTypes.includes(field.type) && (
                                <div className="cms-field">
                                    <label
                                        htmlFor={`field-${field.id}-max-length`}
                                    >
                                        Máximo de caracteres
                                    </label>
                                    <input
                                        id={`field-${field.id}-max-length`}
                                        type="number"
                                        min="1"
                                        value={field.max_length ?? ''}
                                        onChange={(event) =>
                                            updateField(index, {
                                                max_length: event.target.value
                                                    ? Number(event.target.value)
                                                    : null,
                                            })
                                        }
                                    />
                                </div>
                            )}
                            {uploadTypes.includes(field.type) && (
                                <div className="cms-form-grid two">
                                    <div className="cms-field">
                                        <label
                                            htmlFor={`field-${field.id}-file-types`}
                                        >
                                            Tipos permitidos
                                        </label>
                                        <select
                                            id={`field-${field.id}-file-types`}
                                            multiple
                                            value={
                                                field.allowed_mime_types ?? []
                                            }
                                            onChange={(event) =>
                                                updateField(index, {
                                                    allowed_mime_types:
                                                        Array.from(
                                                            event.target
                                                                .selectedOptions,
                                                            (option) =>
                                                                option.value,
                                                        ),
                                                })
                                            }
                                        >
                                            <option value="application/pdf">
                                                PDF
                                            </option>
                                            <option value="image/jpeg">
                                                Imagem JPEG
                                            </option>
                                            <option value="image/png">
                                                Imagem PNG
                                            </option>
                                            <option value="image/webp">
                                                Imagem WebP
                                            </option>
                                            <option value="text/plain">
                                                Texto simples
                                            </option>
                                            <option value="application/msword">
                                                Documento Word (.doc)
                                            </option>
                                            <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">
                                                Documento Word (.docx)
                                            </option>
                                        </select>
                                        <small>
                                            Use Ctrl ou Cmd para selecionar mais
                                            de um tipo.
                                        </small>
                                    </div>
                                    <div className="cms-field">
                                        <label
                                            htmlFor={`field-${field.id}-file-size`}
                                        >
                                            Tamanho máximo em KB
                                        </label>
                                        <input
                                            id={`field-${field.id}-file-size`}
                                            type="number"
                                            min="1"
                                            value={field.max_file_size_kb ?? ''}
                                            onChange={(event) =>
                                                updateField(index, {
                                                    max_file_size_kb: event
                                                        .target.value
                                                        ? Number(
                                                              event.target
                                                                  .value,
                                                          )
                                                        : null,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                        </section>
                    ))
                ) : (
                    <EmptyState
                        title="Formulário ainda vazio"
                        description="Adicione o primeiro campo ou duplique a estrutura de outro projeto."
                    />
                )}

                <div className="cms-form-actions">
                    <span aria-live="polite">
                        {form.processing
                            ? 'Salvando…'
                            : form.isDirty
                              ? 'Há alterações não salvas.'
                              : `${form.data.fields.length} campo(s) configurado(s).`}
                    </span>
                    <div>
                        <Link
                            className="cms-button secondary"
                            href={`/admin/projetos/${project.id}/inscricoes`}
                        >
                            Ver candidatos
                        </Link>
                        <button
                            className="cms-button primary"
                            type="submit"
                            disabled={form.processing}
                        >
                            {form.processing
                                ? 'Salvando…'
                                : 'Salvar formulário'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
