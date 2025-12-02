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

// Disable common DevTools keyboard shortcuts
export function disableDevToolsShortcuts() {
  document.addEventListener('keydown', (e) => {
    // F12 - Open DevTools
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }

    // Ctrl+Shift+I (Windows/Linux) or Cmd+Option+I (Mac) - Open DevTools
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      return false;
    }

    // Ctrl+Shift+J (Windows/Linux) or Cmd+Option+J (Mac) - Open Console
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') {
      e.preventDefault();
      return false;
    }

    // Ctrl+Shift+C (Windows/Linux) or Cmd+Option+C (Mac) - Open Element Inspector
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      return false;
    }

    // Ctrl+U (Windows/Linux) or Cmd+Option+U (Mac) - View Source
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();
      return false;
    }

    // Ctrl+Shift+K (Windows/Linux) - Open Console (Firefox)
    if (e.ctrlKey && e.shiftKey && e.key === 'K') {
      e.preventDefault();
      return false;
    }

    // Ctrl+Shift+E (Windows/Linux) - Open Network Monitor (Firefox)
    if (e.ctrlKey && e.shiftKey && e.key === 'E') {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+S (Save Page)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      return false;
    }

    // Disable Ctrl+P (Print - can expose source)
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      return false;
    }
  }, { capture: true });
}

// Detect DevTools opening using console detection
export function detectDevTools() {
  let devtools = false;
  const element = new Image();
  
  Object.defineProperty(element, 'id', {
    get: function() {
      if (!devtools) {
        devtools = true;
        // DevTools detected - you can redirect, close, or show warning
        console.clear();
        console.log('%c⚠️ Access Denied', 'color: red; font-size: 50px; font-weight: bold;');
        console.log('%cThis browser feature is restricted for security reasons.', 'color: red; font-size: 16px;');
        // Optionally redirect or close window
        // window.location.href = '/';
        // window.close();
      }
      return '';
    }
  });

  setInterval(() => {
    devtools = false;
    console.log(element);
    console.clear();
  }, 1000);
}

// Disable console methods
export function disableConsole() {
  // Override console methods
  const noop = () => {};
  const methods = ['log', 'debug', 'info', 'warn', 'error', 'assert', 'dir', 'dirxml', 'group', 'groupEnd', 'time', 'timeEnd', 'count', 'trace', 'profile', 'profileEnd'];
  
  methods.forEach(method => {
    (window.console as any)[method] = noop;
  });

  // Clear console
  console.clear();
}

// Detect if DevTools is open by checking window dimensions
export function detectDevToolsByDimensions() {
  setInterval(() => {
    const threshold = 160; // DevTools usually makes window wider
    if (
      window.outerHeight - window.innerHeight > threshold ||
      window.outerWidth - window.innerWidth > threshold
    ) {
      // DevTools might be open
      console.clear();
      console.log('%c⚠️ Developer Tools Detected', 'color: red; font-size: 30px; font-weight: bold;');
      console.log('%cAccess to developer tools is restricted.', 'color: red; font-size: 16px;');
    }
  }, 500);
}

// Clear console periodically
export function clearConsolePeriodically() {
  setInterval(() => {
    console.clear();
  }, 1000);
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
  setInterval(() => {
    (function() {
      const start = performance.now();
      debugger; // This will pause if DevTools is open
      const end = performance.now();
      if (end - start > 100) {
        // Debugger detected
        console.clear();
        console.log('%c⚠️ Debugger Detected', 'color: red; font-size: 30px; font-weight: bold;');
        // Optionally redirect
        // window.location.href = '/';
      }
    })();
  }, 1000);
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
  } = options;

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

