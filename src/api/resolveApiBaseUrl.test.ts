import { describe, expect, it } from "vitest";

import { resolveApiBaseUrl, resolveWebSocketUrl } from "./resolveApiBaseUrl";

describe("resolveApiBaseUrl", () => {
  it("aligns a loopback API hostname with the hostname used to open the dashboard", () => {
    expect(resolveApiBaseUrl(
      "http://127.0.0.1:8137/api",
      "http://localhost:5173/auth/login",
    )).toBe("http://localhost:8137/api");

    expect(resolveApiBaseUrl(
      "http://localhost:8137/api",
      "http://127.0.0.1:5173/auth/login",
    )).toBe("http://127.0.0.1:8137/api");
  });

  it("does not rewrite deployed API hosts", () => {
    expect(resolveApiBaseUrl(
      "https://api.sharptoolz.com/api",
      "https://sharptoolz.com/auth/login",
    )).toBe("https://api.sharptoolz.com/api");
  });

  it("handles a missing browser URL and removes one trailing slash", () => {
    expect(resolveApiBaseUrl("http://127.0.0.1:8137/api/")).toBe("http://127.0.0.1:8137/api");
  });
});

describe("resolveWebSocketUrl", () => {
  it("aligns loopback WebSocket hosts without removing the required trailing slash", () => {
    expect(resolveWebSocketUrl(
      "ws://127.0.0.1:8137/ws/wallet/",
      "http://localhost:5173/wallet",
    )).toBe("ws://localhost:8137/ws/wallet/");

    expect(resolveWebSocketUrl(
      "ws://localhost:8137/ws/wallet/",
      "http://127.0.0.1:5173/wallet",
    )).toBe("ws://127.0.0.1:8137/ws/wallet/");
  });

  it("does not rewrite deployed WebSocket hosts", () => {
    expect(resolveWebSocketUrl(
      "wss://api.sharptoolz.com/ws/wallet/",
      "https://sharptoolz.com/wallet",
    )).toBe("wss://api.sharptoolz.com/ws/wallet/");
  });
});
