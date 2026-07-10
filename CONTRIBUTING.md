# Contributing to BazaarBoard

Thanks for the interest. BazaarBoard is a small, opinionated codebase — read this before opening a PR.

## Ground rules

- **TypeScript strict, always.** `tsconfig.json` has `strict`, `noUnusedLocals`, and `noUnusedParameters` on. Do not weaken those flags. Do not use `any` — reach for `unknown` and narrow, or add a discriminated union.
- **No new runtime dependencies without discussion.** Open an issue first and explain the size, the maintenance status, and why a hand-rolled or Web-Platform-native alternative is worse. Anything that ships to the browser bundle gets scrutinized against bundle size. The current runtime deps are `next`, `react`, `react-dom`, and `jszip` — additions need a very good reason.
- **The server-side key never leaks.** Any change that touches `/api/generate` or the BYOK layer must preserve the invariants in `SECURITY.md`. No `NEXT_PUBLIC_*` credentials, no logging of raw keys, no forwarding to third-party origins.
- **The fenced-prompt contract is load-bearing.** Do not move user text out of the `<UNTRUSTED_INPUT>` region in `src/lib/generate.ts`. If you need to add a new user-controlled slot, extend the fence — don't bypass it.

## Local workflow

```bash
npm install
cp .env.example .env.local
npm run dev
```

Before you push, this must pass:

```bash
npm run typecheck && npm run build && npm test
```

Playwright end-to-end tests (`npm run e2e`) are optional for a PR unless you touched the client-side generation loop, the BYOK modal, or the ZIP export path. If you touched any of those, include a run.

## Style

- No comments that restate the code. Comments explain *why*, not *what*.
- Files stay small and single-purpose. If a file crosses ~300 lines, that is a signal to split by concern (data → logic → view).
- Tailwind classes stay inline; if a class list gets unreadable, extract a small React component rather than reaching for `@apply`.
- Prefer named exports. Default exports only where Next.js requires them (`page.tsx`, `layout.tsx`, `route.ts`).

## Commits and PRs

- One logical change per PR. Two features = two PRs.
- Commit messages should explain the change in plain English — "add Gujarati preset with correct Noto Sans Gujarati fallback" is good; "fix stuff" is not.
- Screenshots or short screen recordings are welcome for any change that touches the visible UI.

## Areas that welcome contributions

- Additional Indic scripts beyond the initial eight (Odia, Assamese, Meitei, Ol Chiki, Perso-Arabic Urdu).
- Better SVG fallback templates for the WhatsApp 9:16 and GBP 1:1 surfaces.
- Accessibility (keyboard nav, screen-reader landmarks, reduced-motion respect).
- Sample presets for retail verticals (sweet shops, chaat carts, tailors, general stores).
