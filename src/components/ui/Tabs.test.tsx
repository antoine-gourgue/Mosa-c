import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Tabs } from "./Tabs";

describe("Tabs", () => {
  it("marks the active link tab with aria-current and links to its href", () => {
    render(
      <Tabs
        ariaLabel="Profile"
        active="saved"
        items={[
          { key: "created", label: "Created", href: "/u/me?tab=created" },
          { key: "saved", label: "Saved", href: "/u/me?tab=saved" },
        ]}
      />,
    );
    const active = screen.getByRole("link", { name: "Saved" });
    expect(active).toHaveAttribute("aria-current", "page");
    expect(active).toHaveAttribute("href", "/u/me?tab=saved");
    expect(screen.getByRole("link", { name: "Created" })).not.toHaveAttribute("aria-current");
  });

  it("calls onChange with the key of a clicked button tab", () => {
    const onChange = vi.fn();
    render(
      <Tabs
        ariaLabel="Settings"
        active="account"
        onChange={onChange}
        items={[
          { key: "account", label: "Account" },
          { key: "privacy", label: "Privacy" },
        ]}
      />,
    );
    const tab = screen.getByRole("tab", { name: "Privacy" });
    expect(screen.getByRole("tab", { name: "Account" })).toHaveAttribute("aria-selected", "true");
    fireEvent.click(tab);
    expect(onChange).toHaveBeenCalledWith("privacy");
  });
});
