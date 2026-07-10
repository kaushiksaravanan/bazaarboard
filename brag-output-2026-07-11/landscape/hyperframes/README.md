# Hyperframes scaffold — BazaarBoard brag video

This directory is the handoff target for the Step-3 Hyperframes composition.

## What's here now

- `README.md` (this file) — next-step instructions
- `composition/` — empty scaffold for the Hyperframes composition (populated by Hyperframes in Step 3)
- `composition/assets/` — target directory for `vol-12.mp3`, SFX files, and self-hosted font WOFF2s

## What Step 3 (Hyperframes) needs to do

### 1. Read the brief and plan first

Both live one level up:
- `../composition-brief.md` — the contract
- `../brag-plan.md` — the creative north star
- `../script.md` — the exact text + timings

### 2. Initialize the composition

```bash
cd C:/Users/I587436/projects/bazaarboard/brag-output-2026-07-11/landscape/hyperframes/composition
npx hyperframes init --format landscape --duration 22
```

Expected result: `index.html`, `styles.css`, `timeline.js` (or the current Hyperframes-preferred file layout), `hyperframes.json`, and an empty `assets/` tree.

### 3. Copy audio + font assets

```bash
# Music (bundled)
cp ~/.claude/skills/hyperframes/assets/music/vol-12.mp3 assets/music/

# Fonts — download and self-host these WOFF2 subsets (Latin + script-only):
#   Fraunces-Italic-VariableFont.woff2  (or 500 + 600 static)
#   PlusJakartaSans-Variable.woff2       (or 500 + 700 static)
#   NotoSansDevanagari-Medium.woff2
#   NotoSansTamil-Medium.woff2
#   NotoSansBengali-Medium.woff2
#   NotoSansTelugu-Medium.woff2
#   NotoSansKannada-Medium.woff2
#   NotoSansMalayalam-Medium.woff2
#   NotoSansGurmukhi-Medium.woff2
#   NotoSansGujarati-Medium.woff2

mkdir -p assets/fonts
# (fetch from google-webfonts-helper or fonts.google.com API)
```

Wire the fonts via `@font-face` in `styles.css` — do NOT rely on Google Fonts CDN at render time (lint rejects unresolvable external hosts; also renders are deterministic when fonts are local).

### 4. Beat cues

```bash
# If preset exists at ~/.claude/skills/hyperframes/assets/music/cues/vol-12.json, use it.
# Otherwise:
npx hyperframes beats assets/music/vol-12.mp3
# Writes beats/vol-12.json
```

Target strong-cue locks (from `../composition-brief.md`):
- Hook line "One input. Every Indian script." settles near 2.4s.
- Moat reveal near 11.5s.
- Stat-card "600 posters" lands near 16.0s.

The 8-phrase bloom in Scene 1 and the 8-tile bloom in Scene 3 snap to every OTHER beat (~0.55s at 110 BPM) so each phrase gets its full read floor.

### 5. Build the composition per the storyboard

Six scenes, 22.0s total, per `../brag-plan.md`. Each scene's text, timing, and font are enumerated in `../script.md`.

Non-negotiables (from the brief):
- The 8 Indic translations must render verbatim from `src/lib/languages.ts` — NOT Latin transliteration.
- Real product tagline: `Type once. Print, post, share — in every Indian script that matters.`
- Tone: polished — soft crossfades only, no hard cuts, no zoom flourishes.
- Contrast: `#1F1409` on `#F5EFE3` (13.5:1 — AAA). Tangerine `#F26B1F` for accents only.
- Wordmark radial glow (Scenes 2 and 6) wires to audio RMS for subtle audio-reactive breathing.

### 6. Broken-Devanagari trick (Scene 4)

The left-half glyph MUST look wrong to a Hindi reader. Two approaches — pick whichever renders more reliably:

**A. CSS transform on span-per-character:**
```html
<div class="broken-devanagari">
  <span>म</span><span class="matra-shift">ैं</span><span>गो</span>
  <span> </span><span>प</span><span class="drop-virama">ल</span><span>प</span>
</div>
```
```css
.matra-shift { transform: translate(6px, 4px); display: inline-block; }
.drop-virama::after { content: ""; } /* just skips the virama */
```

**B. Just render the string `मैंगो पलप` (missing virama between `ल` and `प`, matra pre-shift accomplished by using `ैं` positioning that Devanagari OT tables won't apply the right form to):**

Approach B is simpler and defensible — the missing virama between `ल` and `प` IS a real broken conjunct. Add a coral `broken conjunct` label above with a coral hairline pointing at the missing joint.

### 7. Audio-reactive glow

Per the current Hyperframes audio-reactive workflow (see `references/audio-reactive.md` in the hyperframes skill):
- Extract RMS + low-band energy from `vol-12.mp3` per frame.
- In Scene 2 (3.4s–6.3s) and Scene 6 (21.3s–22.0s), wire the wordmark's `::before` radial glow to modulate:
  - `opacity`: 0.18 + rms * 0.10
  - `filter: blur()`: 120px + rms * 40px
- Subtle. If the render doesn't visibly breathe, that's correct.

### 8. Lint, validate, render

```bash
npx hyperframes lint
npx hyperframes validate
npx hyperframes render --output ../../brag.mp4
```

Target output: `C:/Users/I587436/projects/bazaarboard/brag-output-2026-07-11/landscape/brag.mp4`.

## Self-review before render

- [ ] All 8 Indic phrases match `src/lib/languages.ts` verbatim (no transliteration).
- [ ] Tagline text is verbatim from `src/app/page.tsx` line 503.
- [ ] Total duration = 22.0s exactly. Scene sums checked.
- [ ] No text element exceeds 1400px width at its font size.
- [ ] No hard cuts. All transitions are soft crossfades or the tangerine hairline wipe (Scene 3→4).
- [ ] Music fades in over 0.6s, ducks under URL, fades out 1.0s at end.
- [ ] At least 2 strong-cue locks marked `// beat-locked` in the timeline (hook-line at ~2.4s, stat-card at ~16.0s).
- [ ] The 8-phrase bloom and 8-tile bloom snap to every-other-beat (marked `// beat-grid`).
- [ ] Wordmark glow is audio-reactive (subtle RMS coupling on Scenes 2 and 6).
- [ ] Broken-Devanagari glyph in Scene 4 is visibly malformed AND labeled with a coral `broken conjunct` callout so non-Hindi readers get the point.
- [ ] `Hyperframes lint` and `validate` both pass.

## If a step blocks

- Font not available in the expected subset: fetch from `https://gwfh.mranftl.com/api/fonts/<family>?subsets=<script>&formats=woff2`.
- `vol-12.mp3` missing from bundled assets: fall back to `vol-11.mp3` (~108 BPM, medium) and re-detect beats.
- `hyperframes beats` unavailable: use natural timing per `../script.md` T-values; skip the beat-locked markers but keep the crossfades and holds intact.
- Audio-reactive extraction unavailable: hold the wordmark glow at a static opacity 0.22, blur 140px. Document the skip in the render log.

Do NOT commit any of this per the user's instruction.
