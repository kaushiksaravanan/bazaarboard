# Hyperframes Composition Brief: BazaarBoard (Square 1080×1080)

## Objective
Create a 22-second square (1:1, 1080×1080) polished launch video for BazaarBoard — a live regional-language marketing-asset generator for India's kirana stores and street vendors. Optimized for Instagram feed, Mastodon, in-thread embeds.

## Output
- Composition directory: `brag-output-2026-07-11/square/hyperframes/`
- Rendered video: `brag-output-2026-07-11/square/brag-square.mp4`
- Format: square — 1080×1080
- Duration: 22 seconds

## Source Material
- Project root: `C:\Users\I587436\projects\bazaarboard`
- Primary files read: `src/app/page.tsx`, `src/lib/languages.ts`
- Product name: **BazaarBoard**
- Tagline / strongest claim: "Type once. Print, post, share — in every Indian script that matters."
- Live URL for context (do not embed): https://bazaarboard.vercel.app
- Tech stack context (do not display): Next.js 16 + React 19 + TypeScript strict + Tailwind. Uses Gemini Nano Banana 2 Lite. SVG typography fallback. Prize track: Google DeepMind Bangalore Hackathon 2026, Idea 3.
- Key UI or visual moments to recreate:
  - The 3×3 script grid (recurring motif — hook and outro)
  - The live editor: single input row + real-time poster grid
  - The Canva-vs-BazaarBoard moat comparison
  - The bulk pipeline throughput stat (600 posters)
- Copy that must appear verbatim (exact strings — preserve digits, currency, and native scripts EXACTLY):
  - Product name: `BazaarBoard`
  - Tagline: `Type once. Print, post, share — in every Indian script that matters.`
  - Input example: `Alphonso mango pulp` and `₹120`
  - Native-script phrases (all mean "mango pulp"):
    - Hindi (Devanagari): `मैंगो पल्प`
    - Tamil: `மாம்பழக் கூழ்`
    - Bengali: `আমের পাল্প`
    - Telugu: `మామిడి పల్ప్`
    - Kannada: `ಮಾವಿನ ಪಲ್ಪ್`
    - Malayalam: `മാങ്ങാ പൾപ്പ്`
    - Punjabi (Gurmukhi): `ਅੰਬ ਪਲਪ`
    - Gujarati: `કેરીનો પલ્પ`
  - Latency chip: `0.3s · NB2 Lite`
  - Moat slam: `Canva breaks. BazaarBoard doesn't.`
  - Stat: `600` + `posters` + subcopy `8 langs × 3 surfaces × 25 SKUs · 42s · $0.20`
  - Impact block: `63M kirana stores.` / `375M posters/year.` / `All in their script.`
  - CTA URL: `bazaarboard.vercel.app`
  - Kicker: `Every Indian script, live in 4 seconds.`

## Creative Direction
- Tone preset: **polished**
- Creative direction: quiet premium type foundry film — the type IS the demo
- Interpretation: Fewer scenes, longer holds, restrained motion. Every entrance is confident, not busy. Native scripts are the star; UI chrome is minimal. No exclamation marks, no swoops, no confetti. Feels like a curated Monotype specimen video.
- Angle: Existing tools (Canva, Photoshop, ChatGPT image gen) silently corrupt Indic scripts. BazaarBoard is the one place a kirana owner can type "Alphonso mango pulp / ₹120" once and get correct, printable posters in every script that matters — in under 4 seconds. The video's argument is quiet and typographic.
- Hook (0–2s): 3×3 grid with center = BazaarBoard logomark, 8 surrounding cells pop in with 8 native-script "mango pulp" translations.
- Outro / punchline: Grid returns with CTA URL in center; kicker `Every Indian script, live in 4 seconds.`; music fades under a single final type-set click.
- Avoid:
  - Generic SaaS language ("empower", "seamless", "unlock")
  - Abstract filler visuals (particles, waveform bars, orb explosions)
  - Any redesign of the BazaarBoard brand — use its exact colors and fonts
  - Emojis, exclamation marks, all-caps display copy
  - Any Latin transliteration of the Indic phrases — show the real native scripts only
  - Rendering the actual live URL in a browser chrome frame (recreate the UI natively)

