import type { SelectOption } from '@/types/cms';

export function ProjectLinkField({
    options,
    selected,
    onChange,
}: {
    options: SelectOption[];
    selected: number[];
    onChange: (ids: number[]) => void;
}) {
    if (options.length === 0) return null;

    return (
        <section className="cms-form-section">
            <h2>Programa social relacionado</h2>
            <p className="cms-form-section-intro">
                Vincule este item aos projetos em que ele aconteceu. Ele
                aparecerá no histórico público desses programas.
            </p>
            <div className="cms-option-list">
                {options.map((option) => {
                    const id = Number(option.value);
                    const checked = selected.includes(id);
                    return (
                        <label className="cms-check-row" key={option.value}>
                            <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                    onChange(
                                        checked
                                            ? selected.filter(
                                                  (item) => item !== id,
                                              )
                                            : [...selected, id],
                                    )
                                }
                            />
                            <span>
                                <strong>{option.label}</strong>
                            </span>
                        </label>
                    );
                })}
            </div>
        </section>
    );
}
