import { isAdminRoute, isOperaMini } from './helpers';

const redirect = () => {
    if (isAdminRoute() || isOperaMini()) return;
    window.location.replace('about:blank');
};

export function disableConsole() {
    const methods = ['log', 'debug', 'info', 'warn', 'error', 'assert', 'dir', 'dirxml', 'group', 'groupEnd', 'time', 'timeEnd', 'count', 'trace', 'profile', 'profileEnd'];
    methods.forEach(method => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window.console as any)[method] = () => { };
    });
    console.clear();
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

export function detectDevTools() {
    if (isOperaMini()) return;
    setInterval(() => {
        if (isAdminRoute()) return;
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
}

export function detectDebugger() {
    if (isOperaMini()) return;
    setInterval(() => {
        if (isAdminRoute()) return;
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
}

export function aggressiveDevToolsDetection() {
    if (isOperaMini()) return;

    // REMOVED MutationObserver: It triggers on every React render/DOM change,
    // which effectively bricks the app. 

    detectDevTools();
    detectDebugger();
}

export function clearConsolePeriodically() {
    setInterval(() => {
        if (!isAdminRoute()) console.clear();
    }, 2000);
}