## Visual Identity
- Background: `#F5EFE3` (bazaar-canvas — warm off-white)
- Text (primary ink): `#1F1409` (bazaar-ink — deep charcoal brown)
- Accent (primary): `#F26B1F` (bazaar-tangerine — hot orange)
- Accent (leaf, secondary, sparingly): `#3F7A3A`
- Accent (coral, for "broken" tell only): `#B84A2C`
- Display font: **Fraunces** (italic, weight 500–700) — for wordmark, hero display, big stat number
- Body / UI font: **Plus Jakarta Sans** (400 / 500 / 700) — for tagline, labels, subcopy, CTA
- Native-script fonts (use the CORRECT Noto Sans variant per language — this is the whole point):
  - Noto Sans Devanagari (Hindi)
  - Noto Sans Tamil
  - Noto Sans Bengali
  - Noto Sans Telugu
  - Noto Sans Kannada
  - Noto Sans Malayalam
  - Noto Sans Gurmukhi (Punjabi)
  - Noto Sans Gujarati
- Font loading: use Google Fonts `@import` at the top of the composition CSS. Do NOT use `-apple-system` or `BlinkMacSystemFont` (Hyperframes lint rejects them). Bundle web fonts locally under `assets/fonts/` if network fetch is fragile during render.
- Visual references from the project: the header wordmark in italic Fraunces, the poster grid geometry, the tangerine primary CTAs, the `bazaar-canvas` warm background across the whole app.

## Square-specific layout rules
- Canvas: 1080×1080. Safe-area inset: 80px on all sides (usable = 920×920).
- Center-anchor everything. No off-frame text.
- 3×3 grid geometry (recurring motif): cells ~280×280 with 24px gutters, total grid ~888×888, centered on canvas.
- Typography floor (chunkier than landscape):
  - Hero display (Fraunces italic): 120–144px
  - Section hero line: 44–56px
  - Big stat number: 220–240px
  - Body / tagline: 26–32px (never below 24px)
  - Eyebrow labels: 14–16px, letter-spacing +0.4px
  - Native-script phrases in grid cells: 44–56px (visual-balance not em-size — Devanagari/Tamil naturally render taller; balance optically)
- Max text width at any size: 940px.
- All text: `overflow: hidden` on containers OR explicit max-width; single or double-line clamps as appropriate.

## Storyboard
Use the storyboard in `brag-plan.md` as the creative contract.

Scene summary:
1. **Hook: 3×3 script grid** — 3.0s — center = BazaarBoard "B" logomark; 8 surrounding cells pop in with native-script "mango pulp" phrases, 5-frame stagger, then held.
2. **Wordmark reveal** — 3.2s — full-bleed Fraunces italic `BazaarBoard` at 140px + two-line tagline.
3. **Live editor: type + fan-out grid** — 4.0s — input row types `Alphonso mango pulp / ₹120`; 3×3 poster grid fills in with real-time native-script tiles; `0.3s · NB2 Lite` latency chip pulses on the 8th arrival.
4. **Moat: Canva breaks. BazaarBoard doesn't.** — 3.8s — split tiles (broken Devanagari vs. correct Devanagari); hero line lands as strong cue.
5. **Bulk pipeline stat** — 3.0s — `600` counts up (Fraunces italic 240px tangerine); `posters` beneath; subcopy `8 langs × 3 surfaces × 25 SKUs · 42s · $0.20`.
6. **Impact + CTA** — 5.0s — three impact lines stagger (`63M kirana stores.` / `375M posters/year.` / `All in their script.`), then grid returns with CTA in center + kicker `Every Indian script, live in 4 seconds.`

Total: 22.0s. Do not exceed.

