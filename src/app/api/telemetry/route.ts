/**
 * POST /api/telemetry — client analytics sink.
 *
 * Accepts a JSON body { events: TelemetryEvent[] } and logs each event
 * as structured JSON to stdout. Vercel collects stdout and makes it
 * queryable in the log dashboard, so we do NOT persist to a DB here.
 *
 * Safety caps:
 *   - Body size <= 32 KB.
 *   - Event array length <= 200.
 *   - Individual event props are logged as-is but the client library
 *     already strips credential-looking keys before sending.
 *
 * Always returns 202 (Accepted) on success — analytics is fire-and-forget.
 */

import { NextRequest, NextResponse } from "next/server";

const MAX_BODY_BYTES = 32 * 1024;
const MAX_EVENTS = 200;

interface TelemetryEventIn {
  name?: unknown;
  props?: unknown;
  ts?: unknown;
  sessionId?: unknown;
  url?: unknown;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const requestId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(Date.now());

  // Enforce body size cap. content-length may be missing on streamed
  // requests, so we also cap the buffered text length below.
  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        requestId,
        route: "/api/telemetry",
        level: "warn",
        reason: "body-too-large",
        contentLength,
      }),
    );
    return NextResponse.json({ error: "body too large" }, { status: 413 });
  }

  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return NextResponse.json({ error: "bad body" }, { status: 400 });
  }
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "body too large" }, { status: 413 });
  }

  let parsed: { events?: TelemetryEventIn[] };
  try {
    parsed = JSON.parse(raw) as { events?: TelemetryEventIn[] };
  } catch {
    return NextResponse.json({ error: "bad JSON" }, { status: 400 });
  }

  const events = Array.isArray(parsed.events) ? parsed.events : [];
  if (events.length > MAX_EVENTS) {
    return NextResponse.json(
      { error: `too many events (max ${MAX_EVENTS})` },
      { status: 413 },
    );
  }

  const timestamp = new Date().toISOString();
  const userAgent = req.headers.get("user-agent") ?? "";

  for (const ev of events) {
    const name = typeof ev.name === "string" ? ev.name : "unknown";
    const sessionId =
      typeof ev.sessionId === "string" ? ev.sessionId : "unknown";
    const url = typeof ev.url === "string" ? ev.url : "";
    const ts = typeof ev.ts === "number" ? ev.ts : Date.now();
    const props =
      ev.props && typeof ev.props === "object" ? ev.props : {};

    console.log(
      JSON.stringify({
        timestamp,
        requestId,
        route: "/api/telemetry",
        kind: "client-event",
        name,
        sessionId,
        eventTs: ts,
        url,
        userAgent,
        props,
      }),
    );
  }

  return NextResponse.json({ ok: true, accepted: events.length }, { status: 202 });
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: "POST only" }, { status: 405 });
}
