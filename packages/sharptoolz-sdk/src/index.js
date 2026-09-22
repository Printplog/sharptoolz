import { mountHostedForm } from "./browser.js";

const DEFAULT_BASE_URL = "https://api.sharptoolz.com/api/v1";
const TERMINAL_STATUSES = new Set(["completed", "failed"]);

export class SharpToolzError extends Error {
  constructor(message, { status = 0, data = null } = {}) {
    super(message);
    this.name = "SharpToolzError";
    this.status = status;
    this.data = data;
  }
}

function randomIdempotencyKey() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `stz-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeCursor(cursor) {
  if (!cursor) return "";
  try {
    return new URL(cursor).searchParams.get("cursor") || cursor;
  } catch {
    return cursor;
  }
}

function downloadFilename(response, job) {
  const disposition = response.headers.get("content-disposition") || "";
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try { return decodeURIComponent(encoded); } catch { /* use the regular filename */ }
  }
  const regular = disposition.match(/filename="?([^";]+)"?/i)?.[1];
  return regular || `sharptoolz-${job.document_id}.${job.format}`;
}

function abortError() {
  return new DOMException("The operation was aborted.", "AbortError");
}

function delay(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const timer = setTimeout(resolve, milliseconds);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(abortError());
    }, { once: true });
  });
}

export class SharpToolz {
  constructor({ apiKey, baseUrl = DEFAULT_BASE_URL, fetch: fetchImpl = globalThis.fetch, WebSocket: WebSocketImpl } = {}) {
    if (!apiKey || typeof apiKey !== "string" || !apiKey.startsWith("stz_live_")) {
      throw new TypeError("A SharpToolz server API key is required.");
    }
    if (typeof fetchImpl !== "function") throw new TypeError("A fetch implementation is required.");
    this.apiKey = apiKey;
    this.baseUrl = String(baseUrl).replace(/\/+$/, "");
    this.fetch = fetchImpl;
    this.WebSocketImpl = WebSocketImpl;

    this.templates = Object.freeze({
      list: () => this.request("/templates"),
    });
    this.hostedForms = Object.freeze({
      create: (input) => this.request("/embed-sessions", { method: "POST", body: input }),
      edit: (documentId, input) => this.request(`/documents/${encodeURIComponent(documentId)}/session`, {
        method: "POST",
        body: input,
      }),
      revoke: (sessionId) => this.request(`/embed-sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" }),
    });
    this.documents = Object.freeze({
      get: (documentId) => this.request(`/documents/${encodeURIComponent(documentId)}`),
      list: ({ externalUserId, cursor } = {}) => {
        const query = new URLSearchParams();
        if (externalUserId) query.set("external_user_id", externalUserId);
        if (cursor) query.set("cursor", normalizeCursor(cursor));
        return this.request(`/documents${query.size ? `?${query}` : ""}`);
      },
      delete: (documentId) => this.request(`/documents/${encodeURIComponent(documentId)}`, {
        method: "DELETE",
      }),
      upgrade: (documentId, { idempotencyKey = randomIdempotencyKey() } = {}) => this.request(
        `/documents/${encodeURIComponent(documentId)}/upgrade`,
        { method: "POST", idempotencyKey },
      ),
      render: (documentId, { format = "pdf", idempotencyKey = randomIdempotencyKey() } = {}) => this.request(
        `/documents/${encodeURIComponent(documentId)}/render`,
        { method: "POST", body: { format }, idempotencyKey },
      ),
      renderAndWait: async (documentId, options = {}) => {
        const job = await this.documents.render(documentId, options);
        return this.renders.wait(job, options);
      },
    });
    this.renders = Object.freeze({
      get: (jobId) => this.request(`/renders/${encodeURIComponent(jobId)}`),
      wait: (jobOrId, options = {}) => this.waitForRender(jobOrId, options),
      download: (jobOrId, options = {}) => this.downloadRender(jobOrId, options),
    });
  }

  async request(path, { method = "GET", body, idempotencyKey, signal } = {}) {
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
    };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
    const response = await this.fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
    if (response.status === 204) return undefined;
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message = data?.detail || data?.error || `SharpToolz request failed with HTTP ${response.status}.`;
      throw new SharpToolzError(message, { status: response.status, data });
    }
    return data;
  }

  async waitForRender(jobOrId, { timeoutMs = 120_000, signal, pollFallback = true } = {}) {
    const initial = typeof jobOrId === "string" ? await this.renders.get(jobOrId) : jobOrId;
    if (!initial?.id) throw new TypeError("A render job or job ID is required.");
    if (TERMINAL_STATUSES.has(initial.status)) return this.finishRender(initial);

    const watch = await this.request(`/renders/${encodeURIComponent(initial.id)}/watch`, {
      method: "POST",
      signal,
    });
    try {
      const terminal = await this.waitOnWebSocket(watch.websocket_url, { timeoutMs, signal });
      const finalJob = await this.renders.get(terminal.id);
      return this.finishRender(finalJob);
    } catch (error) {
      if (!pollFallback || signal?.aborted) throw error;
      return this.waitByPolling(initial.id, { timeoutMs, signal });
    }
  }

  async resolveWebSocket() {
    if (this.WebSocketImpl) return this.WebSocketImpl;
    if (globalThis.WebSocket) return globalThis.WebSocket;
    const module = await import("ws");
    return module.WebSocket;
  }

  async waitOnWebSocket(url, { timeoutMs, signal }) {
    const WebSocketImpl = await this.resolveWebSocket();
    return new Promise((resolve, reject) => {
      let settled = false;
      const socket = new WebSocketImpl(url);
      const timer = setTimeout(() => finish(new SharpToolzError("Render wait timed out.")), timeoutMs);

      const finish = (error, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
        try { socket.close(); } catch { /* already closed */ }
        if (error) reject(error);
        else resolve(value);
      };
      const onAbort = () => finish(abortError());
      signal?.addEventListener("abort", onAbort, { once: true });
      if (signal?.aborted) return onAbort();

      socket.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(typeof event.data === "string" ? event.data : event.data.toString());
          if (message?.type === "render.updated" && TERMINAL_STATUSES.has(message.data?.status)) {
            finish(null, message.data);
          }
        } catch {
          finish(new SharpToolzError("SharpToolz sent an invalid render update."));
        }
      });
      socket.addEventListener("error", () => finish(new SharpToolzError("The render update connection failed.")));
      socket.addEventListener("close", (event) => {
        if (!settled && event.code !== 1000) finish(new SharpToolzError("The render update connection closed early."));
      });
    });
  }

  async waitByPolling(jobId, { timeoutMs, signal }) {
    const deadline = Date.now() + timeoutMs;
    let interval = 750;
    while (Date.now() < deadline) {
      await delay(interval, signal);
      const job = await this.renders.get(jobId);
      if (TERMINAL_STATUSES.has(job.status)) return this.finishRender(job);
      interval = Math.min(Math.round(interval * 1.5), 4_000);
    }
    throw new SharpToolzError("Render wait timed out.");
  }

  async downloadRender(jobOrId, { timeoutMs = 120_000, signal, pollFallback = true } = {}) {
    const jobId = typeof jobOrId === "string" ? jobOrId : jobOrId?.id;
    if (!jobId) throw new TypeError("A render job or job ID is required.");

    // Always fetch the job before downloading. This mints a fresh five-minute
    // URL and avoids trusting a caller-supplied URL.
    let job = await this.renders.get(jobId);
    if (!TERMINAL_STATUSES.has(job.status)) {
      job = await this.renders.wait(job, { timeoutMs, signal, pollFallback });
    }
    job = this.finishRender(job);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (!job.download_url) {
        throw new SharpToolzError("The completed render did not include a download URL.", { data: job });
      }
      const response = await this.fetch(job.download_url, {
        method: "GET",
        headers: { Accept: job.format === "png" ? "image/png" : "application/pdf" },
        signal,
      });
      if (response.ok) {
        return {
          bytes: new Uint8Array(await response.arrayBuffer()),
          filename: downloadFilename(response, job),
          contentType: response.headers.get("content-type") || (
            job.format === "png" ? "image/png" : "application/pdf"
          ),
          job,
        };
      }
      if (response.status === 403 && attempt === 0) {
        try { await response.body?.cancel(); } catch { /* response already consumed */ }
        job = this.finishRender(await this.renders.get(jobId));
        continue;
      }
      const data = await response.json().catch(() => null);
      const message = data?.detail || `SharpToolz download failed with HTTP ${response.status}.`;
      throw new SharpToolzError(message, { status: response.status, data });
    }
    throw new SharpToolzError("SharpToolz could not refresh the download URL.", { data: job });
  }

  finishRender(job) {
    if (job.status === "failed") {
      throw new SharpToolzError(`Render failed${job.error_code ? `: ${job.error_code}` : "."}`, { data: job });
    }
    return job;
  }
}

export { mountHostedForm };
