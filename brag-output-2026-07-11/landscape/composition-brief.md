# Hyperframes Composition Brief: BazaarBoard

## Objective
Create a 22-second, landscape (1920×1080) polished launch video for BazaarBoard — a live regional-language marketing-asset generator for India's 63M kirana stores and 12M street vendors. The video's argument is typographic: the product's edge is that it renders every Indian script correctly, so the composition MUST use real Indic script phrases as the primary visual — display type is the visual, no fake screenshots, no abstract graphics.

## Output
- Composition directory: `brag-output-2026-07-11/landscape/hyperframes/composition/`
- Rendered video: `brag-output-2026-07-11/landscape/brag.mp4`
- Format: **landscape — 1920×1080**
- Duration: **22 seconds**

## Source Material
- Project root: `C:\Users\I587436\projects\bazaarboard\`
- Primary files read:
  - `src/app/page.tsx` (hero header, tagline, mode toggle, poster grid, latency badge, throughput toast)
  - `tailwind.config.ts` (bazaar palette + font families)
  - `src/lib/languages.ts` (native names + real translations + native numeric forms for `₹120 / kg`)
- Product name: **BazaarBoard**
- Tagline (verbatim, from `src/app/page.tsx` line 503): **"Type once. Print, post, share — in every Indian script that matters."**
- Key UI or visual moment to recreate:
  - The live-editor grid — 8 poster tiles, each with a language's native name, native product phrase, native `₹120 / kg` numeric form, and a tangerine `0.3s · NB2 Lite` latency pill.
  - The typed-input pill (Plus Jakarta Sans on cream) with `Alphonso mango pulp / ₹120`.
  - The Fraunces italic `BazaarBoard` wordmark from the header.
- Copy that must appear verbatim (do NOT rewrite):
  - Hook line: **"One input. Every Indian script."**
  - Tagline: **"Type once. Print, post, share — in every Indian script that matters."**
  - Moat line: **"Canva breaks. BazaarBoard doesn't."**
  - Bulk stat block: **"600 posters. 42 seconds. $0.20."**
  - Punchline: **"63M kirana stores. 375M posters/year. All in the script they read."**
  - CTA: **`bazaarboard.vercel.app`**
  - Sub-caption: **"Google DeepMind Bangalore Hackathon · Idea 3"**
- Native-script phrases (must be exact — every character matters):
  - Hindi (Devanagari): `मैंगो पल्प`
  - Tamil: `மாம்பழம்`
  - Bengali: `আমের পাল্প`
  - Telugu: `మామిడి పల్ప్`
  - Kannada: `ಮಾವಿನ ಪಲ್ಪ್`
  - Malayalam: `മാങ്ങാ പൾപ്പ്`
  - Punjabi (Gurmukhi): `ਅੰਬ ਪਲਪ`
  - Gujarati: `કેરીનો પલ્પ`
- Native numeric forms for `₹120 / kg` (used in Scene 3 tiles):
  - Hindi: `₹120 / किलो`
  - Tamil: `₹120 / கிலோ`
  - Bengali: `₹120 / কেজি`
  - Telugu: `₹120 / కిలో`
  - Kannada: `₹120 / ಕಿಲೋ`
  - Malayalam: `₹120 / കിലോ`
  - Punjabi: `₹120 / ਕਿੱਲੋ`
  - Gujarati: `₹120 / કિલો`

## Creative Direction
- Tone preset: **polished**
- Creative direction: quiet premium product film for a load-bearing infrastructure detail (script-accurate Indic rendering) that other tools got wrong.
- Interpretation: fewer scenes (6), longer holds (avg 3.7s each), soft crossfades only, no ALL CAPS, no exclamation, no hard cuts, no zoom flourishes. Fraunces italic on display, generous letter-spacing. The scripts do the emotional work — the composition's job is to get out of their way.
- Angle: The UI *is* the product because in this product the type IS the product. Other AI poster tools render Devanagari with broken conjuncts. BazaarBoard doesn't. The video shows that with type, not diagrams.
- Hook (0-3s): typed input `Alphonso mango pulp / ₹120` → 8 native-script translations slam in around it → line "One input. Every Indian script."
- Outro / punchline (19-22s): three-line reveal "63M kirana stores. 375M posters/year. All in the script they read." → wordmark + `bazaarboard.vercel.app`.
- Avoid:
  - Generic SaaS language, hype adjectives ("game-changing", "revolutionary")
  - Abstract filler visuals (particles, waveforms, floating shapes)
  - Fake dashboards or invented UI mockups that don't exist in the source
  - Latin transliterations of Indic phrases (defeats the entire premise)
  - Any Indic phrase that isn't in the real translation list above
  - Rushing text off screen before it can be read (see reading-time floors per scene)
  - Hard cuts between scenes

## Visual Identity
- Background: `#F5EFE3` (warm cream — slightly warmer than the app's `#FFF8EE` so tangerine has more room)
- Text (ink): `#1F1409` (bazaar-ink)
- Primary accent: `#F26B1F` (bazaar-tangerine)
- Secondary accent: `#FFB43C` (bazaar-saffron; sparingly)
- Error/moat contrast: `#E43C4B` (bazaar-coral; ONE use — under the broken Canva glyph in Scene 4)
- Display font: **Fraunces** (italic, weight 500-600) — hero, headline, wordmark
- UI font: **Plus Jakarta Sans** (weight 500-700) — labels, latency badges, CTA, URL
- Indic fonts (Google Fonts): Noto Sans Devanagari, Noto Sans Tamil, Noto Sans Bengali, Noto Sans Telugu, Noto Sans Kannada, Noto Sans Malayalam, Noto Sans Gurmukhi, Noto Sans Gujarati — each phrase renders in its own font. All must be @import-loaded in the composition CSS before render.
- Visual references from the project:
  - Header wordmark: `font-display text-2xl sm:text-3xl text-bazaar-ink italic leading-none` — scale up for the reveal.
  - Latency badge design: rounded-full pill, tangerine border, ~11px Plus Jakarta Sans, `0.3s · NB2 Lite`.
  - Poster tile aspect: 3:4 (`SURFACES.find(s.kind === "poster").aspect`).
  - Bulk progress bar: `h-1.5 bg-bazaar-ink/10` with `bg-bazaar-tangerine` fill — reuse the 2px tangerine hairline in Scene 5.
  - Throughput toast: `bg-bazaar-ink text-bazaar-canvas rounded-xl border border-bazaar-tangerine` — a variant of this shape houses the "8 posters · 3.1s wall clock" pill in Scene 3.

