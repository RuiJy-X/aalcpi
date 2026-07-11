import { usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';

/**
 * Check if the authenticated user has a permission (or is super admin).
 */
export function useCan() {
    const { auth } = usePage<SharedData>().props;
    const permissions = auth?.user?.permissions ?? [];
    const isSuperAdmin = Boolean(auth?.user?.is_super_admin);

    const can = (permission: string): boolean => {
        if (isSuperAdmin) {
            return true;
        }

        return permissions.includes(permission);
    };

    const canAny = (perms: string[]): boolean => {
        if (isSuperAdmin) {
            return true;
        }

        return perms.some((p) => permissions.includes(p));
    };

    return { can, canAny, isSuperAdmin, permissions };
}
