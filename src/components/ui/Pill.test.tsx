import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Pill } from "./Pill";

describe("Pill", () => {
  it("renders a button reflecting the active state", () => {
    render(<Pill active>Home</Pill>);
    expect(screen.getByRole("button", { name: "Home" })).toHaveAttribute("aria-pressed", "true");
  });

  it("renders a link when href is set", () => {
    render(<Pill href="/boards">Saved</Pill>);
    expect(screen.getByRole("link", { name: "Saved" })).toHaveAttribute("href", "/boards");
  });
});