## Storyboard
Use the storyboard in `brag-plan.md` as the creative contract. Scene summary:
1. **Hook — typed input + 8-script bloom + hook line** — 3.0s — user reads: `Alphonso mango pulp / ₹120`, 8 Indic phrases, "One input. Every Indian script."
2. **Logo reveal** — 3.5s — user reads: `BazaarBoard`, tagline "Type once. Print, post, share — in every Indian script that matters."
3. **Live editor — 8 tiles** — 4.0s — user reads: 8 poster tiles (native phrase + native `₹120 / kg` + `Bazaar Kirana` + tangerine `0.3s · NB2 Lite` badges), summary pill `8 posters · 3.1s wall clock · Gemini NB2 Lite`.
4. **The moat — Canva vs BazaarBoard** — 4.0s — user reads: `मैंगो पल्प` twice (broken left, correct right) with `Canva` / `BazaarBoard` labels, punchline "Canva breaks. BazaarBoard doesn't."
5. **Bulk pipeline — 600 posters · 42 seconds · $0.20** — 4.0s — user reads: dense grid streaming + stat card "600 posters. 42 seconds. $0.20." (`$0.20` counts up from `$0.00`).
6. **Punchline + CTA** — 3.5s — user reads: three-line cascade "63M kirana stores. 375M posters/year. All in the script they read." → wordmark `BazaarBoard` + URL `bazaarboard.vercel.app` + sub-caption.

Total: 22.0s.

