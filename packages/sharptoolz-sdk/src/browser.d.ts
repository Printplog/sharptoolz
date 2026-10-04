export interface HostedFormLoadingOptions {
  /** Status text announced to assistive technology. Defaults to “Loading form…”. */
  text?: string;
  /** Customer-owned logo shown above the spinner. */
  logoUrl?: string;
  logoAlt?: string;
  logoWidth?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  fontFamily?: string;
  textSize?: string;
  /** A customer-created element. The SDK moves it into the loading overlay. */
  element?: HTMLElement;
}

export interface HostedFormOptions {
  embedUrl: string;
  title?: string;
  height?: number;
  borderRadius?: string;
  autoResize?: boolean;
  /** Set to false to reveal the iframe immediately, or style/replace the neutral loader. */
  loading?: false | HostedFormLoadingOptions;
  onReady?: () => void;
  onComplete?: (result: { documentId: string; sessionId: string }) => void;
  onError?: (error: { message: string; sessionId: string }) => void;
}

export function mountHostedForm(
  target: string | HTMLElement,
  options: HostedFormOptions,
): { iframe: HTMLIFrameElement; destroy(): void };
