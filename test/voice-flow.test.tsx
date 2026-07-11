/// <reference lib="dom" />

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
  waitFor,
} from "@testing-library/react";
import VoicePage from "@/app/voice/page";

/**
 * These tests focus on the voice page's wiring — that the mic UI mounts,
 * language chips work, and that the finalize path fans out generate()
 * calls for all 9 languages. WebRTC + real STT/TTS are entirely mocked.
 */

// ---------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------

interface FakeRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((ev: unknown) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

const recognitions: FakeRecognition[] = [];

class MockSpeechRecognition implements FakeRecognition {
  lang = "";
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onresult: ((ev: unknown) => void) | null = null;
  onerror: ((ev: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  onstart: (() => void) | null = null;
  start(): void {
    if (this.onstart) this.onstart();
  }
  stop(): void {
    if (this.onend) this.onend();
  }
  abort(): void {
    if (this.onend) this.onend();
  }
  constructor() {
    recognitions.push(this);
  }
}

class MockSpeechSynthesisUtterance {
  text: string;
  lang = "";
  rate = 1;
  pitch = 1;
  voice: unknown = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

const speakLog: string[] = [];
const speechSynthesisMock = {
  speak(u: MockSpeechSynthesisUtterance): void {
    speakLog.push(u.text);
    // Resolve immediately to unblock the async flow.
    setTimeout(() => {
      if (u.onend) u.onend();
    }, 0);
  },
  cancel(): void {},
  getVoices(): unknown[] {
    return [];
  },
  onvoiceschanged: null as (() => void) | null,
};

// ---------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------

let originalFetch: typeof fetch;

beforeEach(() => {
  recognitions.length = 0;
  speakLog.length = 0;
  (globalThis as unknown as { webkitSpeechRecognition: unknown }).webkitSpeechRecognition =
    MockSpeechRecognition;
  (globalThis as unknown as { SpeechRecognition: unknown }).SpeechRecognition =
    MockSpeechRecognition;
  (
    globalThis as unknown as { SpeechSynthesisUtterance: unknown }
  ).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
  (window as unknown as { speechSynthesis: unknown }).speechSynthesis = speechSynthesisMock;
  // jsdom lacks Element.scrollTo — the transcript component uses it.
  if (!Element.prototype.scrollTo) {
    Element.prototype.scrollTo = function scrollTo(): void {
      /* no-op */
    } as unknown as typeof Element.prototype.scrollTo;
  }
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  cleanup();
  delete (globalThis as unknown as { webkitSpeechRecognition?: unknown })
    .webkitSpeechRecognition;
  delete (globalThis as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
  delete (globalThis as unknown as { SpeechSynthesisUtterance?: unknown })
    .SpeechSynthesisUtterance;
  delete (window as unknown as { speechSynthesis?: unknown }).speechSynthesis;
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------

describe("VoicePage — rendering & baseline UI", () => {
  it("renders the header with 'Voice mode' pill", async () => {
    render(<VoicePage />);
    await waitFor(() => {
      expect(screen.getByText("Voice mode")).toBeInTheDocument();
    });
  });

  it("renders the mic button", async () => {
    render(<VoicePage />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /tap.*speak|Listening|Speaking|Thinking|Done/i }),
      ).toBeInTheDocument();
    });
  });

  it("renders the 9 language chips + auto-detect", async () => {
    render(<VoicePage />);
    await waitFor(() => {
      const group = screen.getByRole("group");
      expect(group).toBeInTheDocument();
    });
    // 9 languages + 1 auto-detect = 10 buttons in the chip group
    const group = screen.getByRole("group");
    const chips = group.querySelectorAll("button");
    expect(chips.length).toBe(10);
  });

  it("renders the 'Set Gemini key' button", async () => {
    render(<VoicePage />);
    await waitFor(() => {
      expect(screen.getByText(/Set Gemini key/i)).toBeInTheDocument();
    });
  });

  it("renders a link back to text mode", async () => {
    render(<VoicePage />);
    await waitFor(() => {
      expect(screen.getByLabelText(/Switch to text mode/i)).toBeInTheDocument();
    });
  });

  it("Hindi chip toggles aria-pressed=true when clicked", async () => {
    render(<VoicePage />);
    let hindi: HTMLElement | null = null;
    await waitFor(() => {
      hindi = screen.getByRole("button", { name: /Speak in Hindi/i });
      expect(hindi).toBeInTheDocument();
    });
    expect(hindi!.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(hindi!);
    expect(hindi!.getAttribute("aria-pressed")).toBe("true");
  });

  it("Tamil chip works too", async () => {
    render(<VoicePage />);
    let tamil: HTMLElement | null = null;
    await waitFor(() => {
      tamil = screen.getByRole("button", { name: /Speak in Tamil/i });
    });
    fireEvent.click(tamil!);
    expect(tamil!.getAttribute("aria-pressed")).toBe("true");
  });

  it("Auto-detect chip starts pressed by default", async () => {
    render(<VoicePage />);
    let auto: HTMLElement | null = null;
    await waitFor(() => {
      auto = screen.getByText("Auto-detect").closest("button");
    });
    expect(auto!.getAttribute("aria-pressed")).toBe("true");
  });

  it("Picking Hindi then Auto-detect resets the chip state", async () => {
    render(<VoicePage />);
    await waitFor(() => screen.getByRole("group"));
    const hindi = screen.getByRole("button", { name: /Speak in Hindi/i });
    const auto = screen.getByText("Auto-detect").closest("button")!;
    fireEvent.click(hindi);
    expect(hindi.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(auto);
    expect(hindi.getAttribute("aria-pressed")).toBe("false");
    expect(auto.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("VoicePage — chat API wiring", () => {
  it("mic tap emits an opener utterance", async () => {
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
    render(<VoicePage />);
    let mic: HTMLElement | null = null;
    await waitFor(() => {
      mic = screen.getByRole("button", { name: /Tap.*speak/i });
    });
    await act(async () => {
      fireEvent.click(mic!);
    });
    await waitFor(() => {
      expect(speakLog.length).toBeGreaterThan(0);
    });
    // Default (unpinned) opener is English.
    expect(speakLog[0]).toMatch(/Hi! I'll help you build posters/);
  });

  it("Hindi chip pins the opener to Hindi", async () => {
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
    render(<VoicePage />);
    await waitFor(() => screen.getByRole("group"));
    fireEvent.click(screen.getByRole("button", { name: /Speak in Hindi/i }));
    const mic = screen.getByRole("button", { name: /Tap.*speak/i });
    await act(async () => {
      fireEvent.click(mic);
    });
    await waitFor(() => {
      expect(speakLog.length).toBeGreaterThan(0);
    });
    expect(speakLog[0]).toMatch(/नमस्ते/);
  });

  it("simulating a Hindi user turn POSTs to /api/chat with the right body shape", async () => {
    const fetchMock = vi.fn(
      async (url: string | Request, init?: RequestInit): Promise<Response> => {
        // Only /api/chat should be hit during this test.
        if (typeof url === "string" && url.includes("/api/chat")) {
          const body = JSON.parse((init?.body as string) ?? "{}") as {
            messages: Array<{ role: string; content: string }>;
            languageHint?: string;
          };
          expect(Array.isArray(body.messages)).toBe(true);
          expect(body.languageHint).toBe("hi");
          return new Response(
            JSON.stringify({
              kind: "message",
              text: "आपका उत्पाद क्या है?",
              language: "hi",
            }),
            { status: 200 },
          );
        }
        return new Response("{}", { status: 200 });
      },
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(<VoicePage />);
    await waitFor(() => screen.getByRole("group"));
    fireEvent.click(screen.getByRole("button", { name: /Speak in Hindi/i }));

    const mic = screen.getByRole("button", { name: /Tap.*speak/i });
    await act(async () => {
      fireEvent.click(mic);
    });
    // Wait for the opener speak() to finish so the mic transitions to
    // listening and a MockSpeechRecognition instance appears.
    await waitFor(() => {
      expect(recognitions.length).toBeGreaterThan(0);
    });

    // Simulate the user finishing a Hindi utterance.
    const rec = recognitions[recognitions.length - 1];
    const finalEvent = {
      resultIndex: 0,
      results: {
        length: 1,
        item(): unknown {
          return null;
        },
        0: {
          length: 1,
          isFinal: true,
          item(): unknown {
            return null;
          },
          0: { transcript: "मैं आम बेच रहा हूं", confidence: 0.9 },
        },
      },
    };
    await act(async () => {
      rec.onresult?.(finalEvent);
      rec.onend?.();
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
    // One of the fetch calls must have been the chat POST.
    const chatCalls = fetchMock.mock.calls.filter(
      (c) => typeof c[0] === "string" && (c[0] as string).includes("/api/chat"),
    );
    expect(chatCalls.length).toBeGreaterThanOrEqual(1);
  });

  it("assistant text is spoken back in Hindi after a message reply", async () => {
    globalThis.fetch = vi.fn(
      async (url: string | Request): Promise<Response> => {
        if (typeof url === "string" && url.includes("/api/chat")) {
          return new Response(
            JSON.stringify({
              kind: "message",
              text: "आपका दाम क्या है?",
              language: "hi",
            }),
            { status: 200 },
          );
        }
        return new Response("{}", { status: 200 });
      },
    ) as unknown as typeof fetch;

    render(<VoicePage />);
    await waitFor(() => screen.getByRole("group"));
    fireEvent.click(screen.getByRole("button", { name: /Speak in Hindi/i }));
    const mic = screen.getByRole("button", { name: /Tap.*speak/i });
    await act(async () => {
      fireEvent.click(mic);
    });
    await waitFor(() => expect(recognitions.length).toBeGreaterThan(0));
    const rec = recognitions[recognitions.length - 1];
    await act(async () => {
      rec.onresult?.({
        resultIndex: 0,
        results: {
          length: 1,
          item(): unknown {
            return null;
          },
          0: {
            length: 1,
            isFinal: true,
            item(): unknown {
              return null;
            },
            0: { transcript: "मैं आम बेच रहा हूं", confidence: 0.9 },
          },
        },
      });
      rec.onend?.();
    });
    await waitFor(() => {
      expect(speakLog.some((s) => s.includes("दाम"))).toBe(true);
    });
  });

  it("finalize reply fans out generate() calls for all 9 languages", async () => {
    const posts: string[] = [];
    globalThis.fetch = vi.fn(
      async (url: string | Request, init?: RequestInit): Promise<Response> => {
        const u = typeof url === "string" ? url : url.url;
        posts.push(u);
        if (u.includes("/api/chat")) {
          return new Response(
            JSON.stringify({
              kind: "finalize",
              order: {
                productName: "मैंगो पल्प",
                price: "₹120",
                languageCode: "hi",
                brandColor: "#F26B1F",
              },
              text: "ठीक है, बना रहे हैं।",
            }),
            { status: 200 },
          );
        }
        if (u.includes("/api/generate")) {
          // Parse the body so we can echo the languageCode back.
          const body = JSON.parse((init?.body as string) ?? "{}") as {
            languageCode: string;
          };
          return new Response(
            JSON.stringify({
              image: "AAAA",
              mimeType: "image/png",
              model: "test",
              latencyMs: 5,
              languageCode: body.languageCode,
            }),
            { status: 200 },
          );
        }
        return new Response("{}", { status: 200 });
      },
    ) as unknown as typeof fetch;

    render(<VoicePage />);
    await waitFor(() => screen.getByRole("group"));
    fireEvent.click(screen.getByRole("button", { name: /Speak in Hindi/i }));
    const mic = screen.getByRole("button", { name: /Tap.*speak/i });
    await act(async () => {
      fireEvent.click(mic);
    });
    await waitFor(() => expect(recognitions.length).toBeGreaterThan(0));
    const rec = recognitions[recognitions.length - 1];
    await act(async () => {
      rec.onresult?.({
        resultIndex: 0,
        results: {
          length: 1,
          item(): unknown {
            return null;
          },
          0: {
            length: 1,
            isFinal: true,
            item(): unknown {
              return null;
            },
            0: { transcript: "मैंगो पल्प ₹120", confidence: 0.9 },
          },
        },
      });
      rec.onend?.();
    });

    // Wait for the 9 generate calls to be issued.
    await waitFor(
      () => {
        const generateCalls = posts.filter((p) => p.includes("/api/generate"));
        expect(generateCalls.length).toBe(9);
      },
      { timeout: 5000 },
    );
  });

  it("finalize reply speaks the closer message", async () => {
    globalThis.fetch = vi.fn(
      async (url: string | Request): Promise<Response> => {
        const u = typeof url === "string" ? url : url.url;
        if (u.includes("/api/chat")) {
          return new Response(
            JSON.stringify({
              kind: "finalize",
              order: {
                productName: "आम",
                price: "₹100",
                languageCode: "hi",
                brandColor: "#F26B1F",
              },
              text: "बना रहे हैं।",
            }),
            { status: 200 },
          );
        }
        return new Response(
          JSON.stringify({
            image: "AAAA",
            mimeType: "image/png",
            model: "test",
            latencyMs: 5,
          }),
          { status: 200 },
        );
      },
    ) as unknown as typeof fetch;

    render(<VoicePage />);
    await waitFor(() => screen.getByRole("group"));
    fireEvent.click(screen.getByRole("button", { name: /Speak in Hindi/i }));
    const mic = screen.getByRole("button", { name: /Tap.*speak/i });
    await act(async () => {
      fireEvent.click(mic);
    });
    await waitFor(() => expect(recognitions.length).toBeGreaterThan(0));
    const rec = recognitions[recognitions.length - 1];
    await act(async () => {
      rec.onresult?.({
        resultIndex: 0,
        results: {
          length: 1,
          item(): unknown {
            return null;
          },
          0: {
            length: 1,
            isFinal: true,
            item(): unknown {
              return null;
            },
            0: { transcript: "आम ₹100", confidence: 0.9 },
          },
        },
      });
      rec.onend?.();
    });
    await waitFor(() => {
      expect(speakLog.some((s) => s.includes("बना"))).toBe(true);
    });
  });

  it("network error surfaces an error state", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error("boom");
    }) as unknown as typeof fetch;

    render(<VoicePage />);
    await waitFor(() => screen.getByRole("group"));
    fireEvent.click(screen.getByRole("button", { name: /Speak in Hindi/i }));
    const mic = screen.getByRole("button", { name: /Tap.*speak/i });
    await act(async () => {
      fireEvent.click(mic);
    });
    await waitFor(() => expect(recognitions.length).toBeGreaterThan(0));
    const rec = recognitions[recognitions.length - 1];
    await act(async () => {
      rec.onresult?.({
        resultIndex: 0,
        results: {
          length: 1,
          item(): unknown {
            return null;
          },
          0: {
            length: 1,
            isFinal: true,
            item(): unknown {
              return null;
            },
            0: { transcript: "hello", confidence: 0.9 },
          },
        },
      });
      rec.onend?.();
    });
    await waitFor(() => {
      expect(screen.getByText(/boom|went wrong/i)).toBeInTheDocument();
    });
  });

  it("chat POST body includes correct headers", async () => {
    const fetchMock = vi.fn(
      async (url: string | Request, init?: RequestInit): Promise<Response> => {
        const u = typeof url === "string" ? url : url.url;
        if (u.includes("/api/chat")) {
          const headers = init?.headers as Record<string, string> | undefined;
          expect(headers?.["Content-Type"]).toBe("application/json");
          return new Response(
            JSON.stringify({ kind: "message", text: "?", language: "en" }),
            { status: 200 },
          );
        }
        return new Response("{}", { status: 200 });
      },
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(<VoicePage />);
    await waitFor(() => screen.getByRole("group"));
    const mic = screen.getByRole("button", { name: /Tap.*speak/i });
    await act(async () => {
      fireEvent.click(mic);
    });
    await waitFor(() => expect(recognitions.length).toBeGreaterThan(0));
    const rec = recognitions[recognitions.length - 1];
    await act(async () => {
      rec.onresult?.({
        resultIndex: 0,
        results: {
          length: 1,
          item(): unknown {
            return null;
          },
          0: {
            length: 1,
            isFinal: true,
            item(): unknown {
              return null;
            },
            0: { transcript: "hello", confidence: 0.9 },
          },
        },
      });
      rec.onend?.();
    });
    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          (c) => typeof c[0] === "string" && (c[0] as string).includes("/api/chat"),
        ),
      ).toBe(true);
    });
  });

  it("BCP-47 lang is set on the recognition when Hindi chip is active", async () => {
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
    render(<VoicePage />);
    await waitFor(() => screen.getByRole("group"));
    fireEvent.click(screen.getByRole("button", { name: /Speak in Hindi/i }));
    const mic = screen.getByRole("button", { name: /Tap.*speak/i });
    await act(async () => {
      fireEvent.click(mic);
    });
    await waitFor(() => expect(recognitions.length).toBeGreaterThan(0));
    expect(recognitions[recognitions.length - 1].lang).toBe("hi-IN");
  });
});
