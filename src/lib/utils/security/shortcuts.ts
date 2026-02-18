

export function disableDevToolsShortcuts() {
    const blockShortcut = (e: Event) => {
        const kbEvent = e as KeyboardEvent;
        const target = kbEvent.target as HTMLElement;
        const isField =
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable ||
            target.closest('input, textarea, [contenteditable]');

        const isDevToolsShortcut =
            kbEvent.key === 'F12' ||
            ((kbEvent.ctrlKey || kbEvent.metaKey) && kbEvent.shiftKey && ['I', 'J', 'C'].includes(kbEvent.key.toUpperCase())) ||
            ((kbEvent.ctrlKey || kbEvent.metaKey) && (kbEvent.key.toUpperCase() === 'U'));

        if (isField && !isDevToolsShortcut) return;

        if (isDevToolsShortcut ||
            ((kbEvent.ctrlKey || kbEvent.metaKey) && ['S', 'P'].includes(kbEvent.key.toUpperCase()))) {
            kbEvent.preventDefault();
            kbEvent.stopPropagation();
            kbEvent.stopImmediatePropagation();
        }
    };

    const events: Array<keyof WindowEventMap> = ['keydown', 'keyup', 'keypress'];
    events.forEach(type => {
        document.addEventListener(type, blockShortcut, { capture: true, passive: false });
        window.addEventListener(type, blockShortcut, { capture: true, passive: false });
    });
}

export function disablePrintScreen() {
    document.addEventListener('keyup', (e) => {
        if (e.key === 'PrintScreen') {
            e.preventDefault();
            alert('Screenshots are not allowed for security reasons.');
        }
    }, { capture: true });
}
