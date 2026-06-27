import { performance } from "node:perf_hooks";

const baseUrl = (process.env.LOAD_BASE_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);
const storeSlug = process.env.LOAD_STORE_SLUG || "test-shop";
const concurrency = Number(process.env.LOAD_CONCURRENCY || 20);
const requests = Number(process.env.LOAD_REQUESTS || 200);
const paths = [`/${storeSlug}`, `/${storeSlug}/opt`, "/login"];
const results = [];

if (!Number.isInteger(concurrency) || concurrency <= 0) {
  throw new Error("LOAD_CONCURRENCY must be a positive integer.");
}

if (!Number.isInteger(requests) || requests <= 0) {
  throw new Error("LOAD_REQUESTS must be a positive integer.");
}

let nextRequest = 0;

async function hit(path) {
  const startedAt = performance.now();
  let status = 0;
  let ok = false;
  let error = "";

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      redirect: "manual",
    });
    status = response.status;
    ok = status >= 200 && status < 400;
    await response.arrayBuffer();
  } catch (caughtError) {
    error =
      caughtError instanceof Error ? caughtError.message : String(caughtError);
  }

  results.push({
    durationMs: performance.now() - startedAt,
    error,
    ok,
    path,
    status,
  });
}

async function worker() {
  while (nextRequest < requests) {
    const requestNumber = nextRequest;
    nextRequest += 1;
    await hit(paths[requestNumber % paths.length]);
  }
}

await Promise.all(
  Array.from({ length: Math.min(concurrency, requests) }, () => worker()),
);

const failures = results.filter((result) => !result.ok);
const sortedDurations = results
  .map((result) => result.durationMs)
  .sort((first, second) => first - second);
const percentile = (value) =>
  sortedDurations[Math.min(sortedDurations.length - 1, Math.floor(value * sortedDurations.length))] ?? 0;
const byStatus = results.reduce((accumulator, result) => {
  const key = result.status || result.error || "unknown";
  accumulator[key] = (accumulator[key] ?? 0) + 1;
  return accumulator;
}, {});

console.log(
  JSON.stringify(
    {
      baseUrl,
      byStatus,
      concurrency,
      failed: failures.length,
      p50Ms: Math.round(percentile(0.5)),
      p95Ms: Math.round(percentile(0.95)),
      requests,
      successRate: Number(((results.length - failures.length) / results.length).toFixed(4)),
    },
    null,
    2,
  ),
);

if (failures.length > 0) {
  console.error("First failures:");
  console.error(JSON.stringify(failures.slice(0, 5), null, 2));
  process.exit(1);
}
