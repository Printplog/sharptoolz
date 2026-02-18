import { isAdminRoute } from './helpers';

export function disableRightClick() {
    document.addEventListener('contextmenu', (e) => {
        if (isAdminRoute()) return;

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
        return false;
    }, { capture: true });
}

export function disableTextSelection() {
    document.addEventListener('selectstart', (e) => {
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
        return false;
    }, { capture: true });

    document.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style');
        style.textContent = `
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
    `;
        document.head.appendChild(style);
    });
}

export function disableDragAndDrop() {
    document.addEventListener('dragstart', (e) => {
        e.preventDefault();
        return false;
    }, { capture: true });

    document.addEventListener('drop', (e) => {
        e.preventDefault();
        return false;
    }, { capture: true });

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

export function disableCopyPaste() {
    document.addEventListener('copy', (e) => {
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
        return false;
    }, { capture: true });

    ['cut', 'paste'].forEach(event => {
        document.addEventListener(event, (e) => {
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
            return false;
        }, { capture: true });
    });
}
