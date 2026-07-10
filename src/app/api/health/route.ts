/**
 * GET /api/health — monitoring probe.
 *
 * Returns a JSON snapshot of the service state. This is what external
 * uptime pingers (and the in-app StatusIndicator) hit every N seconds.
 *
 * The response is small on purpose so it's cheap to poll. `ok` is
 * always true here — a route that responds at all is by definition up;
 * any deeper degradation (no billing key, fallback mode) is reported
 * via the geminiKeyConfigured flag.
 */

import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY),
    model: process.env.NB2_MODEL ?? "gemini-3.1-flash-lite-image",
    uptime: process.uptime(),
  });
}
