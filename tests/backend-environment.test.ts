import fs from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { loadBackendEnvironment } from "../backend/load-environment";

const projectRoot = "/virtual/lightword";

function mockLocalFiles(backend?: string, root?: string) {
  vi.spyOn(fs, "readFileSync").mockImplementation((path) => {
    if (String(path) === `${projectRoot}/backend/.env` && backend !== undefined) return backend;
    if (String(path) === `${projectRoot}/.env` && root !== undefined) return root;
    throw new Error("Fixture file not found");
  });
}

afterEach(() => vi.restoreAllMocks());

describe("backend environment loading", () => {
  it("never overwrites injected runtime secrets", () => {
    mockLocalFiles("TEST_SETTING=backend", "TEST_SETTING=root");
    const target = { TEST_SETTING: "injected" };
    loadBackendEnvironment(projectRoot, target);
    expect(target.TEST_SETTING).toBe("injected");
  });

  it("prefers backend-local values over the root compatibility file", () => {
    mockLocalFiles("TEST_SETTING=backend", "TEST_SETTING=root\nROOT_ONLY=fallback");
    const target: Record<string, string> = {};
    loadBackendEnvironment(projectRoot, target);
    expect(target).toEqual({ TEST_SETTING: "backend", ROOT_ONLY: "fallback" });
  });

  it("allows a missing backend-local file in managed hosting", () => {
    mockLocalFiles(undefined, "TEST_SETTING=root");
    const target: Record<string, string> = {};
    loadBackendEnvironment(projectRoot, target);
    expect(target.TEST_SETTING).toBe("root");
  });
});
