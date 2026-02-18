import { isAdminRoute } from './helpers';

export function disableDevToolsShortcuts() {
    const blockShortcut = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        const isField =
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable ||
            target.closest('input, textarea, [contenteditable]');

        const isDevToolsShortcut =
            e.key === 'F12' ||
            ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
            ((e.ctrlKey || e.metaKey) && (e.key.toUpperCase() === 'U'));

        if (isField && !isDevToolsShortcut) return;

        if (isDevToolsShortcut ||
            ((e.ctrlKey || e.metaKey) && ['S', 'P'].includes(e.key.toUpperCase()))) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
        }
    };

    ['keydown', 'keyup', 'keypress'].forEach(type => {
        document.addEventListener(type, blockShortcut, { capture: true, passive: false });
        window.addEventListener(type, blockShortcut, { capture: true, passive: false });
    });
}

export function disablePrintScreen() {
    document.addEventListener('keyup', (e) => {
        if (e.key === 'PrintScreen') {
            e.preventDefault();
            alert('Screenshots are not allowed for security reasons.');
            return false;
        }
    }, { capture: true });
}
