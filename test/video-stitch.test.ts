import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  canStitch,
  stitchSlideshow,
  downloadStitched,
  type StitchInput,
  type StitchResult,
} from "@/lib/videoStitch";

/**
 * These tests stub out MediaRecorder, canvas.captureStream,
 * createImageBitmap, and AudioContext so we can exercise the real
 * stitchSlideshow code path in jsdom without actually encoding a video.
 */

interface MockRecorderInstance {
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  ondataavailable: ((ev: { data: Blob }) => void) | null;
  onstop: (() => void) | null;
  mimeType: string;
  state: string;
  _emit: (data: Blob) => void;
  _finish: () => void;
}

const recorders: MockRecorderInstance[] = [];

class MockMediaRecorder implements MockRecorderInstance {
  static isTypeSupported(m: string): boolean {
    // Prefer webm in the mock to keep behavior deterministic.
    return m.startsWith("video/webm") || m === "video/mp4";
  }
  start = vi.fn();
  stop = vi.fn();
  ondataavailable: ((ev: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  mimeType: string;
  state = "inactive";
  constructor(_stream: unknown, opts?: { mimeType?: string }) {
    this.mimeType = opts?.mimeType ?? "video/webm";
    this.start = vi.fn(() => {
      this.state = "recording";
    });
    this.stop = vi.fn(() => {
      // Simulate a real recorder: emit one final chunk, then fire onstop.
      this._emit(new Blob(["chunk"], { type: this.mimeType }));
      this._finish();
    });
    recorders.push(this);
  }
  _emit(data: Blob): void {
    this.ondataavailable?.({ data });
  }
  _finish(): void {
    this.state = "inactive";
    this.onstop?.();
  }
}

class MockAudioContext {
  currentTime = 0;
  destination = {};
  createBufferSource(): {
    buffer: unknown;
    connect: () => void;
    start: () => void;
    stop: () => void;
  } {
    return {
      buffer: null,
      connect: () => {},
      start: () => {},
      stop: () => {},
    };
  }
  createMediaStreamDestination(): { stream: MediaStream } {
    return { stream: new MockMediaStream([{}]) as unknown as MediaStream };
  }
  decodeAudioData(_buf: ArrayBuffer): Promise<unknown> {
    return Promise.resolve({});
  }
  close(): Promise<void> {
    return Promise.resolve();
  }
}

class MockMediaStream {
  private tracks: unknown[];
  constructor(tracks: unknown[] = []) {
    this.tracks = tracks;
  }
  getAudioTracks(): unknown[] {
    return this.tracks;
  }
  getTracks(): { stop: () => void }[] {
    return this.tracks.map(() => ({ stop: () => {} }));
  }
  addTrack(t: unknown): void {
    this.tracks.push(t);
  }
}

function makeMockCtx(): CanvasRenderingContext2D {
  const noop = (): void => {};
  const ctx: Partial<CanvasRenderingContext2D> = {
    save: noop,
    restore: noop,
    fillRect: noop,
    fillText: noop,
    drawImage: noop,
    createLinearGradient: () => ({
      addColorStop: noop,
    }) as unknown as CanvasGradient,
    fillStyle: "#000",
    font: "",
    textBaseline: "alphabetic" as CanvasTextBaseline,
    textAlign: "left" as CanvasTextAlign,
    globalAlpha: 1,
  };
  return ctx as CanvasRenderingContext2D;
}

function installMocks(): void {
  vi.stubGlobal("MediaRecorder", MockMediaRecorder);
  vi.stubGlobal("AudioContext", MockAudioContext);
  // captureStream on the prototype so canStitch() detects it.
  (
    HTMLCanvasElement.prototype as unknown as { captureStream: () => MediaStream }
  ).captureStream = function (): MediaStream {
    return new MockMediaStream() as unknown as MediaStream;
  };
  // jsdom returns null from getContext('2d'). Stub it.
  (
    HTMLCanvasElement.prototype as unknown as {
      getContext: (t: string) => CanvasRenderingContext2D | null;
    }
  ).getContext = function (t: string): CanvasRenderingContext2D | null {
    if (t === "2d") return makeMockCtx();
    return null;
  };
  // createImageBitmap doesn't exist in jsdom.
  vi.stubGlobal("createImageBitmap", async () => ({
    width: 800,
    height: 800,
    close: () => {},
  }));
  // fetch → return a tiny Blob for data URLs.
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      blob: async () => new Blob([new Uint8Array([1, 2, 3])]),
    })),
  );
}

