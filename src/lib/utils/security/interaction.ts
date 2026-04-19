import type { SecurityCleanup } from './helpers';
import { isAdminUser } from './helpers';

const appendSecurityStyle = (styleId: string, cssText: string): SecurityCleanup => {
    const style = document.createElement('style');
    style.dataset.securityStyle = styleId;
    style.textContent = cssText;
    document.head.appendChild(style);

    return () => {
        style.remove();
    };
};

export function disableRightClick(): SecurityCleanup {
    const handleContextMenu = (e: MouseEvent) => {
        if (isAdminUser()) return;

        const target = e.target as HTMLElement;
        if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable ||
            target.closest('input, textarea, [contenteditable]')
        ) {
            return;
        }

        e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu, { capture: true });

    return () => {
        document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
    };
}

export function disableTextSelection(): SecurityCleanup {
    const handleSelectStart = (e: Event) => {
        if (isAdminUser()) return;

        const target = e.target as HTMLElement;
        if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable ||
            target.closest('input, textarea, [contenteditable]')
        ) {
            return;
        }
        e.preventDefault();
    };

    document.addEventListener('selectstart', handleSelectStart, { capture: true });

    const removeStyle = appendSecurityStyle('disable-text-selection', `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      input, textarea, [contenteditable], [contenteditable] * {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
    `);

    return () => {
        document.removeEventListener('selectstart', handleSelectStart, { capture: true });
        removeStyle();
    };
}

export function disableDragAndDrop(): SecurityCleanup {
    const handleDragStart = (e: DragEvent) => {
        if (isAdminUser()) return;
        e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
        if (isAdminUser()) return;
        e.preventDefault();
    };

    document.addEventListener('dragstart', handleDragStart, { capture: true });
    document.addEventListener('drop', handleDrop, { capture: true });

    const removeStyle = appendSecurityStyle('disable-drag-drop', `
      img, svg {
        -webkit-user-drag: none !important;
        -khtml-user-drag: none !important;
        -moz-user-drag: none !important;
        -o-user-drag: none !important;
        user-drag: none !important;
        pointer-events: auto !important;
      }
    `);

    return () => {
        document.removeEventListener('dragstart', handleDragStart, { capture: true });
        document.removeEventListener('drop', handleDrop, { capture: true });
        removeStyle();
    };
}

export function disableCopyPaste(): SecurityCleanup {
    const handleCopy = (e: ClipboardEvent) => {
        if (isAdminUser()) return;

        const target = e.target as HTMLElement;
        if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable ||
            target.closest('input, textarea, [contenteditable]')
        ) {
            return;
        }
        e.clipboardData?.setData('text/plain', '');
        e.preventDefault();
    };

    document.addEventListener('copy', handleCopy, { capture: true });

    const events: Array<keyof DocumentEventMap> = ['cut', 'paste'];
    const handlers = events.map(event => {
        const handler = (e: Event) => {
            if (isAdminUser()) return;

            const target = e.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable ||
                target.closest('input, textarea, [contenteditable]')
            ) {
                return;
            }
            e.preventDefault();
        };

        document.addEventListener(event, handler, { capture: true });
        return { event, handler };
    });

    return () => {
        document.removeEventListener('copy', handleCopy, { capture: true });
        handlers.forEach(({ event, handler }) => {
            document.removeEventListener(event, handler, { capture: true });
        });
    };
}
