import { Link } from '@inertiajs/react';
import {
    isSafeExternalApplicationUrl,
    registrationStateMessage,
} from '@/lib/applications';
import type { PublicRegistration } from '@/types/applications';

export function RegistrationStatus({
    projectSlug,
    registration,
    compact = false,
}: {
    projectSlug: string;
    registration: PublicRegistration;
    compact?: boolean;
}) {
    const message = registrationStateMessage(registration);
    const applicationUrl = `/projetos/${encodeURIComponent(projectSlug)}/inscricao`;
    const externalUrl = isSafeExternalApplicationUrl(registration.url)
        ? registration.url
        : null;
    const buttonLabel = registration.button_label?.trim() || 'Inscreva-se';

    return (
        <section
            className={`registration-status registration-status-${registration.state}${compact ? ' compact' : ''}`}
            aria-labelledby="registration-status-title"
        >
            <div>
                <p
                    className="registration-state"
                    id="registration-status-title"
                    aria-live="polite"
                >
                    {message}
                </p>
                {!compact && registration.instructions && (
                    <p>{registration.instructions}</p>
                )}
                {!compact && registration.max_applications && (
                    <p className="registration-capacity">
                        {registration.remaining_spots !== null &&
                        registration.remaining_spots !== undefined
                            ? `${registration.remaining_spots} de ${registration.max_applications} vagas disponíveis`
                            : `Até ${registration.max_applications} inscrições`}
                    </p>
                )}
            </div>

            {registration.state === 'open' &&
            (registration.can_apply || registration.type === 'external') ? (
                registration.type === 'external' ? (
                    externalUrl ? (
                        <a
                            className="button button-gold"
                            href={externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {buttonLabel} ↗
                        </a>
                    ) : (
                        <p role="alert">
                            O link de inscrição precisa ser revisado pela
                            equipe.
                        </p>
                    )
                ) : (
                    <Link className="button button-gold" href={applicationUrl}>
                        {buttonLabel} →
                    </Link>
                )
            ) : null}
        </section>
    );
}
