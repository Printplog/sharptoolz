import type { SecurityCleanup } from './helpers';
import { combineCleanups, isOperaMini, isAdminUser } from './helpers';

const redirect = () => {
    if (isAdminUser() || isOperaMini()) return;
    
    // INSTANT BLACKOUT: Nuke the DOM immediately so they see nothing
    try {
        document.documentElement.innerHTML = '<body style="background:black !important;"></body>';
        window.stop(); // Stop all further loading
    } catch {
        // ignore
    }
    
    // Final redirect to a blank page
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
            } else {
                // If a non-admin even tries to log, we can trigger a check
                redirect();
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
            
            // Log the tracker. If DevTools is open, the browser accesses properties IMMEDIATELY.
            // eslint-disable-next-line no-console
            console.log(tracker);
            // eslint-disable-next-line no-console
            console.clear();
        } catch {
            // ignore
        }
    }, 200); // 5 times per second

    return () => {
        window.clearInterval(intervalId);
    };
}

/**
 * Detects DevTools by checking window inner and outer dimensions.
 * Super aggressive 100ms check.
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
        
        if (window.outerWidth === lastOuterWidth && window.outerHeight === lastOuterHeight) {
            if (widthDiff > threshold || heightDiff > threshold) {
                redirect();
            }
        }
        
        lastOuterWidth = window.outerWidth;
        lastOuterHeight = window.outerHeight;
    };

    window.addEventListener('resize', check);
    const intervalId = window.setInterval(check, 100); // Check every 100ms
    
    check();

    return () => {
        window.removeEventListener('resize', check);
        window.clearInterval(intervalId);
    };
}

/**
 * REPLACED 'debugger' with a high-speed execution check.
 * Improved to prevent false positives on slower devices.
 */
export function detectDebugger(): SecurityCleanup {
    if (isOperaMini()) return () => {};
    
    let failCount = 0;
    
    const intervalId = window.setInterval(() => {
        if (isAdminUser()) return;
        
        const start = performance.now();
        // A smaller, more stable loop
        for (let i = 0; i < 50000; i++) {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            Math.sqrt(i) * Math.atan(i);
        }
        const end = performance.now();
        
        // On most devices, this takes < 2ms. 
        // DevTools "observation" usually slows this down by 10x-50x.
        // We use 150ms as a safe threshold for slow devices.
        if (end - start > 150) {
            failCount++;
        } else {
            failCount = 0; // Reset on success
        }

        // Only redirect if we see 3 consecutive slow-downs
        if (failCount > 3) {
            redirect();
        }
    }, 1000); // Check every second instead of 500ms to reduce CPU load

    return () => {
        window.clearInterval(intervalId);
    };
}

/**
 * Periodically clears the console and logs the tracker.
 */
export function clearConsolePeriodically(): SecurityCleanup {
    const intervalId = window.setInterval(() => {
        if (!isAdminUser()) {
            // eslint-disable-next-line no-console
            console.clear();
        }
    }, 1000);

    return () => {
        window.clearInterval(intervalId);
    };
}

/**
 * A very sneaky detection method using a RegExp object.
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
    }, 200);

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
