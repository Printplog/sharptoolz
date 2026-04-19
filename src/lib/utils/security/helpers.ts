/**
 * Security utilities to prevent inspection and protect code
 * Refactored for modularity and browser compatibility.
 */

import { ROLES } from '@/lib/constants/roles';

export interface SecurityOptions {
    disableRightClick?: boolean;
    disableTextSelection?: boolean;
    disableDevToolsShortcuts?: boolean;
    detectDevTools?: boolean;
    disableConsole?: boolean;
    detectDevToolsByDimensions?: boolean;
    clearConsolePeriodically?: boolean;
    disableDragAndDrop?: boolean;
    disableCopyPaste?: boolean;
    detectDebugger?: boolean;
    detectByRegExp?: boolean;
    disablePrintScreen?: boolean;
    aggressiveDetection?: boolean;
}

export type SecurityCleanup = () => void;

export const isSafari = () => {
    if (typeof window === 'undefined') return false;
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

export const isOperaMini = () => {
    if (typeof window === 'undefined') return false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return navigator.userAgent.includes('Opera Mini') || (window as any).operamini !== undefined;
};

export const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

export const isAdminRoute = () => {
    if (typeof window === 'undefined') return false;
    return window.location.pathname.startsWith('/admin');
};

export const isAdminUser = () => {
    if (typeof window === 'undefined') return false;
    try {
        const authData = localStorage.getItem('auth-storage');
        if (!authData) return false;
        const parsed = JSON.parse(authData);
        const user = parsed?.state?.user;
        if (!user) return false;

        return user.role === ROLES.ADMIN;
    } catch {
        return false;
    }
};

export const combineCleanups = (...cleanups: Array<SecurityCleanup | void>): SecurityCleanup => {
    return () => {
        cleanups.forEach(cleanup => cleanup?.());
    };
};
