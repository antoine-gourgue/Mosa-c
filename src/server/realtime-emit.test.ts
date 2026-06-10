import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: {
    REALTIME_INTERNAL_URL: "http://realtime:4001/",
    REALTIME_INTERNAL_SECRET: "s3cret",
  },
}));

import { env } from "@/lib/env";
import { emitToUser } from "./realtime-emit";

const mutableEnv = env as { REALTIME_INTERNAL_URL?: string; REALTIME_INTERNAL_SECRET?: string };

describe("emitToUser", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mutableEnv.REALTIME_INTERNAL_URL = "http://realtime:4001/";
    mutableEnv.REALTIME_INTERNAL_SECRET = "s3cret";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the event to the user's room on the internal endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await emitToUser("uA", "notification:new", { id: "n1" });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://realtime:4001/internal/emit",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "x-internal-secret": "s3cret" }),
        body: JSON.stringify({ room: "user:uA", event: "notification:new", payload: { id: "n1" } }),
      }),
    );
  });

  it("no-ops when the internal endpoint is not configured", async () => {
    mutableEnv.REALTIME_INTERNAL_URL = undefined;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await emitToUser("uA", "notification:new");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("swallows transport errors", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(emitToUser("uA", "notification:new")).resolves.toBeUndefined();
  });
});
