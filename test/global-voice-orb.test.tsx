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
import { GlobalVoiceOrb } from "@/components/GlobalVoiceOrb";

/**
 * Tests for the global voice orb. Web Speech / TTS / getUserMedia are
 * all fully mocked so this suite runs in jsdom.
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

const defaultBrief = {
  productName: "Mango pulp",
  price: "₹120",
  businessName: "Rathi",
  brandColor: "#F26B1F",
  selectedLangs: ["en", "hi"],
  selectedSurface: "poster",
  mode: "single" as const,
};

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
  (window as unknown as { speechSynthesis: unknown }).speechSynthesis =
    speechSynthesisMock;

  // getUserMedia — return a fake stream with tracks.
  (navigator as unknown as { mediaDevices: unknown }).mediaDevices = {
    getUserMedia: vi.fn(async () => ({
      getTracks: () => [{ stop: () => undefined }],
    })),
  };

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

// Deliver a final speech-recognition result and end.
function deliverTranscript(rec: FakeRecognition, text: string): void {
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
        0: { transcript: text, confidence: 0.9 },
      },
    },
  });
  rec.onend?.();
}

describe("GlobalVoiceOrb — rendering", () => {
  it("renders the orb button when speech is supported", async () => {
    render(
      <GlobalVoiceOrb currentBrief={defaultBrief} onToolCall={vi.fn()} />,
    );
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Speak a command/i }),
      ).toBeInTheDocument();
    });
  });

  it("is hidden when speech is not supported", async () => {
    delete (globalThis as unknown as { webkitSpeechRecognition?: unknown })
      .webkitSpeechRecognition;
    delete (globalThis as unknown as { SpeechRecognition?: unknown })
      .SpeechRecognition;
    const { container } = render(
      <GlobalVoiceOrb currentBrief={defaultBrief} onToolCall={vi.fn()} />,
    );
    await waitFor(() => {
      expect(container.querySelector("button")).toBeNull();
    });
  });

  it("idle button has aria-label 'Speak a command'", async () => {
    render(
      <GlobalVoiceOrb currentBrief={defaultBrief} onToolCall={vi.fn()} />,
    );
    const btn = await screen.findByRole("button", { name: /Speak a command/i });
    expect(btn.getAttribute("aria-pressed")).toBe("false");
  });

  it("clicking the orb enters listening state", async () => {
    render(
      <GlobalVoiceOrb currentBrief={defaultBrief} onToolCall={vi.fn()} />,
    );
    const btn = await screen.findByRole("button", { name: /Speak a command/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    await waitFor(() => {
      expect(recognitions.length).toBe(1);
    });
    const updated = screen.getByTestId("global-voice-orb");
    expect(updated.getAttribute("data-state")).toBe("listening");
    expect(updated.getAttribute("aria-pressed")).toBe("true");
  });

  it("listening state shows the transcript panel", async () => {
    render(
      <GlobalVoiceOrb currentBrief={defaultBrief} onToolCall={vi.fn()} />,
    );
    const btn = await screen.findByRole("button", { name: /Speak a command/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    await waitFor(() => {
      expect(screen.getByTestId("orb-listening-panel")).toBeInTheDocument();
    });
  });
});

describe("GlobalVoiceOrb — tool-call pipeline", () => {
  it("dispatches set_slot to onToolCall when server returns tool_calls", async () => {
    const onToolCall = vi.fn();
    globalThis.fetch = vi.fn(async (url: string | Request): Promise<Response> => {
      const u = typeof url === "string" ? url : url.url;
      if (u.includes("/api/chat")) {
        return new Response(
          JSON.stringify({
            kind: "tool_calls",
            toolCalls: [
              { name: "set_slot", args: { field: "price", value: "₹150" } },
            ],
          }),
          { status: 200 },
        );
      }
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;

    render(
      <GlobalVoiceOrb currentBrief={defaultBrief} onToolCall={onToolCall} />,
    );
    const btn = await screen.findByRole("button", { name: /Speak a command/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    await waitFor(() => expect(recognitions.length).toBe(1));
    await act(async () => {
      deliverTranscript(recognitions[0], "change price to 150");
    });
    await waitFor(() => {
      expect(onToolCall).toHaveBeenCalledWith("set_slot", {
        field: "price",
        value: "₹150",
      });
    });
  });

  it("dispatches multiple tool calls in order", async () => {
    const onToolCall = vi.fn();
    globalThis.fetch = vi.fn(async (): Promise<Response> => {
      return new Response(
        JSON.stringify({
          kind: "tool_calls",
          toolCalls: [
            { name: "set_language", args: { code: "ta" } },
            { name: "set_surface", args: { kind: "whatsapp" } },
          ],
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    render(
      <GlobalVoiceOrb currentBrief={defaultBrief} onToolCall={onToolCall} />,
    );
    const btn = await screen.findByRole("button", { name: /Speak a command/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    await waitFor(() => expect(recognitions.length).toBe(1));
    await act(async () => {
      deliverTranscript(recognitions[0], "add Tamil and switch to WhatsApp");
    });
    await waitFor(() => {
      expect(onToolCall).toHaveBeenCalledTimes(2);
    });
    expect(onToolCall.mock.calls[0]).toEqual(["set_language", { code: "ta" }]);
    expect(onToolCall.mock.calls[1]).toEqual([
      "set_surface",
      { kind: "whatsapp" },
    ]);
  });

  it("POSTs the current brief in the chat request body", async () => {
    const fetchMock = vi.fn(
      async (url: string | Request, init?: RequestInit): Promise<Response> => {
        const u = typeof url === "string" ? url : url.url;
        if (u.includes("/api/chat")) {
          const body = JSON.parse((init?.body as string) ?? "{}") as {
            currentBrief?: unknown;
          };
          expect(body.currentBrief).toEqual(defaultBrief);
          return new Response(
            JSON.stringify({ kind: "tool_calls", toolCalls: [] }),
            { status: 200 },
          );
        }
        return new Response("{}", { status: 200 });
      },
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    render(
      <GlobalVoiceOrb currentBrief={defaultBrief} onToolCall={vi.fn()} />,
    );
    const btn = await screen.findByRole("button", { name: /Speak a command/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    await waitFor(() => expect(recognitions.length).toBe(1));
    await act(async () => {
      deliverTranscript(recognitions[0], "hello");
    });
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled();
    });
  });

  it("shows a toast after a successful tool call", async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          kind: "tool_calls",
          toolCalls: [
            { name: "set_slot", args: { field: "price", value: "₹150" } },
          ],
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    render(
      <GlobalVoiceOrb currentBrief={defaultBrief} onToolCall={vi.fn()} />,
    );
    const btn = await screen.findByRole("button", { name: /Speak a command/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    await waitFor(() => expect(recognitions.length).toBe(1));
    await act(async () => {
      deliverTranscript(recognitions[0], "change price to 150");
    });
    await waitFor(() => {
      expect(screen.getByText(/Changed price to ₹150/)).toBeInTheDocument();
    });
  });

  it("auto-dismisses the toast after 2.5s", async () => {
    vi.useFakeTimers();
    try {
      globalThis.fetch = vi.fn(async () => {
        return new Response(
          JSON.stringify({
            kind: "tool_calls",
            toolCalls: [
              { name: "set_slot", args: { field: "price", value: "₹99" } },
            ],
          }),
          { status: 200 },
        );
      }) as unknown as typeof fetch;

      render(
        <GlobalVoiceOrb currentBrief={defaultBrief} onToolCall={vi.fn()} />,
      );
      // The mount effect that flips `supported` uses setTimeout(0)-ish
      // React scheduling; flush microtasks.
      await act(async () => {
        await Promise.resolve();
      });
      const btn = screen.getByRole("button", { name: /Speak a command/i });
      await act(async () => {
        fireEvent.click(btn);
      });
      expect(recognitions.length).toBe(1);
      await act(async () => {
        deliverTranscript(recognitions[0], "make it 99");
        await Promise.resolve();
        await Promise.resolve();
      });
      // The fetch is a real promise even though its body is sync; drain it.
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(screen.getByText(/Changed price to ₹99/)).toBeInTheDocument();
      await act(async () => {
        vi.advanceTimersByTime(2600);
      });
      expect(screen.queryByText(/Changed price to ₹99/)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("plain message replies do not invoke onToolCall", async () => {
    const onToolCall = vi.fn();
    globalThis.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          kind: "message",
          text: "Sure — anything else?",
          language: "en",
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    render(
      <GlobalVoiceOrb currentBrief={defaultBrief} onToolCall={onToolCall} />,
    );
    const btn = await screen.findByRole("button", { name: /Speak a command/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    await waitFor(() => expect(recognitions.length).toBe(1));
    await act(async () => {
      deliverTranscript(recognitions[0], "help me");
    });
    await waitFor(() => {
      expect(speakLog.some((s) => s.includes("anything else"))).toBe(true);
    });
    expect(onToolCall).not.toHaveBeenCalled();
  });

  it("regenerate tool call is forwarded through onToolCall", async () => {
    const onToolCall = vi.fn();
    globalThis.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          kind: "tool_calls",
          toolCalls: [{ name: "regenerate", args: {} }],
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    render(
      <GlobalVoiceOrb currentBrief={defaultBrief} onToolCall={onToolCall} />,
    );
    const btn = await screen.findByRole("button", { name: /Speak a command/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    await waitFor(() => expect(recognitions.length).toBe(1));
    await act(async () => {
      deliverTranscript(recognitions[0], "regenerate");
    });
    await waitFor(() => {
      expect(onToolCall).toHaveBeenCalledWith("regenerate", {});
    });
  });

  it("network error surfaces an error toast", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new Error("kaboom");
    }) as unknown as typeof fetch;

    render(
      <GlobalVoiceOrb currentBrief={defaultBrief} onToolCall={vi.fn()} />,
    );
    const btn = await screen.findByRole("button", { name: /Speak a command/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    await waitFor(() => expect(recognitions.length).toBe(1));
    await act(async () => {
      deliverTranscript(recognitions[0], "hello");
    });
    await waitFor(() => {
      expect(screen.getByText(/kaboom/i)).toBeInTheDocument();
    });
  });

  it("undo tool call is forwarded", async () => {
    const onToolCall = vi.fn();
    globalThis.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          kind: "tool_calls",
          toolCalls: [{ name: "undo", args: {} }],
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    render(
      <GlobalVoiceOrb currentBrief={defaultBrief} onToolCall={onToolCall} />,
    );
    const btn = await screen.findByRole("button", { name: /Speak a command/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    await waitFor(() => expect(recognitions.length).toBe(1));
    await act(async () => {
      deliverTranscript(recognitions[0], "undo");
    });
    await waitFor(() => {
      expect(onToolCall).toHaveBeenCalledWith("undo", {});
    });
  });

  it("set_preset tool call is forwarded with presetId", async () => {
    const onToolCall = vi.fn();
    globalThis.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          kind: "tool_calls",
          toolCalls: [
            { name: "set_preset", args: { presetId: "sweetshop" } },
          ],
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    render(
      <GlobalVoiceOrb currentBrief={defaultBrief} onToolCall={onToolCall} />,
    );
    const btn = await screen.findByRole("button", { name: /Speak a command/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    await waitFor(() => expect(recognitions.length).toBe(1));
    await act(async () => {
      deliverTranscript(recognitions[0], "switch to sweet shop");
    });
    await waitFor(() => {
      expect(onToolCall).toHaveBeenCalledWith("set_preset", {
        presetId: "sweetshop",
      });
    });
  });

  it("clicking the orb while listening stops recognition", async () => {
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
    render(
      <GlobalVoiceOrb currentBrief={defaultBrief} onToolCall={vi.fn()} />,
    );
    const btn = await screen.findByRole("button", { name: /Speak a command/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    await waitFor(() => expect(recognitions.length).toBe(1));
    // Second click stops listening → onend fires → back to idle (no
    // transcript → no fetch).
    await act(async () => {
      fireEvent.click(screen.getByTestId("global-voice-orb"));
    });
    await waitFor(() => {
      expect(
        screen.getByTestId("global-voice-orb").getAttribute("data-state"),
      ).toBe("idle");
    });
  });

  it("aria-pressed toggles false again after a full turn resolves", async () => {
    globalThis.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          kind: "tool_calls",
          toolCalls: [{ name: "regenerate", args: {} }],
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    render(
      <GlobalVoiceOrb currentBrief={defaultBrief} onToolCall={vi.fn()} />,
    );
    const btn = await screen.findByRole("button", { name: /Speak a command/i });
    await act(async () => {
      fireEvent.click(btn);
    });
    await waitFor(() => expect(recognitions.length).toBe(1));
    await act(async () => {
      deliverTranscript(recognitions[0], "regenerate");
    });
    await waitFor(() => {
      expect(
        screen.getByTestId("global-voice-orb").getAttribute("aria-pressed"),
      ).toBe("false");
    });
  });
});
