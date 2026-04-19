import type { SecurityCleanup } from './helpers';
import { combineCleanups, isOperaMini, isAdminUser } from './helpers';

const redirect = () => {
    if (isAdminUser() || isOperaMini()) return;
    window.location.replace('about:blank');
};

// Store original console methods to allow restoration for admins
const originalMethods: Record<string, any> = {};

export function disableConsole(): SecurityCleanup {
    const methods = ['log', 'debug', 'info', 'warn', 'error', 'assert', 'dir', 'dirxml', 'group', 'groupEnd', 'time', 'timeEnd', 'count', 'trace', 'profile', 'profileEnd'];
    
    methods.forEach(method => {
        const consoleObj = window.console as any;
        // Save original method if not already saved
        if (!originalMethods[method]) {
            originalMethods[method] = consoleObj[method];
        }
        
        consoleObj[method] = (...args: any[]) => {
            if (isAdminUser()) {
                if (typeof originalMethods[method] === 'function') {
                    originalMethods[method].apply(consoleObj, args);
                }
            }
        };
    });

    return () => {
        const consoleObj = window.console as any;
        methods.forEach(method => {
            if (originalMethods[method]) {
                consoleObj[method] = originalMethods[method];
            }
        });
    };
}

const createTracker = (callback: () => void) => {
    const element = new Image();
    let detected = false;
    const trigger = () => { if (!detected) { detected = true; callback(); } };

    ['id', 'src', 'width', 'height'].forEach(prop => {
        Object.defineProperty(element, prop, { get: trigger, configurable: false });
    });

    Object.defineProperty(element, 'toString', { value: trigger, configurable: false });
    Object.defineProperty(element, 'valueOf', { value: trigger, configurable: false });

    return element;
};

export function detectDevTools(): SecurityCleanup {
    if (isOperaMini()) return () => {};
    const intervalId = window.setInterval(() => {
        if (isAdminUser()) return;
        try {
            const tracker = createTracker(() => {
                // Redirecting immediately here is too flaky; keep this as a softer signal.
            });
            console.log(tracker);
            console.clear();
        } catch {
            // ignore
        }
    }, 2000);

    return () => {
        window.clearInterval(intervalId);
    };
}

export function detectDebugger(): SecurityCleanup {
    if (isOperaMini()) return () => {};
    const intervalId = window.setInterval(() => {
        if (isAdminUser()) return;
        const start = performance.now();
        try {
            // eslint-disable-next-line no-debugger
            (function () { debugger; }());
        } catch {
            // ignore
        }
        const end = performance.now();

        if (end - start > 150) {
            redirect();
        }
    }, 1000);

    return () => {
        window.clearInterval(intervalId);
    };
}

export function clearConsolePeriodically(): SecurityCleanup {
    const intervalId = window.setInterval(() => {
        if (!isAdminUser()) console.clear();
    }, 2000);

    return () => {
        window.clearInterval(intervalId);
    };
}

export function aggressiveDevToolsDetection(): SecurityCleanup {
    if (isOperaMini()) return () => {};

    return combineCleanups(detectDevTools(), detectDebugger());
}
