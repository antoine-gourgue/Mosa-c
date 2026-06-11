import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Toggle } from "./Toggle";

describe("Toggle", () => {
  it("exposes a switch role reflecting the checked state", () => {
    render(<Toggle checked onChange={() => {}} label="Private account" />);
    const toggle = screen.getByRole("switch", { name: "Private account" });
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("calls onChange with the toggled value on click", () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} label="x" />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("is disabled and does not fire onChange when disabled", () => {
    const onChange = vi.fn();
    render(<Toggle checked={false} onChange={onChange} disabled label="x" />);
    const toggle = screen.getByRole("switch");
    expect(toggle).toBeDisabled();
    fireEvent.click(toggle);
    expect(onChange).not.toHaveBeenCalled();
  });
});
