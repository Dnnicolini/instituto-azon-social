import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import type { AdminSharedProps } from '@/types/cms';

export function useCan(permission: string): boolean {
    return usePage<AdminSharedProps>().props.auth.user.permissions.includes(
        permission,
    );
}

export function Can({
    permission,
    children,
    fallback = null,
}: {
    permission: string;
    children: ReactNode;
    fallback?: ReactNode;
}) {
    return useCan(permission) ? <>{children}</> : <>{fallback}</>;
}
