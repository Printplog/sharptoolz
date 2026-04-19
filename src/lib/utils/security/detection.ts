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
        
        // Replace with a conditional wrapper
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
            // Using a more reliable detection method that doesn't trigger on every render
            // This is a common trick: some browsers lag when devtools is open
            // but we use it with a very high threshold to avoid false positives on slow devices
            const tracker = createTracker(() => {
                // Instead of immediate redirect, we can just clear console or flag
                // Redirecting is too aggressive if flaky
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
            // Only execute debugger if we are NOT in production usually, 
            // but here we want to detect it.
            // Increased threshold significantly for slow devices
            // eslint-disable-next-line no-debugger
            (function () { debugger; }());
        } catch {
            // ignore
        }
        const end = performance.now();
        if (end - start > 150) {
            // Only redirect if it's very likely a debugger (halted execution)
            redirect();
        }
    }, 1000);

    return () => {
        window.clearInterval(intervalId);
    };
}

export function aggressiveDevToolsDetection(): SecurityCleanup {
    if (isOperaMini()) return () => {};

    // REMOVED MutationObserver: It triggers on every React render/DOM change,
    // which effectively bricks the app. 

    return combineCleanups(detectDevTools(), detectDebugger());
}

export function clearConsolePeriodically(): SecurityCleanup {
    const intervalId = window.setInterval(() => {
        if (!isAdminUser()) console.clear();
    }, 2000);

    return () => {
        window.clearInterval(intervalId);
    };
}
