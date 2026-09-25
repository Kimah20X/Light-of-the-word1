import { describe, expect, it } from "vitest";
import {
  hashAccountPassword,
  hashSessionToken,
  normalizeAccountEmail,
  verifyAccountPassword,
} from "../server/account-auth";

describe("MongoDB password account primitives", () => {
  it("normalizes email addresses for consistent lookup", () => {
    expect(normalizeAccountEmail("  Reader@Example.COM  ")).toBe("reader@example.com");
  });

  it("creates verifiable salted scrypt password hashes", async () => {
    const result = await hashAccountPassword("correct horse battery staple");
    expect(result.salt).toBeTruthy();
    expect(result.hash).not.toBe("correct horse battery staple");
    await expect(verifyAccountPassword("correct horse battery staple", result.salt, result.hash)).resolves.toBe(true);
    await expect(verifyAccountPassword("wrong password", result.salt, result.hash)).resolves.toBe(false);
  });

  it("stores only deterministic one-way digests of session tokens", () => {
    expect(hashSessionToken("token")).toHaveLength(64);
    expect(hashSessionToken("token")).toBe(hashSessionToken("token"));
    expect(hashSessionToken("token")).not.toBe("token");
  });
});
