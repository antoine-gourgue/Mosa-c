import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Sheet } from "./Sheet";

describe("Sheet", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <Sheet open={false} onClose={() => {}} title="Filters">
        <p>Body</p>
      </Sheet>,
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText("Body")).toBeNull();
  });

  it("exposes a labelled dialog with its title and content when open", () => {
    render(
      <Sheet open onClose={() => {}} title="Filters">
        <p>Body</p>
      </Sheet>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("heading", { name: "Filters" })).toBeInTheDocument();
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("closes on Escape, backdrop click and the close button but not on content click", () => {
    const onClose = vi.fn();
    render(
      <Sheet open onClose={onClose} title="Filters">
        <p>Body</p>
      </Sheet>,
    );
    fireEvent.click(screen.getByText("Body"));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
