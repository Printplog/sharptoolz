import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { otpFromClipboardText, useClipboardOtp } from './useClipboardOtp';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('otpFromClipboardText', () => {
  it('accepts 6-digit codes, including the spaced form authenticators show', () => {
    expect(otpFromClipboardText('123456')).toBe('123456');
    expect(otpFromClipboardText(' 123 456\n')).toBe('123456');
    expect(otpFromClipboardText('123-456')).toBe('123456');
  });

  it('ignores anything that is not just a code', () => {
    expect(otpFromClipboardText('12345')).toBeNull();
    expect(otpFromClipboardText('1234567')).toBeNull();
    expect(otpFromClipboardText('code 123456')).toBeNull();
    expect(otpFromClipboardText('+234 803 123 4567')).toBeNull();
    expect(otpFromClipboardText('')).toBeNull();
  });
});

function Probe({ enabled, onCode }: { enabled: boolean; onCode: (code: string) => void }) {
  useClipboardOtp({ enabled, onCode });
  return null;
}

describe('useClipboardOtp', () => {
  let clipboardText = '';
  let permission: PermissionState = 'granted';

  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    vi.spyOn(document, 'hasFocus').mockReturnValue(true);
    Object.defineProperty(navigator, 'clipboard', {
      value: { readText: vi.fn(async () => clipboardText) },
      configurable: true,
    });
    Object.defineProperty(navigator, 'permissions', {
      value: { query: vi.fn(async () => ({ state: permission })) },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  async function mount(enabled: boolean, onCode: (code: string) => void) {
    const root = createRoot(document.createElement('div'));
    await act(async () => root.render(<Probe enabled={enabled} onCode={onCode} />));
    return () => act(() => root.unmount());
  }

  it('sends a code that is already on the clipboard when the page opens', async () => {
    clipboardText = '482 913';
    const onCode = vi.fn();
    const unmount = await mount(true, onCode);
    expect(onCode).toHaveBeenCalledWith('482913');
    unmount();
  });

  it('picks up a code copied later, and tries each code only once', async () => {
    clipboardText = 'hello';
    const onCode = vi.fn();
    const unmount = await mount(true, onCode);
    expect(onCode).not.toHaveBeenCalled();

    clipboardText = '111222';
    await act(async () => { await vi.advanceTimersByTimeAsync(1600); });
    await act(async () => { await vi.advanceTimersByTimeAsync(1600); });
    window.dispatchEvent(new Event('focus'));
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(onCode).toHaveBeenCalledTimes(1);
    expect(onCode).toHaveBeenCalledWith('111222');
    unmount();
  });

  it('does nothing when disabled or when clipboard access is denied', async () => {
    clipboardText = '123456';
    const onCode = vi.fn();
    const unmountDisabled = await mount(false, onCode);
    unmountDisabled();

    permission = 'denied';
    const unmountDenied = await mount(true, onCode);
    expect(onCode).not.toHaveBeenCalled();
    expect(navigator.clipboard.readText).not.toHaveBeenCalled();
    unmountDenied();
    permission = 'granted';
  });
});
