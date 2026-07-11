export type UserRow = {
    id: number | string;
    name: string;
    email: string;
    username: string;
    password?: string;
    roles: string[];
    permissions?: string[];
    all_permissions?: string[];
    is_super_admin?: boolean;
    /** @deprecated use roles */
    role?: string;
};

export type RoleOption = {
    id: number;
    name: string;
};

export type PermissionItem = {
    name: string;
    action: string;
    label: string;
};
