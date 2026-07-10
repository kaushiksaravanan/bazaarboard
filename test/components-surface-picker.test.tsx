import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SurfacePicker, SURFACES, type SurfaceKind } from "@/components/SurfacePicker";

describe("SurfacePicker — SURFACES catalog", () => {
  it("has exactly 3 entries", () => {
    expect(SURFACES).toHaveLength(3);
  });

  it("includes poster/whatsapp/square", () => {
    const kinds = SURFACES.map((s) => s.kind);
    expect(kinds).toEqual(["poster", "whatsapp", "square"]);
  });

  it("each surface has label, aspect, short", () => {
    for (const s of SURFACES) {
      expect(s.label.length).toBeGreaterThan(0);
      expect(s.aspect).toMatch(/^\d+\s*\/\s*\d+$/);
      expect(s.short.length).toBeGreaterThan(0);
    }
  });
});

describe("SurfacePicker — single-select mode", () => {
  it("renders 3 buttons", () => {
    render(<SurfacePicker selected="poster" onChange={() => {}} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
  });

  it("shows labels for all surfaces", () => {
    render(<SurfacePicker selected="poster" onChange={() => {}} />);
    for (const s of SURFACES) {
      expect(screen.getByText(s.label)).toBeInTheDocument();
    }
  });

  it("selected has aria-pressed=true", () => {
    render(<SurfacePicker selected="whatsapp" onChange={() => {}} />);
    const btn = screen.getByText("WhatsApp status (9:16)");
    expect(btn.getAttribute("aria-pressed")).toBe("true");
  });

  it("non-selected have aria-pressed=false", () => {
    render(<SurfacePicker selected="whatsapp" onChange={() => {}} />);
    const btn = screen.getByText("Shop poster (A4)");
    expect(btn.getAttribute("aria-pressed")).toBe("false");
  });

  it("clicking calls onChange with kind", () => {
    const onChange = vi.fn();
    render(<SurfacePicker selected="poster" onChange={onChange} />);
    fireEvent.click(screen.getByText("WhatsApp status (9:16)"));
    expect(onChange).toHaveBeenCalledWith("whatsapp");
  });

  it("does NOT call onToggle in single mode", () => {
    const onChange = vi.fn();
    const onToggle = vi.fn();
    render(
      <SurfacePicker
        selected="poster"
        onChange={onChange}
        onToggle={onToggle}
      />,
    );
    fireEvent.click(screen.getByText("WhatsApp status (9:16)"));
    expect(onChange).toHaveBeenCalled();
    expect(onToggle).not.toHaveBeenCalled();
  });
});

describe("SurfacePicker — multi mode", () => {
  it("uses selectedSet for pressed state", () => {
    const set = new Set<SurfaceKind>(["poster", "square"]);
    render(
      <SurfacePicker
        selected="poster"
        onChange={() => {}}
        multi
        selectedSet={set}
        onToggle={() => {}}
      />,
    );
    expect(
      screen.getByText("Shop poster (A4)").getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen.getByText("Google Business post (1:1)").getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen.getByText("WhatsApp status (9:16)").getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("clicking calls onToggle in multi mode", () => {
    const onChange = vi.fn();
    const onToggle = vi.fn();
    const set = new Set<SurfaceKind>();
    render(
      <SurfacePicker
        selected="poster"
        onChange={onChange}
        multi
        selectedSet={set}
        onToggle={onToggle}
      />,
    );
    fireEvent.click(screen.getByText("WhatsApp status (9:16)"));
    expect(onToggle).toHaveBeenCalledWith("whatsapp");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("multi + empty selectedSet renders no pressed buttons", () => {
    const set = new Set<SurfaceKind>();
    render(
      <SurfacePicker
        selected="poster"
        onChange={() => {}}
        multi
        selectedSet={set}
        onToggle={() => {}}
      />,
    );
    const buttons = screen.getAllByRole("button");
    const pressed = buttons.filter(
      (b) => b.getAttribute("aria-pressed") === "true",
    );
    expect(pressed).toHaveLength(0);
  });

  it("multi without onToggle falls back to onChange", () => {
    const onChange = vi.fn();
    render(
      <SurfacePicker
        selected="poster"
        onChange={onChange}
        multi
        selectedSet={new Set<SurfaceKind>()}
      />,
    );
    fireEvent.click(screen.getByText("WhatsApp status (9:16)"));
    expect(onChange).toHaveBeenCalledWith("whatsapp");
  });

  it("multi + full selectedSet renders 3 pressed", () => {
    const set = new Set<SurfaceKind>(["poster", "whatsapp", "square"]);
    render(
      <SurfacePicker
        selected="poster"
        onChange={() => {}}
        multi
        selectedSet={set}
        onToggle={() => {}}
      />,
    );
    const pressed = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("aria-pressed") === "true");
    expect(pressed).toHaveLength(3);
  });

  it("clicks propagate correct kind for each surface", () => {
    const onToggle = vi.fn();
    const set = new Set<SurfaceKind>();
    render(
      <SurfacePicker
        selected="poster"
        onChange={() => {}}
        multi
        selectedSet={set}
        onToggle={onToggle}
      />,
    );
    fireEvent.click(screen.getByText("Shop poster (A4)"));
    fireEvent.click(screen.getByText("Google Business post (1:1)"));
    expect(onToggle).toHaveBeenNthCalledWith(1, "poster");
    expect(onToggle).toHaveBeenNthCalledWith(2, "square");
  });
});
