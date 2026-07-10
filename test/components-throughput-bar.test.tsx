import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThroughputBar, type ThroughputStats } from "@/components/ThroughputBar";

function stats(overrides: Partial<ThroughputStats> = {}): ThroughputStats {
  return {
    count: 0,
    latencies: [],
    model: "gemini-3.1-flash-lite-image",
    ...overrides,
  };
}

describe("ThroughputBar", () => {
  it("renders count = 0", () => {
    render(<ThroughputBar stats={stats()} />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("renders count = 42", () => {
    render(<ThroughputBar stats={stats({ count: 42 })} />);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("hides avg when no latencies", () => {
    render(<ThroughputBar stats={stats()} />);
    expect(screen.queryByText("avg")).not.toBeInTheDocument();
  });

  it("shows avg when latencies present", () => {
    render(<ThroughputBar stats={stats({ count: 1, latencies: [3000] })} />);
    expect(screen.getByText("avg")).toBeInTheDocument();
    expect(screen.getByText("3.0s")).toBeInTheDocument();
  });

  it("avg latency averages all when <= 20 samples", () => {
    render(
      <ThroughputBar
        stats={stats({ count: 3, latencies: [1000, 2000, 3000] })}
      />,
    );
    // (1000+2000+3000)/3 = 2000 → 2.0s
    expect(screen.getByText("2.0s")).toBeInTheDocument();
  });

  it("avg latency uses last 20 samples only", () => {
    // First 5 large, next 20 small. Only last 20 counted.
    const latencies = [
      ...Array(5).fill(60000),
      ...Array(20).fill(1000),
    ];
    render(
      <ThroughputBar stats={stats({ count: 25, latencies })} />,
    );
    // Average of last 20 = 1000ms → 1.0s
    expect(screen.getByText("1.0s")).toBeInTheDocument();
  });

  it("NB2 Lite cost = count × 0.034/1000", () => {
    render(<ThroughputBar stats={stats({ count: 1000 })} />);
    // 1000 * 0.034 / 1000 = 0.034 → formatUsd < 1 → 3 decimals → $0.034
    expect(screen.getByText("$0.034")).toBeInTheDocument();
  });

  it("small cost formats with 4 decimals", () => {
    render(<ThroughputBar stats={stats({ count: 1 })} />);
    // 0.034/1000 = 0.000034 → formatUsd < 0.01 → $0.0000
    expect(screen.getByText("$0.0000")).toBeInTheDocument();
  });

  it("large cost formats with 2 decimals", () => {
    render(<ThroughputBar stats={stats({ count: 100000 })} />);
    // 100000 * 0.000034 = 3.4 → $3.40
    expect(screen.getByText("$3.40")).toBeInTheDocument();
  });

  it("fallback model uses higher rate", () => {
    render(
      <ThroughputBar
        stats={stats({ count: 1000, model: "gemini-2.5-flash-image-preview" })}
      />,
    );
    // 1000 * 0.039 / 1000 = 0.039 → $0.039
    expect(screen.getByText("$0.039")).toBeInTheDocument();
  });

  it("shows 'NB2 Lite' label for flash-lite-image model", () => {
    render(<ThroughputBar stats={stats()} />);
    expect(screen.getByText("NB2 Lite")).toBeInTheDocument();
  });

  it("shows 'preview fallback' label for non-NB2 model", () => {
    render(
      <ThroughputBar
        stats={stats({ model: "gemini-2.5-flash-image-preview" })}
      />,
    );
    expect(screen.getByText("preview fallback")).toBeInTheDocument();
  });

  it("shows 'SVG fallback' badge when model is svg-fallback", () => {
    render(<ThroughputBar stats={stats({ model: "svg-fallback" })} />);
    expect(screen.getByText("SVG fallback")).toBeInTheDocument();
  });

  it("model label has title attribute with full name", () => {
    const { container } = render(
      <ThroughputBar stats={stats({ model: "gemini-2.5-flash-image-preview" })} />,
    );
    const el = container.querySelector('[title="gemini-2.5-flash-image-preview"]');
    expect(el).not.toBeNull();
  });

  it("cost of $0 renders as $0.0000", () => {
    render(<ThroughputBar stats={stats({ count: 0 })} />);
    expect(screen.getByText("$0.0000")).toBeInTheDocument();
  });
});