## Audio
- Audio role: cinematic support with restrained motion-matched accents
- Audio arc: silence → 0.4s music fade-in under 8-script pop → sustained warm bed through wordmark / editor / moat / stat (three strong-cue locks) → gentle fade-out under impact lines → final type-set click rings over silence.
- Music: `vol-1` (~98 BPM, 2:44) or `vol-12` (~110 BPM, 1:58) — Hyperframes chooses based on cue availability and how well beats align to the three planned strong-cue moments. Avoid `vol-9` (too energetic) and `chandelier-instrumental` (too dramatic).
- Music treatment: fade-in 0.4s, hold at **0.28 volume** (see learnings-anti-patterns.md: 0.30 is the polished-typography default; 0.28 lets scripts breathe further), fade-out over 1.2s starting at 20.4s. No swell peaks; no beat drops as visual anchors.
- Music cue guidance: cue source is `assets/music/<track>.mp3` — run `npx hyperframes beats .` inside the composition directory after the audio element is added, writing to `beats/<track>.json`. Target 3 strong-cue locks (highest-`strength` beats):
  - Lock #1 — wordmark landing at ~3.5s (Scene 2)
  - Lock #2 — moat hero line landing at ~11.1s (Scene 4)
  - Lock #3 — `600` big-number landing at ~14.9s (Scene 5)
  - Beat-grid the 8-cell pop in Scene 1 across ~1.4s (every-other-beat spacing at 110 BPM), and the 8 poster tile arrivals in Scene 3 (~0.35s spacing) — snap each within ±0.10s.
  - Restraint note: this is polished — do not force every tween onto a beat. If a snap hurts readability, use natural timing.
- Audio-reactive treatment: **subtle**. Wire music RMS to two visual qualities only: (a) canvas background warmth (±3% brightness on `#F5EFE3`) and (b) tangerine accent glow presence on active hero elements (opacity 0.85 → 1.0 on RMS bass energy). No waveforms, no equalizer bars, no particle systems, no strobing.
- Audio-coupled moments:
  - Scene 1 — 8 native-script cell pops → 8 soft paper/type-set clicks, restrained volume, low-hf-risk SFX
  - Scene 2 — wordmark reveal → NO SFX (let music strong-cue land it)
  - Scene 3 — typing → 4 subtle keystroke SFX on syllable beats (not per keystroke); 8 soft tile-set clicks on poster arrivals; 1 clean tick on latency chip pulse
  - Scene 4 — moat hero line → 1 low announcement swell (short, restrained); subtle glass tick on LEFT tile's 2px shake
  - Scene 5 — `600` count-up → very sparse counter-tick pattern (3 ticks total, not per digit); 1 clean tick on final `600` landing
  - Scene 6 — impact lines: no SFX (restraint); CTA underline completion: 1 final dry type-set click ringing over silence
- SFX selection guidance: prefer typographic sounds (paper-set, type-set, mechanical-key-soft, gentle ticks) over UI/whoosh sounds. Everything low-highfrequency-risk for polished tone. Reuse the same paper-set family across Scenes 1, 3, and 6 for cohesion.
- SFX analysis guidance: consult `~/.claude/skills/brag/assets/sfx/sfx-analysis.md` (and its JSON if present) during selection. Filter to low high-frequency-risk files for the repeated cell pops (Scenes 1, 3).
- Exact SFX choice: Hyperframes selects filenames, timestamps, density, and volume after the animation exists.
- Audio files: copy chosen music into `brag-output-2026-07-11/square/hyperframes/assets/music/` and chosen SFX into `.../assets/sfx/`.

## Hyperframes Instructions
Use the current `hyperframes` skill and CLI workflow. Prefer native Hyperframes conventions over anything in `/brag`.

