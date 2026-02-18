import { isAdminRoute, isOperaMini } from './helpers';

const redirect = () => {
    if (isAdminRoute() || isOperaMini()) return;
    window.location.replace('about:blank');
};

export function disableConsole() {
    const methods = ['log', 'debug', 'info', 'warn', 'error', 'assert', 'dir', 'dirxml', 'group', 'groupEnd', 'time', 'timeEnd', 'count', 'trace', 'profile', 'profileEnd'];
    methods.forEach(method => {
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
    if (isOperaMini()) return; // Skip for proxy browsers
    setInterval(() => {
        if (isAdminRoute()) return;
        try {
            const tracker = createTracker(redirect);
            console.log(tracker);
            console.clear();
        } catch (e) { }
    }, 1000);
}

export function detectDebugger() {
    if (isOperaMini()) return;
    setInterval(() => {
        if (isAdminRoute()) return;
        const start = performance.now();
        try { debugger; } catch (e) { }
        if (performance.now() - start > 50) redirect();
    }, 500);
}

export function aggressiveDevToolsDetection() {
    if (isOperaMini()) return;

    const observer = new MutationObserver(() => {
        if (!isAdminRoute()) redirect();
    });

    try {
        observer.observe(document.documentElement, {
            childList: true, subtree: true, attributes: true
        });
    } catch (e) { }

    detectDevTools();
    detectDebugger();
}

export function clearConsolePeriodically() {
    setInterval(() => {
        if (!isAdminRoute()) console.clear();
    }, 2000);
}
