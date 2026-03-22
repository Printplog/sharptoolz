// Minimal setup file

// jsdom doesn't implement CSS.escape — polyfill it
if (typeof CSS === 'undefined' || !CSS.escape) {
  (globalThis as any).CSS = {
    escape: (value: string) => value.replace(/([^\w-])/g, '\\$1'),
  };
}

export {};
