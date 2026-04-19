import type { SecurityOptions } from './helpers';
import {
    isDevelopment,
    isAdminUser,
    combineCleanups,
    type SecurityCleanup,
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
    aggressiveDevToolsDetection,
    detectDevToolsByDimensions,
    detectByRegExp
} from './detection';

export * from './helpers';
export * from './interaction';
export * from './shortcuts';
export * from './detection';

export function initSecurity(options: SecurityOptions = {}): SecurityCleanup {
    if (isDevelopment || isAdminUser()) {
        return () => {};
    }

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
        detectByRegExp: enableRegExpDetection = true,
        disablePrintScreen: enablePrintScreenBlock = true,
        detectDevToolsByDimensions: enableDimensionDetection = true,
        aggressiveDetection: enableAggressiveDetection = true,
    } = options;

    const cleanups: SecurityCleanup[] = [];

    if (enableRightClickBlock) cleanups.push(disableRightClick());
    if (enableTextSelectionBlock) cleanups.push(disableTextSelection());
    if (enableShortcutsBlock) cleanups.push(disableDevToolsShortcuts());
    if (enableConsoleDisable) cleanups.push(disableConsole());
    if (enableConsoleClear) cleanups.push(clearConsolePeriodically());
    if (enableDragDropBlock) cleanups.push(disableDragAndDrop());
    if (enableCopyPasteBlock) cleanups.push(disableCopyPaste());
    if (enablePrintScreenBlock) cleanups.push(disablePrintScreen());

    if (enableAggressiveDetection) {
        cleanups.push(aggressiveDevToolsDetection());
    } else {
        if (enableDevToolsDetection) cleanups.push(detectDevTools());
        if (enableDebuggerDetection) cleanups.push(detectDebugger());
        if (enableDimensionDetection) cleanups.push(detectDevToolsByDimensions());
        if (enableRegExpDetection) cleanups.push(detectByRegExp());
    }

    return combineCleanups(...cleanups);
}
