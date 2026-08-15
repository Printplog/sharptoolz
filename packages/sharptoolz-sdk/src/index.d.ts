export type RenderFormat = "png" | "pdf";
export type RenderStatus = "queued" | "running" | "completed" | "failed";

export interface RenderJob {
  id: string;
  document_id: string;
  format: RenderFormat;
  status: RenderStatus;
  output_size: number;
  error_code: string;
  download_url: string | null;
  download_url_expires_in: number | null;
}

export interface WaitOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
  pollFallback?: boolean;
}

export interface SharpToolzOptions {
  apiKey: string;
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
  WebSocket?: typeof globalThis.WebSocket;
}

export interface TemplateSummary extends Record<string, unknown> {
  id: string;
  name: string;
  type: string;
  price: string;
  banner_url: string | null;
  version: number;
}

export interface HostedFormCreateInput {
  template_id: string;
  external_user_id: string;
  origin: string;
  mode?: "test" | "paid";
  preview_mode?: "standard" | "protected";
  theme?: Record<string, unknown>;
  ttl_minutes?: number;
}

export interface HostedFormEditInput {
  origin: string;
  preview_mode?: "standard" | "protected";
  theme?: Record<string, unknown>;
  ttl_minutes?: number;
}

export interface HostedFormSession {
  id: string;
  embed_url: string;
  origin: string;
  expires_at: string;
  operation: "create" | "edit";
  document_id: string | null;
}

export interface DocumentRecord extends Record<string, unknown> {
  id: string;
  template_id: string | null;
  template_name: string | null;
  external_user_id: string;
  name: string;
  mode: "test" | "paid";
  tracking_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentPage {
  next: string | null;
  previous: string | null;
  results: DocumentRecord[];
}

export class SharpToolzError extends Error {
  status: number;
  data: unknown;
}

export class SharpToolz {
  constructor(options: SharpToolzOptions);
  templates: {
    list(): Promise<{ results: TemplateSummary[] }>;
  };
  hostedForms: {
    create(input: HostedFormCreateInput): Promise<HostedFormSession>;
    edit(documentId: string, input: HostedFormEditInput): Promise<HostedFormSession>;
    revoke(sessionId: string): Promise<void>;
  };
  documents: {
    get(documentId: string): Promise<DocumentRecord>;
    list(options?: { externalUserId?: string; cursor?: string }): Promise<DocumentPage>;
    delete(documentId: string): Promise<void>;
    upgrade(documentId: string, options?: { idempotencyKey?: string }): Promise<DocumentRecord>;
    render(documentId: string, options?: { format?: RenderFormat; idempotencyKey?: string }): Promise<RenderJob>;
    renderAndWait(documentId: string, options?: WaitOptions & { format?: RenderFormat; idempotencyKey?: string }): Promise<RenderJob>;
  };
  renders: {
    get(jobId: string): Promise<RenderJob>;
    wait(jobOrId: RenderJob | string, options?: WaitOptions): Promise<RenderJob>;
  };
}

export { mountHostedForm } from "./browser.js";
