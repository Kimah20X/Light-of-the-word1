import { config, type DotenvPopulateInput } from "dotenv";
import { resolve } from "node:path";

/** Run project scripts from the repository root. Injected runtime values always win. */
export function loadBackendEnvironment(
  projectRoot = process.cwd(),
  target: DotenvPopulateInput = process.env as DotenvPopulateInput,
) {
  config({
    path: [resolve(projectRoot, "backend", ".env"), resolve(projectRoot, ".env")],
    override: false,
    processEnv: target,
    quiet: true,
  });
}

loadBackendEnvironment();
