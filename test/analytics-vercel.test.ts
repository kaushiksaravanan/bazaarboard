import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

/**
 * Vercel Analytics forwarding + sanitization tests.
 *
 * Verifies that trackEvent() ALSO forwards to `@vercel/analytics`'s track()
 * after the same sanitizer that guards the /api/telemetry POST body:
 *   - drops credential-like prop keys (apiKey, geminiKey, token, secret, ...)
 *   - strips string values shaped like a Gemini/Google API key (AIza...)
 *   - passes booleans like has_key through untouched
 *   - respects navigator.doNotTrack (neither POST nor track() fires)
 */

const track = vi.fn();

vi.mock("@vercel/analytics", () => ({
  track: (...args: unknown[]) => track(...args),
}));

// Fresh module state per test so the singleton queue/timer doesn't leak.
async function loadAnalytics() {
  vi.resetModules();
  return await import("../src/lib/analytics");
}

function setDNT(value: string | undefined): void {
  Object.defineProperty(window.navigator, "doNotTrack", {
    value,
    configurable: true,
  });
}

// Wait a microtask so the dynamic import inside forwardToVercel resolves.
const flushMicrotasks = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  track.mockReset();
  setDNT(undefined);
  // Stub fetch so the POST path doesn't error out.
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("{}", { status: 200 })),
  );
  window.sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("trackEvent → Vercel Analytics forwarding", () => {
  test("calls track() with the event name", async () => {
    const { trackEvent } = await loadAnalytics();
    trackEvent("poster_generated", { surface: "whatsapp" });
    await flushMicrotasks();
    expect(track).toHaveBeenCalledTimes(1);
    expect(track.mock.calls[0][0]).toBe("poster_generated");
  });

  test("passes sanitized props through to track()", async () => {
    const { trackEvent } = await loadAnalytics();
    trackEvent("generated", { surface: "poster", lang: "ta" });
    await flushMicrotasks();
    expect(track).toHaveBeenCalledWith("generated", {
      surface: "poster",
      lang: "ta",
    });
  });

  test("strips props whose value is a Gemini-shaped API key", async () => {
    const { trackEvent } = await loadAnalytics();
    trackEvent("evt", {
      surface: "poster",
      leaked: "AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ1234567",
    });
    await flushMicrotasks();
    expect(track).toHaveBeenCalledTimes(1);
    const props = track.mock.calls[0][1] as Record<string, unknown>;
    expect(props).not.toHaveProperty("leaked");
    expect(props.surface).toBe("poster");
    // The literal key value must not appear anywhere in the payload.
    expect(JSON.stringify(props)).not.toContain("AIzaSy");
  });

  test("removes props named 'apiKey'", async () => {
    const { trackEvent } = await loadAnalytics();
    trackEvent("evt", { apiKey: "whatever", surface: "poster" });
    await flushMicrotasks();
    const props = track.mock.calls[0][1] as Record<string, unknown>;
    expect(props).not.toHaveProperty("apiKey");
    expect(props.surface).toBe("poster");
  });

  test("removes props named 'geminiKey'", async () => {
    const { trackEvent } = await loadAnalytics();
    trackEvent("evt", { geminiKey: "AIzaXYZ", surface: "poster" });
    await flushMicrotasks();
    const props = track.mock.calls[0][1] as Record<string, unknown>;
    expect(props).not.toHaveProperty("geminiKey");
  });

  test("removes props named 'token'", async () => {
    const { trackEvent } = await loadAnalytics();
    trackEvent("evt", { token: "bearer-abc", surface: "poster" });
    await flushMicrotasks();
    const props = track.mock.calls[0][1] as Record<string, unknown>;
    expect(props).not.toHaveProperty("token");
  });

  test("removes props named 'secret'", async () => {
    const { trackEvent } = await loadAnalytics();
    trackEvent("evt", { secret: "shh", surface: "poster" });
    await flushMicrotasks();
    const props = track.mock.calls[0][1] as Record<string, unknown>;
    expect(props).not.toHaveProperty("secret");
  });

  test("removes credential-like keys case-insensitively", async () => {
    const { trackEvent } = await loadAnalytics();
    trackEvent("evt", {
      APIKey: "x",
      AuthToken: "y",
      MY_SECRET: "z",
      surface: "poster",
    });
    await flushMicrotasks();
    const props = track.mock.calls[0][1] as Record<string, unknown>;
    expect(props).not.toHaveProperty("APIKey");
    expect(props).not.toHaveProperty("AuthToken");
    expect(props).not.toHaveProperty("MY_SECRET");
    expect(props.surface).toBe("poster");
  });

  test("passes has_key: true through untouched", async () => {
    const { trackEvent } = await loadAnalytics();
    trackEvent("evt", { has_key: true, surface: "poster" });
    await flushMicrotasks();
    const props = track.mock.calls[0][1] as Record<string, unknown>;
    expect(props.has_key).toBe(true);
    expect(props.surface).toBe("poster");
  });

  test("passes has_key: false through untouched", async () => {
    const { trackEvent } = await loadAnalytics();
    trackEvent("evt", { has_key: false });
    await flushMicrotasks();
    const props = track.mock.calls[0][1] as Record<string, unknown>;
    expect(props.has_key).toBe(false);
  });

  test("passes numeric and null props through", async () => {
    const { trackEvent } = await loadAnalytics();
    trackEvent("evt", { latency_ms: 1234, note: null });
    await flushMicrotasks();
    const props = track.mock.calls[0][1] as Record<string, unknown>;
    expect(props.latency_ms).toBe(1234);
    expect(props.note).toBeNull();
  });

  test("DNT=1 skips both fetch POST and track()", async () => {
    setDNT("1");
    const { trackEvent, flushEvents } = await loadAnalytics();
    trackEvent("evt", { surface: "poster" });
    await flushMicrotasks();
    await flushEvents(false);
    expect(track).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  test("DNT='yes' skips both fetch POST and track()", async () => {
    setDNT("yes");
    const { trackEvent, flushEvents } = await loadAnalytics();
    trackEvent("evt", { surface: "poster" });
    await flushMicrotasks();
    await flushEvents(false);
    expect(track).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  test("empty event name is a no-op", async () => {
    const { trackEvent } = await loadAnalytics();
    trackEvent("", { surface: "poster" });
    await flushMicrotasks();
    expect(track).not.toHaveBeenCalled();
  });

  test("mid-string AIza-shaped substring in a prop is preserved (only exact-match values are stripped)", async () => {
    // Sanitizer regex is anchored (^AIza...$); embedded substrings should pass.
    const { trackEvent } = await loadAnalytics();
    trackEvent("evt", { note: "saw AIzaSyABCDEFGHIJKLMNOPQRSTUV in logs" });
    await flushMicrotasks();
    const props = track.mock.calls[0][1] as Record<string, unknown>;
    expect(props).toHaveProperty("note");
  });

  test("sanitized props for track() match those posted to /api/telemetry", async () => {
    const { trackEvent, flushEvents } = await loadAnalytics();
    trackEvent("evt", {
      surface: "poster",
      apiKey: "should-be-stripped",
      leaked: "AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ1234567",
      has_key: true,
    });
    await flushMicrotasks();
    await flushEvents(false);

    const trackProps = track.mock.calls[0][1] as Record<string, unknown>;
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const body = JSON.parse(
      fetchMock.mock.calls[0][1].body as string,
    ) as { events: Array<{ props: Record<string, unknown> }> };
    const postProps = body.events[0].props;

    expect(trackProps).toEqual(postProps);
    expect(trackProps).not.toHaveProperty("apiKey");
    expect(trackProps).not.toHaveProperty("leaked");
    expect(trackProps.has_key).toBe(true);
    expect(trackProps.surface).toBe("poster");
  });
});
