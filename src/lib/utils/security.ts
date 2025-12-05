/**
 * Security utilities to prevent inspection and protect code
 */

// Disable right-click context menu
export function disableRightClick() {
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  }, { capture: true });
}

// Disable text selection
export function disableTextSelection() {
  document.addEventListener('selectstart', (e) => {
    e.preventDefault();
    return false;
  }, { capture: true });

  // CSS approach
  document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      input, textarea, [contenteditable] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
    `;
    document.head.appendChild(style);
  });
} 

// Disable common DevTools keyboard shortcuts completely (just block, no redirect)
export function disableDevToolsShortcuts() {
  // Use both keydown and keyup to catch all cases
  const blockShortcut = (e: KeyboardEvent) => {
    // F12 - Open DevTools
    if (e.key === 'F12') {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }

    // Ctrl+Shift+I (Windows/Linux) or Cmd+Option+I (Mac) - Open DevTools
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }

    // Ctrl+Shift+J (Windows/Linux) or Cmd+Option+J (Mac) - Open Console
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }

    // Ctrl+Shift+C (Windows/Linux) or Cmd+Option+C (Mac) - Open Element Inspector
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }

    // Ctrl+U (Windows/Linux) or Cmd+Option+U (Mac) - View Source
    if ((e.ctrlKey || e.metaKey) && (e.key === 'U' || e.key === 'u')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }

    // Ctrl+Shift+K (Windows/Linux) - Open Console (Firefox)
    if (e.ctrlKey && e.shiftKey && (e.key === 'K' || e.key === 'k')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }

    // Ctrl+Shift+E (Windows/Linux) - Open Network Monitor (Firefox)
    if (e.ctrlKey && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    }

    // Disable Ctrl+S (Save Page)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'S' || e.key === 's')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Disable Ctrl+P (Print - can expose source)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'P' || e.key === 'p')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  };

  // Block on keydown (before browser processes it) - highest priority
  document.addEventListener('keydown', blockShortcut, { capture: true, passive: false });
  // Also block on keyup as backup
  document.addEventListener('keyup', blockShortcut, { capture: true, passive: false });
  // Block on keypress as well
  document.addEventListener('keypress', blockShortcut, { capture: true, passive: false });
  
  // Also block at window level for extra security
  window.addEventListener('keydown', blockShortcut, { capture: true, passive: false });
  window.addEventListener('keyup', blockShortcut, { capture: true, passive: false });
}

// Detect DevTools opening using console detection (reliable method)
export function detectDevTools() {
  let devtoolsDetected = false;
  
  setInterval(() => {
    if (devtoolsDetected) {
      // Keep redirecting if already detected
      window.location.replace('about:blank');
      return;
    }

    const element = new Image();
    let detected = false;
    
    Object.defineProperty(element, 'id', {
      get: function() {
        // This getter only executes if DevTools console is open and inspecting
        detected = true;
        return '';
      },
      configurable: false
    });

    // Add toString to catch more inspection cases
    Object.defineProperty(element, 'toString', {
      value: function() {
        detected = true;
        return '[object Image]';
      },
      configurable: false
    });

    try {
      console.log(element);
      console.clear();
      
      if (detected) {
        devtoolsDetected = true;
        console.clear();
        console.log('%c⚠️ Access Denied', 'color: red; font-size: 50px; font-weight: bold;');
        console.log('%cThis browser feature is restricted for security reasons.', 'color: red; font-size: 16px;');
        // Redirect immediately using replace (can't go back)
        window.location.replace('about:blank');
      }
    } catch (e) {
      // Ignore errors
    }
  }, 100); // Check every 100ms for very fast detection
}

// Disable console methods (but don't use dimension detection - too unreliable)
export function disableConsole() {
  // Override console methods
  const methods = ['log', 'debug', 'info', 'warn', 'error', 'assert', 'dir', 'dirxml', 'group', 'groupEnd', 'time', 'timeEnd', 'count', 'trace', 'profile', 'profileEnd'];
  
  methods.forEach(method => {
    (window.console as any)[method] = function(..._args: any[]) {
      // Don't actually log anything in production
      // Detection is handled by other methods (console detection and debugger)
    };
  });

  // Clear console
  console.clear();
}

// Detect if DevTools is open by checking window dimensions
// DISABLED - Too many false positives on different screen sizes
export function detectDevToolsByDimensions() {
  // This method is disabled as it causes false positives
  // Different devices and screen sizes trigger it incorrectly
  // Using console and debugger detection instead which are more reliable
  return;
}

// Clear console periodically and detect DevTools (console method only)
export function clearConsolePeriodically() {
  let devtoolsDetected = false;
  
  setInterval(() => {
    if (devtoolsDetected) {
      // Keep redirecting if already detected
      window.location.replace('about:blank');
      return;
    }

    // Console detection - most reliable method
    const element = new Image();
    let detected = false;
    
    Object.defineProperty(element, 'id', {
      get: function() {
        // This only executes if DevTools console is actually open
        detected = true;
        return '';
      },
      configurable: false
    });

    // Add toString to catch more inspection cases
    Object.defineProperty(element, 'toString', {
      value: function() {
        detected = true;
        return '[object Image]';
      },
      configurable: false
    });
    
    try {
      console.log(element);
      console.clear();
      
      if (detected) {
        devtoolsDetected = true;
        console.clear();
        console.log('%c⚠️ Developer Tools Detected', 'color: red; font-size: 30px; font-weight: bold;');
        // Redirect immediately using replace
        window.location.replace('about:blank');
      }
    } catch (e) {
      // Ignore errors
    }
  }, 100); // Check every 100ms for very fast detection
}

// Disable drag and drop to prevent saving assets
export function disableDragAndDrop() {
  document.addEventListener('dragstart', (e) => {
    e.preventDefault();
    return false;
  }, { capture: true });

  document.addEventListener('drop', (e) => {
    e.preventDefault();
    return false;
  }, { capture: true });

  // Disable image dragging
  document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
      img, svg {
        -webkit-user-drag: none !important;
        -khtml-user-drag: none !important;
        -moz-user-drag: none !important;
        -o-user-drag: none !important;
        user-drag: none !important;
        pointer-events: auto !important;
      }
    `;
    document.head.appendChild(style);
  });
}

