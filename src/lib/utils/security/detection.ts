import type { SecurityCleanup } from './helpers';
import { combineCleanups, isOperaMini, isAdminUser } from './helpers';

const redirect = () => {
    if (isAdminUser() || isOperaMini()) return;
    // Redirect to a blank page if devtools are detected
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

/**
 * Creates a "poisoned" object that triggers a callback when its properties are accessed.
 * This is effective because browsers often access these properties when rendering the console.
 */
const createTracker = (callback: () => void) => {
    const element = new Image();
    let detected = false;
    const trigger = () => { 
        if (!detected) { 
            detected = true; 
            callback(); 
        } 
    };

    // Multiple triggers for various browser behaviors
    Object.defineProperty(element, 'id', { get: trigger, configurable: true });
    Object.defineProperty(element, 'nodeType', { get: trigger, configurable: true });
    Object.defineProperty(element, 'src', { get: trigger, configurable: true });
    
    // Some browsers use toString or valueOf when logging to console
    element.toString = trigger as any;
    element.valueOf = trigger as any;

    return element;
};

export function detectDevTools(): SecurityCleanup {
    if (isOperaMini()) return () => {};
    
    const intervalId = window.setInterval(() => {
        if (isAdminUser()) return;
        
        try {
            const tracker = createTracker(() => {
                redirect();
            });
            
            /**
             * Some browsers only evaluate the object properties when it's actually 
             * rendered in the console. Periodic logging helps catch this.
             */
            // eslint-disable-next-line no-console
            console.log(tracker);
            // eslint-disable-next-line no-console
            console.clear();
        } catch {
            // ignore
        }
    }, 1000);

    return () => {
        window.clearInterval(intervalId);
    };
}

/**
 * Detects DevTools by checking the difference between window inner and outer dimensions.
 * Improved to prevent false positives from normal window resizing or zooming.
 */
export function detectDevToolsByDimensions(): SecurityCleanup {
    if (isOperaMini()) return () => {};
    
    let lastOuterWidth = window.outerWidth;
    let lastOuterHeight = window.outerHeight;
    
    const check = () => {
        if (isAdminUser()) return;
        
        const threshold = 160;
        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;
        
        /**
         * If the outer window size hasn't changed, but the difference between
         * outer and inner dimensions is large, it means something (like DevTools)
         * is taking up space inside the browser window.
         */
        if (window.outerWidth === lastOuterWidth && window.outerHeight === lastOuterHeight) {
            if (widthDiff > threshold || heightDiff > threshold) {
                redirect();
            }
        }
        
        lastOuterWidth = window.outerWidth;
        lastOuterHeight = window.outerHeight;
    };

    window.addEventListener('resize', check);
    // Also check periodically in case resize doesn't fire
    const intervalId = window.setInterval(check, 1000);
    
    check();

    return () => {
        window.removeEventListener('resize', check);
        window.clearInterval(intervalId);
    };
}

/**
 * The most aggressive detection method. Uses 'debugger' to pause execution.
 * If DevTools is open, the 'debugger' statement will trigger and cause a 
 * noticeable delay in execution time, which we can detect.
 */
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
        
        // If it took longer than 100ms, it's highly likely DevTools is open
        if (end - start > 100) {
            redirect();
        }
    }, 400); // Check even more frequently

    return () => {
        window.clearInterval(intervalId);
    };
}

/**
 * Periodically clears the console to make it harder to see any logs.
 */
export function clearConsolePeriodically(): SecurityCleanup {
    const intervalId = window.setInterval(() => {
        if (!isAdminUser()) {
            // eslint-disable-next-line no-console
            console.clear();
        }
    }, 1500);

    return () => {
        window.clearInterval(intervalId);
    };
}

/**
 * A very sneaky detection method using a RegExp object.
 * Some browser DevTools will call the toString method of a regex when it's logged.
 */
export function detectByRegExp(): SecurityCleanup {
    if (isOperaMini()) return () => {};
    
    const devtools = /./;
    let detected = false;
    
    devtools.toString = function() {
        if (!detected && !isAdminUser()) {
            detected = true;
            redirect();
        }
        return 'devtools-detector';
    };

    const intervalId = window.setInterval(() => {
        if (isAdminUser()) return;
        // eslint-disable-next-line no-console
        console.log(devtools);
    }, 1000);

    return () => {
        window.clearInterval(intervalId);
    };
}

export function aggressiveDevToolsDetection(): SecurityCleanup {
    if (isOperaMini()) return () => {};

    return combineCleanups(
        detectDevTools(), 
        detectDebugger(),
        detectDevToolsByDimensions(),
        detectByRegExp(),
        clearConsolePeriodically()
    );
}
