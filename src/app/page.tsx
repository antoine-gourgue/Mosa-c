import type { ReactElement } from "react";

/**
 * Temporary landing placeholder rendered until the home feed is implemented.
 *
 * @returns The Mosaic application shell placeholder.
 */
export default function HomePage(): ReactElement {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        gap: "0.5rem",
      }}
    >
      <div>
        <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>Mosaic</h1>
        <p style={{ color: "#6b6b6b" }}>Discover, save and share visual ideas.</p>
      </div>
    </main>
  );
}
