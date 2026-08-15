export interface HostedFormOptions {
  embedUrl: string;
  title?: string;
  height?: number;
  borderRadius?: string;
  autoResize?: boolean;
  onReady?: () => void;
  onComplete?: (result: { documentId: string; sessionId: string }) => void;
  onError?: (error: { message: string; sessionId: string }) => void;
}

export function mountHostedForm(
  target: string | HTMLElement,
  options: HostedFormOptions,
): { iframe: HTMLIFrameElement; destroy(): void };