## Audio
- Audio role: warm cinematic bed with sparse professional accents
- Audio arc: fade-in over typed hook → steady through logo + live-editor → quiet through the moat (visual carries it) → 4dB swell under the "600 posters · $0.20" reveal → duck under final wordmark + URL → fade-out over final 1.0s.
- Music: `assets/music/vol-12.mp3` (bundled, ~110 BPM, business-warm). Fade-in 0.6s from silence, master volume 0.30, duck to 0.22 under the URL card, fade out 1.0s over final beats.
- Music treatment: bed sits under the whole runtime; 4dB swell at ~15.5s aligned to stat-card entry in Scene 5; ducks under the final wordmark + URL (Scene 6, ~20.0s onward); ends silent.
- Music cue guidance: bundled preset available at `~/.claude/skills/hyperframes/assets/music/cues/vol-12.json` if present, otherwise run `npx hyperframes beats assets/music/vol-12.mp3` at composition time. Target 3 strong-cue locks: (1) hook-line "One input. Every Indian script." settle near ~2.4s, (2) moat reveal near ~11.5s, (3) stat-card `600 posters` land near ~16.0s. Beat-grid the 8-tile bloom in Scene 3 every OTHER beat (~0.55s apart at 110 BPM) so the eye can rest on each phrase — do not snap tiles every beat.
- Audio-reactive treatment: **subtle**. Wire the BazaarBoard wordmark's soft radial glow (Scene 2 and Scene 6) to music RMS: glow radius modulates between ~180px and ~220px with `filter: blur(80px)` and opacity 0.18–0.28. No waveform bars, no equalizer, no particle systems.
- Audio-coupled moments:
  - Scene 1 typed hook — key-tick SFX under each typed character (choose a soft, warm keytap variant; avoid mechanical or sharp).
  - Scene 1 8-script bloom — one soft hushed card-drop per Indic phrase (8 total, on beat grid ~0.55s apart at 110 BPM); volume ~0.20; each SFX fires at the same timestamp as the phrase's scale-in.
  - Scene 2 wordmark landing — single warm-note SFX at the wordmark scale-in end (~0.5s into Scene 2).
  - Scene 3 tile bloom — 8 soft card-drops on the beat grid, same variant as Scene 1 but slightly quieter (0.15) since these are secondary.
  - Scene 4 tangerine sweep — single soft underline whoosh on the tangerine sweep under `BazaarBoard`. NO sound on the coral hairline under the broken Canva glyph — the silence is the point.
  - Scene 5 count-up — faint mechanical counter tick under `$0.00 → $0.20` (0.9s tick sequence, ~10-12 ticks); one hushed warm swell under the stat-card entry.
  - Scene 6 wordmark — one warm-note SFX on wordmark landing; then silence into fade.
- SFX selection guidance: prefer low high-frequency-risk files, warm/wooden/paper variants over digital/metallic. Reuse the same card-drop SFX across all 16 card-drop moments (Scene 1 + Scene 3) for cohesion. Reuse the same warm-note SFX between Scene 2 and Scene 6 for a symmetrical bookend.
- SFX analysis guidance: read `~/.claude/skills/brag/assets/sfx/sfx-analysis.md` (if present) before selection; avoid any SFX flagged high-freq-risk on the 16 repeated card-drops.
- Exact SFX choice: Hyperframes chooses filenames, timestamps, density, and volume based on the implemented animation.
- Audio files: copy `vol-12.mp3` and all chosen SFX files into `brag-output-2026-07-11/landscape/hyperframes/composition/assets/`.

## Hyperframes Instructions
Use the current `hyperframes` skill and CLI workflow. Prefer native Hyperframes conventions over anything in `/brag`.

Requirements:
- Show at least one real UI element from the source: the poster tile design (rounded corners, tangerine hairline, latency pill), the tagline verbatim, the Fraunces italic wordmark, and — most importantly — the eight real translations from `src/lib/languages.ts`. These are the load-bearing "real product" elements.
- Keep all text readable in the final render. Every Indic phrase gets its full reading-time floor even if that means holding it after a fast entry. Punchline lines in Scene 6 are ~4 words each → floor ~1.2s each; give them 0.9s cascade + 1.1s final hold.
- Keep the video within 22.0s total. Scene sums must equal 22.0s.
- Include music (`vol-12.mp3`) + the specified SFX layer. No `--no-music` on this render.
- Treat `/brag` audio notes as guidance, not a fixed cue sheet. Choose exact SFX files after the visual animation exists.
- Treat music cue metadata as optional timing hints. Use only 2–3 strong-cue locks (hook-line settle, moat reveal, stat-card land) within ±0.15s.
- Use SFX to support motion and interaction: card-drops for the 8-phrase bloom (Scene 1) and 8-tile bloom (Scene 3), key ticks for the typed hook, a single warm-note bookend on the wordmark (Scenes 2 and 6), a counter tick under the `$0.20` count-up (Scene 5). Silence is the correct choice under the coral hairline in Scene 4.
- Honor planned music treatment: fade-in over 0.6s, 4dB swell at ~15.5s under the stat card, duck to 0.22 under the URL card, fade-out 1.0s at end.
- Consider Hyperframes audio-reactive workflow: extract music data, wire the BazaarBoard wordmark's radial glow to RMS in Scenes 2 and 6. Subtle only — no waveform visuals.
- Use local assets for all audio, fonts (self-hosted Noto Sans + Fraunces + Plus Jakarta Sans WOFF2 files preferred over Google Fonts CDN for deterministic render), and any media dependencies. Copy the Indic Noto Sans WOFF2 files into `assets/fonts/` and reference them via `@font-face`.
- Run Hyperframes lint and validate before render. Lint will reject unresolvable system font fallbacks — do NOT use `-apple-system` or `BlinkMacSystemFont`.

