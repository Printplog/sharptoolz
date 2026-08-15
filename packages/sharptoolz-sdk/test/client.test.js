import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";

import { SharpToolz } from "../src/index.js";

class FakeWebSocket extends EventEmitter {
  constructor(url) {
    super();
    this.url = url;
    queueMicrotask(() => this.emit("message", {
      data: JSON.stringify({
        type: "render.updated",
        data: { id: "job-1", status: "completed" },
      }),
    }));
  }

  addEventListener(name, listener) { this.on(name, listener); }
  close() { this.emit("close", { code: 1000 }); }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("sends the API key only in the authorization header", async () => {
  let request;
  const client = new SharpToolz({
    apiKey: "stz_live_test.key",
    fetch: async (url, options) => {
      request = { url, options };
      return jsonResponse({ results: [] });
    },
  });
  await client.templates.list();
  assert.equal(request.url, "https://api.sharptoolz.com/api/v1/templates");
  assert.equal(request.options.headers.Authorization, "Bearer stz_live_test.key");
  assert.equal(request.url.includes("stz_live_test.key"), false);
});

test("waits over WebSocket and fetches the final signed download URL once", async () => {
  const calls = [];
  const client = new SharpToolz({
    apiKey: "stz_live_test.key",
    WebSocket: FakeWebSocket,
    fetch: async (url, options) => {
      calls.push({ url, method: options.method });
      if (url.endsWith("/watch")) return jsonResponse({ websocket_url: "wss://api.sharptoolz.com/ws/job" });
      return jsonResponse({ id: "job-1", status: "completed", download_url: "https://signed.example/file" });
    },
  });
  const result = await client.renders.wait({ id: "job-1", status: "queued" });
  assert.equal(result.download_url, "https://signed.example/file");
  assert.deepEqual(calls.map((call) => call.method), ["POST", "GET"]);
});

test("uses hosted sessions for creation and editing", async () => {
  const calls = [];
  const client = new SharpToolz({
    apiKey: "stz_live_test.key",
    fetch: async (url, options) => {
      calls.push({ url, options });
      return options.method === "DELETE" ? new Response(null, { status: 204 }) : jsonResponse({ id: "document-1" });
    },
  });

  await client.hostedForms.create({
    template_id: "template-1",
    external_user_id: "user-1",
    origin: "https://app.example",
  });
  await client.hostedForms.edit("document-1", { origin: "https://app.example" });

  assert.deepEqual(calls.map(({ options }) => options.method), ["POST", "POST"]);
  assert.equal(calls[0].url.endsWith("/embed-sessions"), true);
  assert.equal(calls[1].url.endsWith("/documents/document-1/session"), true);
  assert.equal(client.templates.schema, undefined);
  assert.equal(client.documents.create, undefined);
  assert.equal(client.documents.update, undefined);
});

test("accepts the next-page URL returned by the API", async () => {
  let requestedUrl;
  const client = new SharpToolz({
    apiKey: "stz_live_test.key",
    fetch: async (url) => {
      requestedUrl = url;
      return jsonResponse({ results: [], next: null, previous: null });
    },
  });

  await client.documents.list({
    cursor: "https://api.sharptoolz.com/api/v1/documents?cursor=cD0yMDI2",
  });

  assert.equal(requestedUrl, "https://api.sharptoolz.com/api/v1/documents?cursor=cD0yMDI2");
});
