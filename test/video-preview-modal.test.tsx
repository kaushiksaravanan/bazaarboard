import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { VideoPreviewModal } from "@/components/VideoPreviewModal";
import type { StitchResult } from "@/lib/videoStitch";

/**
 * These tests exercise the modal purely at the DOM level — no real
 * MediaRecorder involvement. We construct a synthetic StitchResult with
 * a tiny Blob (a fake WebM header) and assert the modal renders it
 * correctly and that action buttons wire to the right browser APIs.
 */

function makeResult(): StitchResult {
  const blob = new Blob([new Uint8Array([0x1a, 0x45, 0xdf, 0xa3])], {
    type: "video/webm",
  });
  return { blob, mimeType: "video/webm", durationMs: 4500 };
}

// jsdom doesn't implement URL.createObjectURL / revokeObjectURL; mock them.
let createSpy: ReturnType<typeof vi.spyOn>;
let originalCreate: typeof URL.createObjectURL | undefined;
let originalRevoke: typeof URL.revokeObjectURL | undefined;

beforeEach(() => {
  originalCreate = URL.createObjectURL;
  originalRevoke = URL.revokeObjectURL;
  URL.createObjectURL = vi.fn(() => "blob:mock/xyz");
  URL.revokeObjectURL = vi.fn();
  createSpy = URL.createObjectURL as unknown as ReturnType<typeof vi.spyOn>;
});

afterEach(() => {
  cleanup();
  if (originalCreate) URL.createObjectURL = originalCreate;
  if (originalRevoke) URL.revokeObjectURL = originalRevoke;
  vi.restoreAllMocks();
});

describe("VideoPreviewModal", () => {
  it("renders when given a result", () => {
    render(<VideoPreviewModal result={makeResult()} onClose={() => {}} />);
    expect(screen.getByTestId("video-preview-modal")).toBeInTheDocument();
  });

  it("renders a <video> element with the object URL as src", () => {
    render(<VideoPreviewModal result={makeResult()} onClose={() => {}} />);
    const video = screen.getByTestId("video-preview-player") as HTMLVideoElement;
    expect(video.tagName).toBe("VIDEO");
    expect(video.getAttribute("src")).toBe("blob:mock/xyz");
  });

  it("video is autoPlay + muted + playsInline (browser policy compliance)", () => {
    render(<VideoPreviewModal result={makeResult()} onClose={() => {}} />);
    const video = screen.getByTestId("video-preview-player") as HTMLVideoElement;
    expect(video.autoplay).toBe(true);
    expect(video.muted).toBe(true);
    // playsinline is a boolean attribute — React lowercases it in JSX.
    expect(video.hasAttribute("playsinline")).toBe(true);
    expect(video.controls).toBe(true);
  });

  it("createObjectURL is called once on mount", () => {
    render(<VideoPreviewModal result={makeResult()} onClose={() => {}} />);
    expect(createSpy).toHaveBeenCalledTimes(1);
  });

  it("Close button calls onClose", () => {
    const onClose = vi.fn();
    render(<VideoPreviewModal result={makeResult()} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("Close video preview"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Escape key calls onClose", () => {
    const onClose = vi.fn();
    render(<VideoPreviewModal result={makeResult()} onClose={onClose} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Backdrop click calls onClose", () => {
    const onClose = vi.fn();
    render(<VideoPreviewModal result={makeResult()} onClose={onClose} />);
    const backdrop = screen.getByTestId("video-preview-modal");
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Clicking inside the modal panel does NOT call onClose", () => {
    const onClose = vi.fn();
    render(<VideoPreviewModal result={makeResult()} onClose={onClose} />);
    fireEvent.click(screen.getByTestId("video-preview-player"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Download button triggers URL.createObjectURL again (for the download anchor)", () => {
    render(<VideoPreviewModal result={makeResult()} onClose={() => {}} />);
    const before = createSpy.mock.calls.length;
    fireEvent.click(screen.getByTestId("video-download-button"));
    expect(createSpy.mock.calls.length).toBeGreaterThan(before);
  });

  it("Share button exists and is clickable (falls back cleanly when navigator.share is missing)", () => {
    render(<VideoPreviewModal result={makeResult()} onClose={() => {}} />);
    const share = screen.getByTestId("video-share-button");
    expect(share).toBeInTheDocument();
    // Clicking should not throw even without navigator.share.
    expect(() => fireEvent.click(share)).not.toThrow();
  });

  it("modal has role=dialog and aria-modal=true", () => {
    render(<VideoPreviewModal result={makeResult()} onClose={() => {}} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-modal")).toBe("true");
  });
});