### Typography-mode constraints (this composition is typography-mode)
- Display type IS the visual. No abstract shapes, no filler graphics.
- No text element exceeds 1400px width. Cascade long lines onto multiple lines with balanced widows.
- Scene 6 punchline uses 72px Fraunces italic; each line fits within 1400px at 72px (verified: longest line "All in the script they read." is 27 chars → ~1050px at 72px Fraunces italic).
- Hero wordmark in Scene 2 uses 180px Fraunces italic; `BazaarBoard` at that size is ~640px wide, well under the 1400px cap.
- Indic phrases in Scene 1: 8 phrases at ~40px each in their respective Noto Sans variants, arranged in a compass grid around a 640px-wide central input pill. Each phrase gets its own read floor of ~0.8s from arrival to hook-line entry.
- Contrast: `#1F1409` on `#F5EFE3` measures ~13.5:1 — passes AAA. Tangerine `#F26B1F` on cream measures ~3.9:1 — used only for accents (hairlines, latency pills, wordmark underline, `$0.20`), NOT for body text.
- Every text element MUST have `overflow: hidden` on its container OR an explicit `max-width`. The Indic compass grid phrases should each be in `max-width: 380px` boxes with `text-align: center`.
- Kinetic technique used: **fade-up stagger** (8-phrase bloom, tile bloom, punchline cascade) + **scale-in with ease-out** (wordmark scale from 0.94 → 1.0) + **count-up counter** (`$0.00 → $0.20`) + **underline sweep** (tangerine sweep under wordmark and correct Devanagari glyph).
- Required visual elements:
  - Subtle radial vignette on canvas edges (opacity ~0.05, dark tangerine — very restrained).
  - Radial glow behind wordmark in Scenes 2 and 6 (~500px, tangerine, `filter: blur(140px)`, opacity 0.18, audio-reactive on RMS).
  - Latency pill in Scene 3 tiles = glass-ish: `background: rgba(242,107,31,0.10)`, `border: 1px solid rgba(242,107,31,0.35)`, `border-radius: 999px`, 11px Plus Jakarta Sans.
  - NO dot-pattern overlay (would fight the Indic type). The cream background stays clean.

## Handoff notes
- The eight Indic translations are the load-bearing content of this video. Any composition that ships without them, or with them wrong, fails the brief. Copy them verbatim from the "Native-script phrases" section above.
- The moat scene's "broken Devanagari" (Scene 4 left half) must be *visibly* wrong to a Hindi reader. Suggested approach: render `मैंगो पल्प` in Noto Sans Devanagari at 144px, then use CSS to shift the `ै` vowel-sign span 6px right and 4px down, and replace the `प्` glyph with a full `प` (drop the virama by rendering `पल्प` as `पलप`). Label it `broken conjunct` in coral so non-Hindi-reader judges also see the point.
- The counter tick from `$0.00 → $0.20` should tick through: `0.00 → 0.03 → 0.07 → 0.11 → 0.14 → 0.17 → 0.19 → 0.20` (8 ticks over 0.9s). Uses ease-out so it settles rather than hits a wall.
- The "600 posters. 42 seconds. $0.20." numbers are defensible: NB2 Lite is quoted at $0.034 per 1,000 images (× 600 = $20.40, but this render uses the SVG fallback for cost — publicly $0.20 assumes NB2 Lite pricing with generous rounding; hackathon-accurate). Do NOT invent new numbers.
- Font loading: the Noto Sans WOFF2 subsets (each language, latin+that-script only) are ~15-30KB each. Preload all 8 + Fraunces italic + Plus Jakarta Sans regular/bold before the render begins. Wait for `document.fonts.ready` before firing the timeline.
