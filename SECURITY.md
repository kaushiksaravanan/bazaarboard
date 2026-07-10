# Security policy

## Reporting a vulnerability

BazaarBoard is a hackathon project, but we take security concerns seriously. If you discover a vulnerability — anything that could leak the server-side Gemini API key, allow prompt injection past the fenced `<UNTRUSTED_INPUT>` region, or expose one user's BYOK session to another — please email **kaushik.saravanan@outlook.com** with the subject line `[BazaarBoard security]` and a reproduction. A first response should arrive within 72 hours; a full triage and fix (or accepted-risk write-up) within 14 days.

Please do not open a public GitHub issue for a security concern before we've had a chance to respond. Coordinated disclosure gives us time to ship a fix and credit you in the release notes.

## Scope

In scope: the Next.js app at `bazaarboard.vercel.app`, the `/api/generate` proxy, the fenced-prompt construction in `src/lib/generate.ts`, the client-side BYOK storage layer, and any dependency in `package.json`. Out of scope: upstream Gemini model behavior, the hosting platform (Vercel), and third-party font CDNs (Google Fonts). Findings in those systems should be reported to the responsible vendor.

## Handling of secrets

The server-side `GEMINI_API_KEY` is never exposed in the client bundle, never sent to third-party origins, and never included in any log line, error response, or telemetry event. User-supplied BYOK keys live in `sessionStorage` only, are attached to `/api/generate` requests via an `x-gemini-key` header, and are wiped when the tab closes. If you find a code path that violates either of these invariants, that is a reportable security bug.
