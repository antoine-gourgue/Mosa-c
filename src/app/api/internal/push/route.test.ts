import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({ env: { REALTIME_INTERNAL_SECRET: "s3cret" } }));
vi.mock("@/server/push", () => ({ sendPushToUser: vi.fn() }));

import { env } from "@/lib/env";
import { sendPushToUser } from "@/server/push";
import { POST } from "./route";

const mutableEnv = env as { REALTIME_INTERNAL_SECRET?: string };

function post(body: unknown, secret?: string): Request {
  return new Request("http://app/api/internal/push", {
    method: "POST",
    headers: secret === undefined ? {} : { "x-internal-secret": secret },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mutableEnv.REALTIME_INTERNAL_SECRET = "s3cret";
});

describe("POST /api/internal/push", () => {
  it("rejects a missing or wrong secret", async () => {
    expect((await POST(post({ userIds: ["u1"], payload: {} }))).status).toBe(401);
    expect((await POST(post({ userIds: ["u1"], payload: {} }, "wrong"))).status).toBe(401);
    expect(sendPushToUser).not.toHaveBeenCalled();
  });

  it("rejects a body without a payload object", async () => {
    expect((await POST(post({ userIds: ["u1"] }, "s3cret"))).status).toBe(400);
  });

  it("fans the push out to each user and returns 204", async () => {
    const response = await POST(
      post({ userIds: ["u1", "u2"], payload: { title: "t", body: "b" } }, "s3cret"),
    );
    expect(response.status).toBe(204);
    expect(sendPushToUser).toHaveBeenCalledTimes(2);
    expect(sendPushToUser).toHaveBeenCalledWith("u1", { title: "t", body: "b" });
  });
});
