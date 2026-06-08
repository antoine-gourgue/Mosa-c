"use client";

import type { ReactElement } from "react";

/**
 * Last-resort error boundary that replaces the root layout when it fails. It
 * ships its own document shell and minimal inline styles since the app's layout
 * and styles may not have loaded.
 *
 * @param props - Error boundary props.
 * @param props.reset - Re-renders the root to retry.
 * @returns The global error document.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }): ReactElement {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          fontFamily: "system-ui, sans-serif",
          background: "#ffffff",
          color: "#111111",
          textAlign: "center",
          padding: 24,
        }}
      >
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>Something went wrong</h1>
        <p style={{ color: "#666666", margin: 0, maxWidth: 440 }}>
          An unexpected error occurred. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            cursor: "pointer",
            border: "none",
            borderRadius: 12,
            background: "#e60023",
            color: "#ffffff",
            padding: "12px 24px",
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
