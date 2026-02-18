import type { SecurityOptions } from './helpers';
import {
    isDevelopment,
    isAdminRoute
} from './helpers';

import {
    disableRightClick,
    disableTextSelection,
    disableDragAndDrop,
    disableCopyPaste
} from './interaction';
import {
    disableDevToolsShortcuts,
    disablePrintScreen
} from './shortcuts';
import {
    detectDevTools,
    disableConsole,
    clearConsolePeriodically,
    detectDebugger,
    aggressiveDevToolsDetection
} from './detection';

export * from './helpers';
export * from './interaction';
export * from './shortcuts';
export * from './detection';

export function initSecurity(options: SecurityOptions = {}) {
    if (isDevelopment || isAdminRoute()) return;

    const {
        disableRightClick: enableRightClickBlock = true,
        disableTextSelection: enableTextSelectionBlock = true,
        disableDevToolsShortcuts: enableShortcutsBlock = true,
        detectDevTools: enableDevToolsDetection = true,
        disableConsole: enableConsoleDisable = true,
        clearConsolePeriodically: enableConsoleClear = true,
        disableDragAndDrop: enableDragDropBlock = true,
        disableCopyPaste: enableCopyPasteBlock = true,
        detectDebugger: enableDebuggerDetection = true,
        disablePrintScreen: enablePrintScreenBlock = true,
        aggressiveDetection: enableAggressiveDetection = true,
    } = options;

    if (enableAggressiveDetection) aggressiveDevToolsDetection();
    if (enableRightClickBlock) disableRightClick();
    if (enableTextSelectionBlock) disableTextSelection();
    if (enableShortcutsBlock) disableDevToolsShortcuts();
    if (enableDevToolsDetection) detectDevTools();
    if (enableConsoleDisable) disableConsole();
    if (enableConsoleClear) clearConsolePeriodically();
    if (enableDragDropBlock) disableDragAndDrop();
    if (enableCopyPasteBlock) disableCopyPaste();
    if (enableDebuggerDetection) detectDebugger();
    if (enablePrintScreenBlock) disablePrintScreen();
}