function uninstallMocks(): void {
  vi.unstubAllGlobals();
  delete (HTMLCanvasElement.prototype as unknown as { captureStream?: unknown })
    .captureStream;
  delete (HTMLCanvasElement.prototype as unknown as { getContext?: unknown })
    .getContext;
  recorders.length = 0;
}

const sampleImage = {
  image: "aGVsbG8=", // "hello"
  mimeType: "image/png",
  label: "Hindi · हिन्दी",
};

function makeInput(overrides: Partial<StitchInput> = {}): StitchInput {
  return {
    images: [sampleImage, { ...sampleImage, label: "Tamil · தமிழ்" }],
    perImageSeconds: 0.1,
    fadeMs: 20,
    width: 200,
    height: 200,
    ...overrides,
  };
}

describe("canStitch()", () => {
  afterEach(() => uninstallMocks());

  it("returns false when MediaRecorder is missing", () => {
    // No mocks installed.
    expect(canStitch()).toBe(false);
  });

  it("returns false when captureStream is missing", () => {
    vi.stubGlobal("MediaRecorder", MockMediaRecorder);
    expect(canStitch()).toBe(false);
  });

  it("returns true when both MediaRecorder and captureStream are present", () => {
    installMocks();
    expect(canStitch()).toBe(true);
  });

  it("returns a boolean type", () => {
    installMocks();
    expect(typeof canStitch()).toBe("boolean");
  });

  it("returns false again after mocks removed", () => {
    installMocks();
    uninstallMocks();
    expect(canStitch()).toBe(false);
  });
});

describe("stitchSlideshow — validation", () => {
  beforeEach(() => installMocks());
  afterEach(() => uninstallMocks());

  it("throws when images array is empty", async () => {
    await expect(stitchSlideshow(makeInput({ images: [] }))).rejects.toThrow(
      /empty/i,
    );
  });

  it("throws when browser lacks MediaRecorder", async () => {
    uninstallMocks();
    await expect(stitchSlideshow(makeInput())).rejects.toThrow(
      /MediaRecorder/i,
    );
  });

  it("throws with the exact message when images empty", async () => {
    await expect(
      stitchSlideshow(makeInput({ images: [] })),
    ).rejects.toThrow("stitchSlideshow: images array is empty");
  });
});

