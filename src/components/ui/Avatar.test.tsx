import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Avatar } from "./Avatar";

describe("Avatar", () => {
  it("shows uppercase initials when there is no image", () => {
    render(<Avatar name="Mira Solène" />);
    expect(screen.getByText("MS")).toBeInTheDocument();
  });

  it("renders the verified badge when verified", () => {
    render(<Avatar name="Bloom Co" verified />);
    expect(screen.getByLabelText("Verified")).toBeInTheDocument();
  });

  it("omits the verified badge by default", () => {
    render(<Avatar name="Bloom Co" />);
    expect(screen.queryByLabelText("Verified")).not.toBeInTheDocument();
  });
});