// Disable copy/paste shortcuts (but allow in form fields)
export function disableCopyPaste() {
  document.addEventListener('copy', (e) => {
    const target = e.target as HTMLElement;
    // Allow copy in form fields and contenteditable elements
    if (
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.isContentEditable ||
      target.closest('input, textarea, [contenteditable]')
    ) {
      return; // Allow copy in form fields
    }
    e.clipboardData?.setData('text/plain', '');
    e.preventDefault();
    return false;
  }, { capture: true });

  document.addEventListener('cut', (e) => {
    const target = e.target as HTMLElement;
    // Allow cut in form fields and contenteditable elements
    if (
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.isContentEditable ||
      target.closest('input, textarea, [contenteditable]')
    ) {
      return; // Allow cut in form fields
    }
    e.clipboardData?.setData('text/plain', '');
    e.preventDefault();
    return false;
  }, { capture: true });

  document.addEventListener('paste', (e) => {
    const target = e.target as HTMLElement;
    // Allow paste in form fields and contenteditable elements
    if (
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.isContentEditable ||
      target.closest('input, textarea, [contenteditable]')
    ) {
      return; // Allow paste in form fields
    }
    e.preventDefault();
    return false;
  }, { capture: true });
}

// Detect if page is being inspected via debugger
export function detectDebugger() {
  let devtoolsDetected = false;
  
  setInterval(() => {
    if (devtoolsDetected) {
      // Keep redirecting if already detected
      window.location.replace('about:blank');
      return;
    }

    (function() {
      const start = performance.now();
      try {
        debugger; // This will pause if DevTools is open
      } catch (e) {
        // Ignore
      }
      const end = performance.now();
      // Lower threshold for faster detection
      if (end - start > 50) {
        // Debugger detected - redirect immediately
        devtoolsDetected = true;
        console.clear();
        console.log('%c⚠️ Debugger Detected', 'color: red; font-size: 30px; font-weight: bold;');
        window.location.replace('about:blank');
      }
    })();
  }, 150); // Check every 150ms for faster detection
}

