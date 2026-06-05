import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { ToastProvider, useToast } from "./toast";

function Trigger(): ReactElement {
  const { show } = useToast();
  return <button onClick={() => show({ title: "Saved to Quick Saves" })}>open</button>;
}

describe("ToastProvider", () => {
  it("shows a toast when requested", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    expect(screen.queryByText("Saved to Quick Saves")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "open" }));
    expect(screen.getByText("Saved to Quick Saves")).toBeInTheDocument();
  });

  it("throws when useToast is used outside the provider", () => {
    function Orphan(): ReactElement {
      useToast();
      return <span />;
    }
    expect(() => render(<Orphan />)).toThrow();
  });
});
