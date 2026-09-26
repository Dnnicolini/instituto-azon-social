import type { GalleryImage } from '@/types/cms';

export function ImageGalleryFields({
    images = [],
    files,
    removedIds,
    error,
    onFilesChange,
    onRemovedIdsChange,
}: {
    images?: GalleryImage[];
    files: File[];
    removedIds: number[];
    error?: string;
    onFilesChange: (files: File[]) => void;
    onRemovedIdsChange: (ids: number[]) => void;
}) {
    const visibleImages = images.filter(
        (image) => !removedIds.includes(image.id),
    );

    return (
        <section className="cms-form-section">
            <h2>Galeria de fotos</h2>
            <p className="cms-form-section-intro">
                A foto de capa continua destacada. Adicione aqui as outras fotos
                que ajudam a contar a história.
            </p>
            {visibleImages.length > 0 && (
                <div
                    className="cms-gallery-admin"
                    aria-label="Fotos atuais da galeria"
                >
                    {visibleImages.map((image) => (
                        <figure key={image.id}>
                            <img src={image.url} alt={image.alt ?? ''} />
                            <button
                                type="button"
                                className="cms-text-action danger"
                                onClick={() =>
                                    onRemovedIdsChange([
                                        ...removedIds,
                                        image.id,
                                    ])
                                }
                            >
                                Remover foto
                            </button>
                        </figure>
                    ))}
                </div>
            )}
            <div className="cms-field">
                <label htmlFor="gallery">Adicionar outras fotos</label>
                <input
                    id="gallery"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(event) =>
                        onFilesChange(Array.from(event.target.files ?? []))
                    }
                    aria-invalid={Boolean(error)}
                />
                <small>
                    Selecione até 10 imagens JPG, PNG ou WebP, com no máximo 5
                    MB cada.
                </small>
                {files.length > 0 && (
                    <small>
                        {files.length}{' '}
                        {files.length === 1
                            ? 'nova foto selecionada'
                            : 'novas fotos selecionadas'}
                        .
                    </small>
                )}
                {error && <span className="cms-field-error">{error}</span>}
            </div>
        </section>
    );
}
