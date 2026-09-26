import { useEffect, useState } from 'react';
import type { GalleryImage } from '@/types/cms';

function LocalImage({ file, alt }: { file: File; alt: string }) {
    const [url, setUrl] = useState('');

    useEffect(() => {
        const nextUrl = URL.createObjectURL(file);
        setUrl(nextUrl);

        return () => URL.revokeObjectURL(nextUrl);
    }, [file]);

    return url ? <img src={url} alt={alt} /> : null;
}

export function ImageGalleryFields({
    images = [],
    files,
    coverFile,
    currentCoverUrl,
    currentCoverAlt,
    dimensionHint,
    selectedCoverId,
    removedIds,
    error,
    coverError,
    onFilesChange,
    onNewCoverSelect,
    onExistingCoverSelect,
    onRemovedIdsChange,
}: {
    images?: GalleryImage[];
    files: File[];
    coverFile: File | null;
    currentCoverUrl?: string | null;
    currentCoverAlt?: string | null;
    dimensionHint: string;
    selectedCoverId: number | null;
    removedIds: number[];
    error?: string;
    coverError?: string;
    onFilesChange: (files: File[]) => void;
    onNewCoverSelect: (file: File, remainingFiles: File[]) => void;
    onExistingCoverSelect: (id: number, alt: string | null) => void;
    onRemovedIdsChange: (ids: number[]) => void;
}) {
    const visibleImages = images.filter(
        (image) => !removedIds.includes(image.id),
    );
    const showCurrentCover =
        Boolean(currentCoverUrl) &&
        coverFile === null &&
        selectedCoverId === null;
    const hasPreviews =
        showCurrentCover ||
        coverFile !== null ||
        visibleImages.length > 0 ||
        files.length > 0;

    return (
        <section className="cms-form-section">
            <h2>Fotos</h2>
            <p className="cms-form-section-intro">
                Adicione até 10 fotos, confira as prévias e escolha qual será a
                capa do conteúdo. Todo o processo é feito aqui.
            </p>
            {hasPreviews && (
                <div
                    className="cms-gallery-admin"
                    aria-label="Prévia das fotos"
                >
                    {showCurrentCover && (
                        <figure className="is-cover">
                            <img
                                src={currentCoverUrl ?? ''}
                                alt={currentCoverAlt ?? ''}
                            />
                            <div className="cms-gallery-cover-choice selected">
                                Capa atual
                            </div>
                        </figure>
                    )}
                    {coverFile && (
                        <figure className="is-cover">
                            <LocalImage
                                file={coverFile}
                                alt={`Prévia da capa ${coverFile.name}`}
                            />
                            <figcaption>{coverFile.name}</figcaption>
                            <div className="cms-gallery-cover-choice selected">
                                Capa selecionada
                            </div>
                        </figure>
                    )}
                    {visibleImages.map((image) => (
                        <figure
                            key={image.id}
                            className={
                                selectedCoverId === image.id
                                    ? 'is-cover'
                                    : undefined
                            }
                        >
                            <img src={image.url} alt={image.alt ?? ''} />
                            <label className="cms-gallery-cover-choice">
                                <input
                                    type="radio"
                                    name="gallery-cover"
                                    checked={selectedCoverId === image.id}
                                    onChange={() =>
                                        onExistingCoverSelect(
                                            image.id,
                                            image.alt ?? null,
                                        )
                                    }
                                />
                                <span>
                                    {selectedCoverId === image.id
                                        ? 'Será a capa'
                                        : 'Definir como capa'}
                                </span>
                            </label>
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
                    {files.map((file, index) => (
                        <figure key={`${file.name}-${file.size}-${index}`}>
                            <LocalImage
                                file={file}
                                alt={`Prévia de ${file.name}`}
                            />
                            <figcaption>{file.name}</figcaption>
                            <button
                                type="button"
                                className="cms-gallery-cover-choice"
                                onClick={() =>
                                    onNewCoverSelect(
                                        file,
                                        files.filter(
                                            (candidate) => candidate !== file,
                                        ),
                                    )
                                }
                            >
                                Definir como capa
                            </button>
                            <button
                                type="button"
                                className="cms-text-action danger"
                                onClick={() =>
                                    onFilesChange(
                                        files.filter(
                                            (candidate) => candidate !== file,
                                        ),
                                    )
                                }
                            >
                                Remover foto
                            </button>
                        </figure>
                    ))}
                </div>
            )}
            <div className="cms-field">
                <label htmlFor="gallery">Selecionar fotos</label>
                <input
                    id="gallery"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(event) => {
                        const selected = Array.from(event.target.files ?? []);
                        onFilesChange([...files, ...selected].slice(0, 10));
                        event.target.value = '';
                    }}
                    aria-invalid={Boolean(error || coverError)}
                />
                <small>
                    JPG, PNG ou WebP, com no máximo 5 MB por foto.{' '}
                    {dimensionHint} As imagens aparecem acima antes de salvar;
                    use “Definir como capa” na foto principal.
                </small>
                {files.length > 0 && (
                    <small>
                        {files.length}{' '}
                        {files.length === 1
                            ? 'nova foto pronta para envio'
                            : 'novas fotos prontas para envio'}
                        .
                    </small>
                )}
                {error && <span className="cms-field-error">{error}</span>}
                {coverError && (
                    <span className="cms-field-error">{coverError}</span>
                )}
            </div>
            {coverFile && (
                <p className="cms-gallery-cover-notice">
                    <strong>{coverFile.name}</strong> foi separada como capa e
                    não será duplicada na galeria.
                </p>
            )}
        </section>
    );
}
