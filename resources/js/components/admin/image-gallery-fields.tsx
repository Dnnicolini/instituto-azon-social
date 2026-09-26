import { useEffect, useState } from 'react';
import type { GalleryImage } from '@/types/cms';

function LocalMedia({ file, alt }: { file: File; alt: string }) {
    const [url, setUrl] = useState('');

    useEffect(() => {
        const nextUrl = URL.createObjectURL(file);
        setUrl(nextUrl);

        return () => URL.revokeObjectURL(nextUrl);
    }, [file]);

    if (!url) return null;

    return file.type.startsWith('video/') ? (
        <video controls preload="metadata" playsInline aria-label={alt}>
            <source src={url} type={file.type} />
        </video>
    ) : (
        <img src={url} alt={alt} />
    );
}

export function ImageGalleryFields({
    images = [],
    files,
    coverFile,
    currentCoverUrl,
    currentCoverAlt,
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
    selectedCoverId: number | null;
    removedIds: number[];
    error?: string;
    coverError?: string;
    onFilesChange: (files: File[]) => void;
    onNewCoverSelect: (file: File, remainingFiles: File[]) => void;
    onExistingCoverSelect: (id: number, alt: string | null) => void;
    onRemovedIdsChange: (ids: number[]) => void;
}) {
    const visibleMedia = images.filter(
        (image) => !removedIds.includes(image.id),
    );
    const showCurrentCover =
        Boolean(currentCoverUrl) &&
        coverFile === null &&
        selectedCoverId === null;
    const hasPreviews =
        showCurrentCover ||
        coverFile !== null ||
        visibleMedia.length > 0 ||
        files.length > 0;

    return (
        <section className="cms-form-section">
            <h2>Galeria de mídias</h2>
            <p className="cms-form-section-intro">
                Adicione até 10 imagens ou vídeos e confira as prévias antes de
                salvar. Somente imagens podem ser definidas como capa.
            </p>
            {hasPreviews && (
                <div
                    className="cms-gallery-admin"
                    aria-label="Prévia das mídias"
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
                            <LocalMedia
                                file={coverFile}
                                alt={`Prévia da capa ${coverFile.name}`}
                            />
                            <figcaption>{coverFile.name}</figcaption>
                            <div className="cms-gallery-cover-choice selected">
                                Capa selecionada
                            </div>
                        </figure>
                    )}
                    {visibleMedia.map((image) => (
                        <figure
                            key={image.id}
                            className={
                                selectedCoverId === image.id
                                    ? 'is-cover'
                                    : undefined
                            }
                        >
                            {image.media_type === 'video' ? (
                                <video
                                    controls
                                    preload="metadata"
                                    playsInline
                                    aria-label="Prévia do vídeo salvo"
                                >
                                    <source
                                        src={image.url}
                                        type={image.mime_type ?? 'video/mp4'}
                                    />
                                </video>
                            ) : (
                                <img src={image.url} alt={image.alt ?? ''} />
                            )}
                            {image.media_type !== 'video' && (
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
                            )}
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
                                Remover mídia
                            </button>
                        </figure>
                    ))}
                    {files.map((file, index) => (
                        <figure key={`${file.name}-${file.size}-${index}`}>
                            <LocalMedia
                                file={file}
                                alt={`Prévia de ${file.name}`}
                            />
                            <figcaption>{file.name}</figcaption>
                            {file.type.startsWith('image/') && (
                                <button
                                    type="button"
                                    className="cms-gallery-cover-choice"
                                    onClick={() =>
                                        onNewCoverSelect(
                                            file,
                                            files.filter(
                                                (candidate) =>
                                                    candidate !== file,
                                            ),
                                        )
                                    }
                                >
                                    Definir como capa
                                </button>
                            )}
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
                                Remover mídia
                            </button>
                        </figure>
                    ))}
                </div>
            )}
            <div className="cms-field">
                <label htmlFor="gallery">Selecionar imagens ou vídeos</label>
                <input
                    id="gallery"
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={(event) => {
                        const selected = Array.from(event.target.files ?? []);
                        onFilesChange([...files, ...selected].slice(0, 10));
                        event.target.value = '';
                    }}
                    aria-invalid={Boolean(error || coverError)}
                />
                <small>
                    Imagens JPG, PNG, WebP, GIF, AVIF ou BMP (até 20 MB) e
                    vídeos MP4, MOV, M4V, WebM, MKV ou AVI (até 200 MB). Não há
                    limite de dimensões; o total de cada envio deve ficar em até
                    200 MB. Os vídeos são convertidos para MP4 e otimizados em
                    segundo plano após salvar.
                </small>
                {files.length > 0 && (
                    <small>
                        {files.length}{' '}
                        {files.length === 1
                            ? 'nova mídia pronta para envio'
                            : 'novas mídias prontas para envio'}
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
