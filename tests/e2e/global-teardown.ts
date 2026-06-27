import { readFile } from "node:fs/promises";
import path from "node:path";
import { cleanupE2EData, createE2EAdminClient } from "./cleanup";

function parseEnvFile(content: string) {
  const env: Record<string, string> = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

async function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env.local");

  try {
    const parsed = parseEnvFile(await readFile(envPath, "utf8"));

    for (const [key, value] of Object.entries(parsed)) {
      if (!process.env[key] && value) {
        process.env[key] = value;
      }
    }
  } catch {
    // Optional. The test run can also inherit environment variables directly.
  }
}

export default async function globalTeardown() {
  await loadLocalEnv();
  await cleanupE2EData(createE2EAdminClient());
}