// Disable print screen (partial - can't fully prevent but can detect)
export function disablePrintScreen() {
  document.addEventListener('keyup', (e) => {
    // Print Screen key
    if (e.key === 'PrintScreen') {
      e.preventDefault();
      // Show warning
      alert('Screenshots are not allowed for security reasons.');
      return false;
    }
  }, { capture: true });
}

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

// Aggressive DevTools detection with multiple reliable methods
export function aggressiveDevToolsDetection() {
  let devtoolsDetected = false;
  let checkCount = 0;
  
  const redirect = () => {
    // Once DevTools is detected, keep redirecting immediately
    if (!devtoolsDetected) {
      devtoolsDetected = true;
      console.clear();
      console.log('%c⚠️ Developer Tools Detected', 'color: red; font-size: 30px; font-weight: bold;');
      console.log('%cAccess to developer tools is restricted.', 'color: red; font-size: 16px;');
    }
    // Redirect immediately to browser home page (about:blank)
    // Use replace so they can't go back
    window.location.replace('about:blank');
  };

  // Method 1: Console detection using getter - Most reliable
  // This works because when DevTools console is open, it inspects logged objects
  const checkConsole = () => {
    if (devtoolsDetected) {
      redirect();
      return;
    }

    const element = new Image();
    let detected = false;
    
    // Create multiple getters to catch all inspection methods
    Object.defineProperty(element, 'id', {
      get: function() {
        detected = true;
        return '';
      },
      configurable: false
    });

    Object.defineProperty(element, 'src', {
      get: function() {
        detected = true;
        return '';
      },
      configurable: false
    });

    Object.defineProperty(element, 'width', {
      get: function() {
        detected = true;
        return 0;
      },
      configurable: false
    });

    Object.defineProperty(element, 'height', {
      get: function() {
        detected = true;
        return 0;
      },
      configurable: false
    });

    // Also add toString to catch more inspection cases
    Object.defineProperty(element, 'toString', {
      value: function() {
        detected = true;
        return '[object Image]';
      },
      configurable: false
    });

    Object.defineProperty(element, 'valueOf', {
      value: function() {
        detected = true;
        return '[object Image]';
      },
      configurable: false
    });

    try {
      // Use multiple console methods to catch manual menu opening
      console.log(element);
      console.info(element);
      console.warn(element);
      console.clear();
      
      if (detected) {
        redirect();
      }
    } catch (e) {
      // Ignore errors
    }
  };

  // Method 2: Debugger detection - Very reliable
  const checkDebugger = () => {
    if (devtoolsDetected) {
      redirect();
      return;
    }

    (function() {
      const start = performance.now();
      try {
        // This will pause if DevTools is open (even without breakpoints in some cases)
        debugger;
      } catch (e) {
        // Ignore
      }
      const end = performance.now();
      // If execution took longer than expected, DevTools likely paused it
      if (end - start > 50) {
        redirect();
      }
    })();
  };

  // Method 3: Console.dir detection (alternative console method)
  const checkConsoleDir = () => {
    if (devtoolsDetected) {
      redirect();
      return;
    }

    const testObj: any = {};
    let detected = false;
    
    Object.defineProperty(testObj, 'test', {
      get: function() {
        detected = true;
        return 'test';
      },
      configurable: false
    });

    try {
      console.dir(testObj);
      console.clear();
      
      if (detected) {
        redirect();
      }
    } catch (e) {
      // Ignore errors
    }
  };

  // Also add a MutationObserver to detect DOM inspection
  const observer = new MutationObserver(() => {
    if (devtoolsDetected) {
      redirect();
    }
  });

  // Observe document changes (DevTools might cause mutations)
  try {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true
    });
  } catch (e) {
    // Ignore
  }

  // Also monitor for focus loss (DevTools often steals focus when opened manually)
  let focusLostCount = 0;
  const checkFocus = () => {
    if (devtoolsDetected) {
      redirect();
      return;
    }

    if (document.hasFocus && !document.hasFocus()) {
      focusLostCount++;
      // If focus is lost multiple times quickly, might be DevTools
      if (focusLostCount > 2) {
        // Double-check with console detection
        const testElement = new Image();
        let detected = false;
        Object.defineProperty(testElement, 'id', {
          get: function() {
            detected = true;
            return '';
          }
        });
        try {
          console.log(testElement);
          console.clear();
          if (detected) {
            redirect();
          }
        } catch (e) {
          // Ignore
        }
      }
    } else {
      focusLostCount = 0;
    }
  };

  // Run all checks very frequently
  setInterval(() => {
    if (devtoolsDetected) {
      redirect(); // Keep redirecting
      return;
    }

    checkCount++;
    
    // Run console check every iteration (most reliable) - catches manual menu trigger
    checkConsole();
    
    // Run debugger check every iteration for faster detection
    checkDebugger();
    
    // Run console.dir check every iteration for manual menu detection
    checkConsoleDir();
    
    // Check focus every iteration
    checkFocus();
    
    // Reset counter periodically
    if (checkCount > 100) {
      checkCount = 0;
    }
  }, 30); // Check every 30ms for very fast detection - almost immediate
}

