/**
 * Centralized role codes — the single source of truth.
 * Never compare against raw strings elsewhere.
 */
export const ROLES = {
    ADMIN: "ZK7T-93XY",
    STAFF: "S9K3-41TV",
    STANDARD: "LQ5D-21VM",
} as const;

export type RoleCode = (typeof ROLES)[keyof typeof ROLES];

export function getRoleLabel(role?: string): string {
    switch (role) {
        case ROLES.ADMIN:
            return "Admin";
        case ROLES.STAFF:
            return "Staff";
        default:
            return "User";
    }
}

export function isAdmin(role?: string): boolean {
    return role === ROLES.ADMIN;
}

export function isStaff(role?: string): boolean {
    return role === ROLES.STAFF;
}

export function isAdminOrStaff(role?: string): boolean {
    return role === ROLES.ADMIN || role === ROLES.STAFF;
}
