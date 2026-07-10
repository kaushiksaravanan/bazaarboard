import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PosterCell } from "@/components/PosterCell";

const defaultProps = {
  aspect: "3 / 4",
  filename: "test.png",
  languageNativeName: "हिन्दी",
  languageEnglishName: "Hindi",
  fontClass: "font-devanagari",
  onDownload: () => {},
};

describe("PosterCell", () => {
  it("renders languageNativeName", () => {
    render(<PosterCell {...defaultProps} state={undefined} />);
    expect(screen.getByText("हिन्दी")).toBeInTheDocument();
  });

  it("renders languageEnglishName", () => {
    render(<PosterCell {...defaultProps} state={undefined} />);
    expect(screen.getByText("Hindi")).toBeInTheDocument();
  });

  it("applies fontClass to native name", () => {
    render(<PosterCell {...defaultProps} state={undefined} />);
    const span = screen.getByText("हिन्दी");
    expect(span.className).toBe("font-devanagari");
  });

  it("idle state shows 'queued'", () => {
    render(<PosterCell {...defaultProps} state={undefined} />);
    expect(screen.getByText("queued")).toBeInTheDocument();
  });

  it("idle state has no <img> tag and no download button", () => {
    const { container } = render(
      <PosterCell {...defaultProps} state={undefined} />,
    );
    expect(container.querySelector("img")).toBeNull();
    expect(
      screen.queryByLabelText(/Download Hindi poster/),
    ).not.toBeInTheDocument();
  });

  it("loading state (no image) shows rendering label", () => {
    render(
      <PosterCell
        {...defaultProps}
        state={{ loading: true }}
      />,
    );
    // "rendering…" label appears in the top-right meta row.
    expect(screen.getAllByText(/rendering/i).length).toBeGreaterThan(0);
  });

  it("loading state (no image) shows Gemini rendering placeholder", () => {
    render(
      <PosterCell {...defaultProps} state={{ loading: true }} />,
    );
    expect(screen.getByText(/Gemini rendering/i)).toBeInTheDocument();
  });

  it("error state shows error message", () => {
    render(
      <PosterCell
        {...defaultProps}
        state={{ loading: false, error: "something broke" }}
      />,
    );
    expect(screen.getByText("something broke")).toBeInTheDocument();
  });

  it("done state shows <img>", () => {
    const { container } = render(
      <PosterCell
        {...defaultProps}
        state={{
          loading: false,
          image: "AAAA",
          mimeType: "image/png",
          latencyMs: 3200,
        }}
      />,
    );
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img!.getAttribute("src")).toBe("data:image/png;base64,AAAA");
  });

  it("done state shows download button", () => {
    render(
      <PosterCell
        {...defaultProps}
        state={{
          loading: false,
          image: "AAAA",
          mimeType: "image/png",
          latencyMs: 3200,
        }}
      />,
    );
    expect(screen.getByLabelText(/Download Hindi poster/)).toBeInTheDocument();
  });

  it("latency displays in seconds with one decimal", () => {
    render(
      <PosterCell
        {...defaultProps}
        state={{
          loading: false,
          image: "AAAA",
          mimeType: "image/png",
          latencyMs: 3200,
        }}
      />,
    );
    expect(screen.getByText("3.2s")).toBeInTheDocument();
  });

  it("latency rounds correctly", () => {
    render(
      <PosterCell
        {...defaultProps}
        state={{
          loading: false,
          image: "AAAA",
          mimeType: "image/png",
          latencyMs: 1250,
        }}
      />,
    );
    expect(screen.getByText("1.3s")).toBeInTheDocument();
  });

  it("clicking download button fires onDownload", () => {
    const onDownload = vi.fn();
    render(
      <PosterCell
        {...defaultProps}
        onDownload={onDownload}
        state={{
          loading: false,
          image: "AAAA",
          mimeType: "image/png",
          latencyMs: 100,
        }}
      />,
    );
    fireEvent.click(screen.getByLabelText(/Download Hindi poster/));
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it("img alt uses english name", () => {
    const { container } = render(
      <PosterCell
        {...defaultProps}
        state={{
          loading: false,
          image: "AAAA",
          mimeType: "image/png",
          latencyMs: 100,
        }}
      />,
    );
    const img = container.querySelector("img");
    expect(img!.getAttribute("alt")).toBe("Hindi poster");
  });

  it("defaults to image/png when no mimeType", () => {
    const { container } = render(
      <PosterCell
        {...defaultProps}
        state={{ loading: false, image: "AAAA", latencyMs: 10 }}
      />,
    );
    const img = container.querySelector("img");
    expect(img!.getAttribute("src")).toContain("data:image/png;base64,");
  });

  it("uses provided mimeType", () => {
    const { container } = render(
      <PosterCell
        {...defaultProps}
        state={{
          loading: false,
          image: "AAAA",
          mimeType: "image/svg+xml",
          latencyMs: 10,
        }}
      />,
    );
    const img = container.querySelector("img");
    expect(img!.getAttribute("src")).toBe(
      "data:image/svg+xml;base64,AAAA",
    );
  });

  it("loading + hasImage shows fade class", () => {
    const { container } = render(
      <PosterCell
        {...defaultProps}
        state={{
          loading: true,
          image: "AAAA",
          mimeType: "image/png",
        }}
      />,
    );
    const poster = container.querySelector(".poster");
    expect(poster).not.toBeNull();
    expect(poster!.className).toMatch(/opacity-70/);
  });

  it("done (not loading) has opacity-100", () => {
    const { container } = render(
      <PosterCell
        {...defaultProps}
        state={{
          loading: false,
          image: "AAAA",
          mimeType: "image/png",
        }}
      />,
    );
    const poster = container.querySelector(".poster");
    expect(poster!.className).toMatch(/opacity-100/);
  });
});
