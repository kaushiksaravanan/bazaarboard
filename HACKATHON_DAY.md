# Hackathon Day Plan — 10:30 AM → 5:00 PM

**Total window:** 6h 30m. Cut submission at 4:45 PM so the demo video
records cleanly by 5.

## Rule reminder

> **New Work Only:** You may not present an existing project as your
> own work. Failure to clearly distinguish your contributions will
> result in immediate disqualification.

The scaffold in this repo is the **starting line** — a working shell that
proves the architecture. Everything worth showing to a judge gets built
during the hackathon window. The scaffold commits from before 10:30 AM
are pinned to the `pre-hackathon` tag. All hackathon-day commits go on
a `main` branch that starts at that tag. When you demo, walk judges
through the diff `git log pre-hackathon..HEAD` to make the day's work
clear.

## Pre-flight (before 10:30 AM)

- [ ] `git checkout -b pre-hackathon` at commit `<scaffold-final>`, tag it.
- [ ] Verify `npm run dev` boots.
- [ ] Verify the fallback model responds to a single `curl /api/generate`.
- [ ] Have Discord open. Grab the day-of Gemini key when it's announced.
- [ ] Have `vercel` CLI logged in; deploy the scaffold under the
      hackathon-day branch so you have a live URL to iterate on.

## Hour 1 (10:30 – 11:30): Prove NB2 Lite

- [ ] Set `GEMINI_API_KEY` from the day-of creds. Set
      `NB2_MODEL=gemini-3.1-flash-lite-image`.
- [ ] Ship one poster in Hindi. Photograph the browser to
      time-stamp "hackathon started, first generation working."
- [ ] Log the actual latency and cost from the response headers if
      Gemini exposes them. Screenshot for the demo.

## Hour 2 (11:30 – 12:30): Speed-of-typing UX

- [ ] Tighten the debounce from 400ms → 150ms.
- [ ] Add a per-cell skeleton animation so the "cell went stale, fresh
      render is streaming in" feeling is visible even when latency is
      good.
- [ ] Add an "N/M rendered" counter in the header so judges see the
      pipeline throughput out loud.

## Hour 3 (12:30 – 1:30): The demo hook

The 3-minute demo needs one memorable moment. Pick one:

**A. Live pen-and-paper race.** Have a paper pad and pen at the demo
station. Announce: "I'll type this poster. Give me a random product +
price + language combo." Judge shouts one out. Type it live; the grid
renders in five scripts in under 15 seconds. The point lands
immediately.

**B. Bulk export.** "The Colombo Rice merchant just got 50 new SKUs
from their wholesaler." Click one button; 50 SKUs × 4 languages × 3
surfaces = 600 posters render in under 3 minutes. Show the folder
filling up. Compares favorably to Canva (10s+/image = 100 minutes) or
Photoshop (weeks).

Pick A for the round-1 3-min demo; save B for round-2 finalist stage.

## Hour 4 (1:30 – 2:30): The India-specific hook

- [ ] Add a "WhatsApp Business" export button — copy the 9:16 render
      directly to the user's clipboard as a data URL, with a one-line
      caption in the target language. Same for Google Business Profile
      1:1 render.
- [ ] Add a "print A4" shortcut that opens the browser print dialog
      with the poster sized to A4 correctly.
- [ ] Add sample presets from three actual retail categories that
      demo well: kirana staples (rice, dal, oil), sweet shop (mithai
      names — beautiful in Devanagari), street food (chaat items).

## Hour 5 (2:30 – 3:30): Polish + edge cases

- [ ] The Malayalam and Bengali scripts are the ones judges will scrutinize
      most (least common in English-language design tools). Test them
      side by side against a real Malayalam-script poster (Google Images
      references). Fix prompt if character forms are off.
- [ ] Add a "before/after" toggle — render the same poster with a
      generic Latin-script fallback next to the correct Indic script.
      Judges see the difference in typography fidelity immediately.
- [ ] Add analytics to the API route so the demo shows total posters
      generated during the hackathon (with a live counter).

## Hour 6 (3:30 – 4:30): The pitch

- [ ] Write a 90-second script for the demo video. Structure:
  - 0-15s: "63M kirana stores. 22 scripts. Canva doesn't do this."
  - 15-30s: Product-name typing → 5 scripts render → judge sees it.
  - 30-45s: Toggle surface (poster → WhatsApp → GBP) → same content, three formats.
  - 45-60s: Bulk export (10 SKUs × 5 langs = 50 posters live).
  - 60-75s: NB2 Lite as the load-bearing infra ("$0.034 per 1k images,
    <4s each — this only works at NB2 Lite's cost/speed curve").
  - 75-90s: India-specific angle. Distribution: JioMart, WhatsApp
    Business. Wrap.
- [ ] Record the video. Keep it 60s max — one-minute limit per rules.
- [ ] Ensure the repo is public, all team members added to the CV
      submission, demo URL accessible.

## 4:30 – 5:00: Submit

- [ ] Submit at https://cerebralvalley.ai/e/google-deepmind-bangalore-hackathon/hackathon/submit
- [ ] Confirm the submission is registered.
- [ ] Rest. Round 1 judging starts at 5.

## Round-1 judging (5:00 – 6:45)

- [ ] Live demo, 3 minutes. Preset A above.
- [ ] Q&A anticipated questions:
  - "Why not just use Canva?" → "Canva's Latin-script-first typography
    breaks on Indic scripts. NB2 Lite's high-fidelity text rendering
    is designed for exactly this failure mode."
  - "How does this scale?" → "Every input change re-renders every
    surface. At NB2 Lite's $0.034/1k, we can support a 50-SKU kirana
    at ₹100/year in gen costs."
  - "What's the moat?" → "Speed + typography. Photoshop can render
    perfect Devanagari but it's a $250/mo tool for a professional
    designer. Canva can't render it correctly. We do both at
    kirana-store price points."

## Round-2 finalist (7:00 – 8:00)

- [ ] Bulk-export demo (preset B). 600 posters live on stage.
- [ ] Anticipated question: "What's the wedge into JioMart / WhatsApp
      Business as distribution?" → Have a two-slide plan ready.

## Anti-patterns to avoid

- [ ] Do NOT demo BazaarBoard from the workproof codebase. Different
      repo, different commit history.
- [ ] Do NOT accidentally push a `.env` or `.env.local` file. Check
      `git status` before every push.
- [ ] Do NOT ship the Gemini key in any `NEXT_PUBLIC_*` env var.
- [ ] Do NOT commit anything at 10:29 AM. Wait until 10:30 sharp.
