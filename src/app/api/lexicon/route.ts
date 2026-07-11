/**
 * GET /api/lexicon — ISL sign lexicon passthrough.
 *
 * Static-file bridge to `public/isl/lexicon.json`, which Agent C
 * assembles (mapping ISL glosses → sign asset URLs/metadata). If the
 * file is missing (e.g. Agent C hasn't shipped yet) we return an
 * empty `{signs: {}}` payload and log a warning so the avatar client
 * still boots.
 *
 * Cached at the CDN edge for one hour (`public, max-age=3600`) since
 * the lexicon is versioned by deploy, not per-request.
 */

import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

interface Lexicon {
  signs: Record<string, unknown>;
  version: string;
}

const EMPTY_VERSION = "0.0.0";

function logLexicon(fields: {
  requestId: string;
  latencyMs: number;
  kind: "ok" | "empty" | "error";
  signCount?: number;
  reason?: string;
  level?: "info" | "warn" | "error";
}): void {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      route: "/api/lexicon",
      level: fields.level ?? "info",
      ...fields,
    }),
  );
}

const CACHE_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "public, max-age=3600",
};

export async function GET(): Promise<NextResponse> {
  const requestId = crypto.randomUUID();
  const started = Date.now();
  const filePath = path.join(
    process.cwd(),
    "public",
    "isl",
    "lexicon.json",
  );

  try {
    const raw = await readFile(filePath, "utf8");
    // Parse-then-serialize so we validate JSON shape at the edge and
    // return a canonical body — a corrupt lexicon would otherwise poison
    // the CDN cache for an hour.
    const parsed = JSON.parse(raw) as unknown;
    const asObj =
      parsed && typeof parsed === "object"
        ? (parsed as { signs?: unknown; version?: unknown })
        : {};
    const signs: Record<string, unknown> =
      asObj.signs && typeof asObj.signs === "object"
        ? (asObj.signs as Record<string, unknown>)
        : {};
    const version =
      typeof asObj.version === "string" ? asObj.version : EMPTY_VERSION;
    const lexicon: Lexicon = { signs, version };
    const count = Object.keys(signs).length;
    logLexicon({
      requestId,
      latencyMs: Date.now() - started,
      kind: "ok",
      signCount: count,
    });
    return new NextResponse(JSON.stringify(lexicon), {
      status: 200,
      headers: CACHE_HEADERS,
    });
  } catch (err) {
    const isMissing =
      err instanceof Error &&
      (("code" in err && (err as NodeJS.ErrnoException).code === "ENOENT") ||
        /ENOENT/i.test(err.message));
    logLexicon({
      requestId,
      latencyMs: Date.now() - started,
      kind: "empty",
      reason: isMissing
        ? "lexicon-not-yet-built"
        : err instanceof Error
          ? err.message
          : "read-failed",
      level: "warn",
    });
    const empty: Lexicon = { signs: {}, version: EMPTY_VERSION };
    return new NextResponse(JSON.stringify(empty), {
      status: 200,
      headers: CACHE_HEADERS,
    });
  }
}