describe("stitchSlideshow — encoding pipeline", () => {
  beforeEach(() => installMocks());
  afterEach(() => uninstallMocks());

  it("returns a Blob result", async () => {
    const result = await stitchSlideshow(makeInput());
    expect(result.blob).toBeInstanceOf(Blob);
  });

  it("returns a positive-sized blob", async () => {
    const result = await stitchSlideshow(makeInput());
    expect(result.blob.size).toBeGreaterThan(0);
  });

  it("returns mimeType string", async () => {
    const result = await stitchSlideshow(makeInput());
    expect(typeof result.mimeType).toBe("string");
    expect(result.mimeType.length).toBeGreaterThan(0);
  });

  it("returns durationMs matching images * perImageSeconds", async () => {
    const input = makeInput({ perImageSeconds: 0.2 });
    const result = await stitchSlideshow(input);
    // 2 images * 0.2s = 400ms
    expect(result.durationMs).toBe(400);
  });

  it("respects perImageSeconds default = 0.8 when omitted", async () => {
    const input = makeInput({ perImageSeconds: undefined });
    const result = await stitchSlideshow(input);
    expect(result.durationMs).toBe(2 * 800);
  });

  it("scales duration with image count", async () => {
    const four = Array.from({ length: 4 }, () => sampleImage);
    const result = await stitchSlideshow(makeInput({ images: four }));
    expect(result.durationMs).toBe(4 * 100);
  });

  it("calls onProgress at least once", async () => {
    const onProgress = vi.fn();
    await stitchSlideshow(makeInput({ onProgress }));
    expect(onProgress).toHaveBeenCalled();
  });

  it("emits progress that starts at 0 or higher and ends at 1", async () => {
    const values: number[] = [];
    await stitchSlideshow(
      makeInput({ onProgress: (f) => values.push(f) }),
    );
    expect(values[0]).toBeGreaterThanOrEqual(0);
    expect(values[values.length - 1]).toBe(1);
  });

  it("emits monotonically non-decreasing progress values", async () => {
    const values: number[] = [];
    await stitchSlideshow(
      makeInput({ onProgress: (f) => values.push(f) }),
    );
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
    }
  });

  it("progress values stay within [0, 1]", async () => {
    const values: number[] = [];
    await stitchSlideshow(
      makeInput({ onProgress: (f) => values.push(f) }),
    );
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("constructs exactly one MediaRecorder", async () => {
    await stitchSlideshow(makeInput());
    expect(recorders.length).toBe(1);
  });

  it("calls MediaRecorder.start()", async () => {
    await stitchSlideshow(makeInput());
    expect(recorders[0].start).toHaveBeenCalled();
  });

  it("calls MediaRecorder.stop()", async () => {
    await stitchSlideshow(makeInput());
    expect(recorders[0].stop).toHaveBeenCalled();
  });

  it("decodes each poster via createImageBitmap", async () => {
    const spy = vi.fn(async () => ({
      width: 100,
      height: 100,
      close: () => {},
    }));
    vi.stubGlobal("createImageBitmap", spy);
    const three = Array.from({ length: 3 }, () => sampleImage);
    await stitchSlideshow(makeInput({ images: three }));
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it("routes decoded blobs through fetch(data URL)", async () => {
    const spy = vi.fn(async () => ({
      blob: async () => new Blob([new Uint8Array([1])]),
    }));
    vi.stubGlobal("fetch", spy);
    await stitchSlideshow(makeInput());
    expect(spy).toHaveBeenCalled();
    const calls = spy.mock.calls as unknown as ReadonlyArray<ReadonlyArray<unknown>>;
    const firstCallArg = calls[0]?.[0] as string;
    expect(firstCallArg).toMatch(/^data:image\/png;base64,/);
  });

  it("works without narrationAudio (silent path)", async () => {
    const result = await stitchSlideshow(makeInput());
    expect(result.blob.size).toBeGreaterThan(0);
  });

  it("accepts narrationAudio ArrayBuffer", async () => {
    const audio = new ArrayBuffer(16);
    const result = await stitchSlideshow(makeInput({ narrationAudio: audio }));
    expect(result.blob).toBeInstanceOf(Blob);
  });

  it("returns a mimeType containing 'video/'", async () => {
    const result = await stitchSlideshow(makeInput());
    expect(result.mimeType).toMatch(/^video\//);
  });

  it("applies default width and height when omitted", async () => {
    const result = await stitchSlideshow(
      makeInput({ width: undefined, height: undefined }),
    );
    expect(result.blob).toBeInstanceOf(Blob);
  });

  it("respects custom fadeMs without erroring", async () => {
    const result = await stitchSlideshow(makeInput({ fadeMs: 50 }));
    expect(result.blob).toBeInstanceOf(Blob);
  });

  it("handles a single image", async () => {
    const result = await stitchSlideshow(
      makeInput({ images: [sampleImage], perImageSeconds: 0.1 }),
    );
    expect(result.durationMs).toBe(100);
  });

  it("handles images without labels", async () => {
    const img = { image: "aGVsbG8=", mimeType: "image/png" };
    const result = await stitchSlideshow(
      makeInput({ images: [img, img] }),
    );
    expect(result.blob).toBeInstanceOf(Blob);
  });
});

describe("downloadStitched()", () => {
  let origCreateObjectURL: typeof URL.createObjectURL;
  let origRevokeObjectURL: typeof URL.revokeObjectURL;
  let createdUrls: string[];

  beforeEach(() => {
    createdUrls = [];
    origCreateObjectURL = URL.createObjectURL;
    origRevokeObjectURL = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn((_b: Blob | MediaSource) => {
      const url = `blob:mock-${createdUrls.length}`;
      createdUrls.push(url);
      return url;
    });
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    URL.createObjectURL = origCreateObjectURL;
    URL.revokeObjectURL = origRevokeObjectURL;
  });

  function makeResult(mimeType = "video/webm"): StitchResult {
    return {
      blob: new Blob(["x"], { type: mimeType }),
      mimeType,
      durationMs: 1000,
    };
  }

  it("creates an object URL for the blob", () => {
    downloadStitched(makeResult());
    expect(createdUrls.length).toBe(1);
  });

  it("appends and removes an anchor from document.body", () => {
    const appendSpy = vi.spyOn(document.body, "appendChild");
    const removeSpy = vi.spyOn(document.body, "removeChild");
    downloadStitched(makeResult());
    expect(appendSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
  });

  it("uses .mp4 extension for mp4 mimeTypes", () => {
    const clickSpy = vi.fn();
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreate(tag) as HTMLAnchorElement;
      if (tag === "a") el.click = clickSpy;
      return el;
    });
    downloadStitched(makeResult("video/mp4;codecs=avc1"));
    const call = (
      document.createElement as unknown as {
        mock: { results: { value: HTMLAnchorElement }[] };
      }
    ).mock.results.find((r) => r.value.tagName === "A");
    expect(call?.value.download).toMatch(/\.mp4$/);
    vi.restoreAllMocks();
  });

  it("uses .webm extension for webm mimeTypes", () => {
    const clickSpy = vi.fn();
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreate(tag) as HTMLAnchorElement;
      if (tag === "a") el.click = clickSpy;
      return el;
    });
    downloadStitched(makeResult("video/webm;codecs=vp9,opus"));
    const call = (
      document.createElement as unknown as {
        mock: { results: { value: HTMLAnchorElement }[] };
      }
    ).mock.results.find((r) => r.value.tagName === "A");
    expect(call?.value.download).toMatch(/\.webm$/);
    vi.restoreAllMocks();
  });

  it("respects an explicit filename argument", () => {
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreate(tag) as HTMLAnchorElement;
      if (tag === "a") el.click = vi.fn();
      return el;
    });
    downloadStitched(makeResult(), "my-custom.webm");
    const anchor = (
      document.createElement as unknown as {
        mock: { results: { value: HTMLAnchorElement }[] };
      }
    ).mock.results.find((r) => r.value.tagName === "A");
    expect(anchor?.value.download).toBe("my-custom.webm");
    vi.restoreAllMocks();
  });

  it("triggers a click on the anchor", () => {
    const origCreate = document.createElement.bind(document);
    let anchor: HTMLAnchorElement | null = null;
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreate(tag) as HTMLAnchorElement;
      if (tag === "a") {
        el.click = vi.fn();
        anchor = el;
      }
      return el;
    });
    downloadStitched(makeResult());
    expect(anchor).not.toBeNull();
    expect((anchor as unknown as HTMLAnchorElement).click).toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("filename defaults include the bazaarboard- prefix", () => {
    const origCreate = document.createElement.bind(document);
    let anchor: HTMLAnchorElement | null = null;
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreate(tag) as HTMLAnchorElement;
      if (tag === "a") {
        el.click = vi.fn();
        anchor = el;
      }
      return el;
    });
    downloadStitched(makeResult());
    expect((anchor as unknown as HTMLAnchorElement).download).toMatch(
      /^bazaarboard-\d+\.webm$/,
    );
    vi.restoreAllMocks();
  });
});