// Initialize all security measures
export function initSecurity(options: {
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
  disablePrintScreen?: boolean;
  aggressiveDetection?: boolean;
} = {}) {
  // Skip security in development mode (allow debugging)
  if (isDevelopment) {
    console.log('%c🔧 Development Mode - Security measures disabled', 'color: orange; font-size: 14px;');
    return;
  }

  const {
    disableRightClick: enableRightClickBlock = true,
    disableTextSelection: enableTextSelectionBlock = true,
    disableDevToolsShortcuts: enableShortcutsBlock = true,
    detectDevTools: enableDevToolsDetection = true,
    disableConsole: enableConsoleDisable = true,
    detectDevToolsByDimensions: enableDimensionsDetection = true,
    clearConsolePeriodically: enableConsoleClear = true,
    disableDragAndDrop: enableDragDropBlock = true,
    disableCopyPaste: enableCopyPasteBlock = true,
    detectDebugger: enableDebuggerDetection = true,
    disablePrintScreen: enablePrintScreenBlock = true,
    aggressiveDetection: enableAggressiveDetection = true,
  } = options;

  // Start aggressive detection first (most important)
  if (enableAggressiveDetection) {
    aggressiveDevToolsDetection();
  }

  if (enableRightClickBlock) {
    disableRightClick();
  }

  if (enableTextSelectionBlock) {
    disableTextSelection();
  }

  if (enableShortcutsBlock) {
    disableDevToolsShortcuts();
  }

  if (enableDevToolsDetection) {
    detectDevTools();
  }

  if (enableConsoleDisable) {
    disableConsole();
  }

  if (enableDimensionsDetection) {
    detectDevToolsByDimensions();
  }

  if (enableConsoleClear) {
    clearConsolePeriodically();
  }

  if (enableDragDropBlock) {
    disableDragAndDrop();
  }

  if (enableCopyPasteBlock) {
    disableCopyPaste();
  }

  if (enableDebuggerDetection) {
    detectDebugger();
  }

  if (enablePrintScreenBlock) {
    disablePrintScreen();
  }

  // Add warning message
  console.log('%c⚠️ STOP!', 'color: red; font-size: 50px; font-weight: bold;');
  console.log('%cThis is a browser feature intended for developers. If someone told you to copy-paste something here, it is a scam and will give them access to your account.', 'color: red; font-size: 16px;');
}

