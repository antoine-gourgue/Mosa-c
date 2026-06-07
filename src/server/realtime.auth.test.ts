// @vitest-environment node
import { describe, expect, it } from "vitest";
import { encode } from "next-auth/jwt";
import { userIdFromCookieHeader } from "../../realtime/auth";

const SECRET = "test-secret-at-least-thirty-two-characters";
const SALT = "authjs.session-token";

describe("userIdFromCookieHeader", () => {
  it("resolves the user id from a valid session cookie", async () => {
    const token = await encode({ token: { id: "user_42" }, secret: SECRET, salt: SALT });
    const id = await userIdFromCookieHeader(`${SALT}=${encodeURIComponent(token)}`, SECRET);
    expect(id).toBe("user_42");
  });

  it("returns null for a token signed with a different secret", async () => {
    const token = await encode({
      token: { id: "user_42" },
      secret: "a-completely-different-secret-value-here",
      salt: SALT,
    });
    const id = await userIdFromCookieHeader(`${SALT}=${encodeURIComponent(token)}`, SECRET);
    expect(id).toBeNull();
  });

  it("returns null when there is no session cookie", async () => {
    expect(await userIdFromCookieHeader(undefined, SECRET)).toBeNull();
    expect(await userIdFromCookieHeader("other=1; foo=bar", SECRET)).toBeNull();
  });
});
