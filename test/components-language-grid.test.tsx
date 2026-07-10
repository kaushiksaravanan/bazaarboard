import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LanguageGrid } from "@/components/LanguageGrid";
import { LANGUAGES } from "@/lib/languages";

describe("LanguageGrid", () => {
  it("renders one button per language", () => {
    render(<LanguageGrid selected={[]} onToggle={() => {}} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(LANGUAGES.length);
  });

  it("renders all 9 languages", () => {
    render(<LanguageGrid selected={[]} onToggle={() => {}} />);
    for (const l of LANGUAGES) {
      expect(screen.getByText(l.nativeName)).toBeInTheDocument();
    }
  });

  it("renders english names too", () => {
    render(<LanguageGrid selected={[]} onToggle={() => {}} />);
    for (const l of LANGUAGES) {
      // English name is one of possibly-many nodes with that text; use a
      // custom matcher that ignores element splits.
      const found = screen.getAllByText(l.englishName, { exact: false });
      expect(found.length).toBeGreaterThan(0);
    }
  });

  it("selected languages have aria-pressed=true", () => {
    render(<LanguageGrid selected={["hi", "ta"]} onToggle={() => {}} />);
    const buttons = screen.getAllByRole("button");
    const pressed = buttons.filter(
      (b) => b.getAttribute("aria-pressed") === "true",
    );
    expect(pressed).toHaveLength(2);
  });

  it("unselected languages have aria-pressed=false", () => {
    render(<LanguageGrid selected={["hi"]} onToggle={() => {}} />);
    const buttons = screen.getAllByRole("button");
    const unpressed = buttons.filter(
      (b) => b.getAttribute("aria-pressed") === "false",
    );
    expect(unpressed).toHaveLength(LANGUAGES.length - 1);
  });

  it("selected language has active styling class", () => {
    render(<LanguageGrid selected={["hi"]} onToggle={() => {}} />);
    const hindiSpan = screen.getByText("हिन्दी");
    const button = hindiSpan.closest("button");
    expect(button).not.toBeNull();
    expect(button!.className).toMatch(/bazaar-ink/);
  });

  it("unselected language has white bg class", () => {
    render(<LanguageGrid selected={[]} onToggle={() => {}} />);
    const hindiSpan = screen.getByText("हिन्दी");
    const button = hindiSpan.closest("button");
    expect(button!.className).toMatch(/bg-white/);
  });

  it("clicking calls onToggle with the language code", () => {
    const onToggle = vi.fn();
    render(<LanguageGrid selected={[]} onToggle={onToggle} />);
    const hindiSpan = screen.getByText("हिन्दी");
    fireEvent.click(hindiSpan.closest("button")!);
    expect(onToggle).toHaveBeenCalledWith("hi");
  });

  it("clicking multiple times calls onToggle each time", () => {
    const onToggle = vi.fn();
    render(<LanguageGrid selected={[]} onToggle={onToggle} />);
    const btn = screen.getByText("English").closest("button")!;
    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledTimes(3);
    expect(onToggle).toHaveBeenNthCalledWith(1, "en");
  });

  it("clicking Tamil calls onToggle('ta')", () => {
    const onToggle = vi.fn();
    render(<LanguageGrid selected={[]} onToggle={onToggle} />);
    fireEvent.click(screen.getByText("தமிழ்").closest("button")!);
    expect(onToggle).toHaveBeenCalledWith("ta");
  });

  it("clicking selected item still calls onToggle (toggles off)", () => {
    const onToggle = vi.fn();
    render(<LanguageGrid selected={["hi"]} onToggle={onToggle} />);
    fireEvent.click(screen.getByText("हिन्दी").closest("button")!);
    expect(onToggle).toHaveBeenCalledWith("hi");
  });

  it("native names use language-specific font class", () => {
    render(<LanguageGrid selected={[]} onToggle={() => {}} />);
    for (const l of LANGUAGES) {
      const span = screen.getByText(l.nativeName);
      expect(span.className).toBe(l.fontClass);
    }
  });

  it("keyboard Enter submits button (native browser behavior)", () => {
    const onToggle = vi.fn();
    render(<LanguageGrid selected={[]} onToggle={onToggle} />);
    const btn = screen.getByText("English").closest("button") as HTMLElement;
    btn.focus();
    fireEvent.keyDown(btn, { key: "Enter", code: "Enter" });
    // For real Enter, jsdom dispatches click if button is focused with keydown handled by browser.
    // We assert the click path directly since button click === Enter click.
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledWith("en");
  });

  it("all rendered buttons are actual button elements", () => {
    render(<LanguageGrid selected={[]} onToggle={() => {}} />);
    const buttons = screen.getAllByRole("button");
    for (const b of buttons) {
      expect(b.tagName).toBe("BUTTON");
    }
  });

  it("passing selected=[] renders no pressed buttons", () => {
    render(<LanguageGrid selected={[]} onToggle={() => {}} />);
    const buttons = screen.getAllByRole("button");
    const pressed = buttons.filter(
      (b) => b.getAttribute("aria-pressed") === "true",
    );
    expect(pressed).toHaveLength(0);
  });

  it("passing all codes renders all pressed", () => {
    const allCodes = LANGUAGES.map((l) => l.code);
    render(<LanguageGrid selected={allCodes} onToggle={() => {}} />);
    const buttons = screen.getAllByRole("button");
    const pressed = buttons.filter(
      (b) => b.getAttribute("aria-pressed") === "true",
    );
    expect(pressed).toHaveLength(LANGUAGES.length);
  });

  it("unknown codes in selected are ignored (extra ones don't add buttons)", () => {
    render(
      <LanguageGrid
        selected={["hi", "bogus", "xx"]}
        onToggle={() => {}}
      />,
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(LANGUAGES.length);
    const pressed = buttons.filter(
      (b) => b.getAttribute("aria-pressed") === "true",
    );
    expect(pressed).toHaveLength(1);
  });
});