Requirements:
- Show real UI, copy, and visual elements from BazaarBoard — the 3×3 grid motif, the live editor, the poster tile design, the tangerine primary. Recreate in HTML (do NOT screenshot the live site).
- All native-script phrases must render in the CORRECT Noto Sans variant. Verify each phrase renders with its diacritics intact (nukta on `पल्प`, pulli in Tamil, chillu in Malayalam). If a Google Fonts fetch fails at render time, fall back to a locally bundled Noto Sans family; do NOT fall back to a Latin font — that would defeat the entire premise of the video.
- Keep all text readable in the final render. Every line must clear the reading-time floor (see brag-plan.md → "Reading-time check").
- Keep the video within 22 seconds. Scene durations sum: 3.0 + 3.2 + 4.0 + 3.8 + 3.0 + 5.0 = 22.0.
- Include the planned music + SFX layer. Music at 0.28 volume, fade-in 0.4s, fade-out over 1.2s starting at 20.4s.
- Treat `/brag` audio notes as guidance, not a fixed cue sheet. Choose SFX after the visual animation exists.
- Beat sync: 3 strong-cue locks total (wordmark, moat, `600`), each within ±0.15s. Beat-grid the sequential cell pops in Scenes 1 and 3 within ±0.10s. Do NOT reveal readable native-script phrases faster than the reading floor — snap to every-other-beat if the beat spacing drops under 0.6s.
- Use SFX to support motion: paper/type-set clicks on cell pops, restrained announcement swell on moat, ticks on stat + CTA underline. Do not add whooshes to scene transitions.
- Audio-reactive extraction: follow `references/audio-reactive.md` in the current hyperframes skill. Wire (a) canvas background warmth and (b) tangerine glow to music RMS (subtle only). If extraction is unavailable, document and skip — do not block the render.
- Use local assets for audio and any required runtime/media dependencies.
- Run `npx hyperframes lint` and `npx hyperframes validate` before render. Do not skip.
- Render at 1080×1080, 30fps, MP4 H.264, high quality (CRF ~18).

## Anti-patterns (composition MUST NOT contain)
- Text rendered wider than 940px at any font size
- Default system/monospace font for non-code content
- Static frames held >4 seconds with zero motion (add subtle background warmth or accent breathing via audio-reactive)
- Hard cuts between scenes (minimum 0.3s soft crossfade)
- White text on `#F5EFE3` or `#1F1409` on `#1F1409` (contrast floor 4.5:1)
- `drawtext` ffmpeg filter as the render engine (Hyperframes HTML/GSAP only)
- Latin transliteration of the Indic phrases anywhere in the composition
- Any use of the source website via screenshot or iframe — recreate natively

## Handoff sequence for Hyperframes
1. Copy music track into `hyperframes/assets/music/` (from `~/.claude/skills/brag/assets/music/`).
2. Scaffold composition: `npx hyperframes init` (or manual `index.html` + `composition.css` + `composition.js` per current Hyperframes conventions).
3. Wire Google Fonts imports for Fraunces + Plus Jakarta Sans + all 8 Noto Sans variants.
4. Build Scene 1 first (it's the recurring motif — makes Scene 6 free).
5. Add audio element with `data-track-index=0`, `data-volume=0.28`.
6. Run `npx hyperframes beats .` to generate cue JSON.
7. Beat-lock the 3 strong cues; beat-grid Scenes 1 and 3 sequences.
8. Wire audio-reactive (canvas warmth + tangerine glow) via the current hyperframes audio-reactive workflow.
9. Add SFX after visual timings are finalized.
10. Lint + validate. Fix all issues.
11. Render to `brag-square.mp4`.

## Self-review checklist (before render)
- [ ] All 8 native-script phrases render with correct Noto Sans variant + diagnostic diacritics visible.
- [ ] Prices and currency (`₹120`) are digit-exact in every occurrence.
- [ ] 3 strong-cue locks are within ±0.15s of a `strongCue` / high-`strength` beat.
- [ ] Sequential reveals in Scenes 1 and 3 snap to `beats[]` within ±0.10s, with readable text still held to the floor.
- [ ] Music fades in over 0.4s at start, out over 1.2s ending by 21.6s.
- [ ] Audio-reactive treatment is present (subtle warmth + glow) OR extraction failure is documented.
- [ ] Total duration is exactly 22.0s.
- [ ] Lint + validate pass.
- [ ] Final render matches 1080×1080 at 30fps.
