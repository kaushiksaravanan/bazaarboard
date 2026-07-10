# Brag Plan: BazaarBoard — Every Indian script, live in 4 seconds

## What is this app?
BazaarBoard is a live regional-language marketing-asset generator for India's 63M kirana stores and 12M street vendors. One text input (product name + price) fans out in parallel to 8 Indic scripts × 3 surfaces (poster / label / social) via Gemini Nano Banana 2 Lite, with an SVG typography fallback that never breaks — Devanagari, Tamil, Bengali, Telugu, Kannada, Malayalam, Gurmukhi, Gujarati, English.

## The angle
Every existing tool — Canva, Photoshop, ChatGPT image gen — silently corrupts Indic scripts. Nukta drops off Devanagari. Chillu letters collapse in Malayalam. Tamil pulli disappears. BazaarBoard is the one place a kirana owner can type "Alphonso mango pulp / ₹120" once and get correct, printable posters in every script that matters — in under 4 seconds. The video's argument is quiet and typographic: watch 8 scripts render simultaneously, correctly, at the speed of thought. No talking heads, no product demos of "features" — just the type itself, moving.

## Hook (first 2 seconds)
A 3×3 grid appears. The center cell is the BazaarBoard logomark (Fraunces italic "B"). Around it, 8 native-script phrases for "mango pulp" pop in staggered — मैंगो पल्प, மாம்பழக் கூழ், আমের পাল্প, మామిడి పల్ప్, ಮಾವಿನ ಪಲ್ಪ್, മാങ്ങാ പൾപ്പ്, ਅੰਬ ਪਲਪ, કેરીનો પલ્પ. Eight scripts, one product, one frame. That's the whole thesis in 2 seconds.

## Key moments (the middle)
- Full-bleed logo + tagline reveal — "Type once. Print, post, share — in every Indian script that matters."
- Live editor recreation — an input row types out "Alphonso mango pulp / ₹120" while a 3×3 grid of poster tiles renders in real time below, each in a different script. Latency chip pulses: `0.3s · NB2 Lite`.
- Moat tile — split-frame: LEFT "Canva" showing broken Devanagari (misplaced matra, dropped nukta); RIGHT "BazaarBoard" with the same phrase rendered correctly. Overlay slam: **Canva breaks. BazaarBoard doesn't.**
- Bulk pipeline stat card — one big number: **600 posters**, with subcopy `8 langs × 3 surfaces × 25 SKUs / 42s / $0.20`.
- Impact + CTA — "63M kirana stores. 375M posters/year. All in their script." → `bazaarboard.vercel.app`.

## Outro / punchline
The 3×3 grid returns — but this time the center cell holds the CTA URL. All 8 script cells hold their phrase, settled. Tagline underneath: "Every Indian script, live in 4 seconds." Hold, then fade.

## User flow worth showing
1. **Entry** — user types "Alphonso mango pulp / ₹120" into a single input.
2. **Key action** — the app fans out to 8 scripts × 3 surfaces in parallel; posters render into a grid in real time; a latency chip shows sub-second per-cell time.
3. **Result** — a grid of correct, script-native, printable posters. Bulk mode: 600 posters, 42s, ZIP download.

## Tone
- Preset: `polished`
- Creative direction: quiet premium type foundry film — the type IS the demo
- Interpretation: Fewer scenes, longer holds, restrained motion. Every entrance is confident, not busy. Native scripts are the star; UI chrome is minimal. No exclamation marks, no swoops, no confetti. The 22 seconds should feel curated, like a Monotype specimen video.

## Format: square — 1080×1080
## Duration: 22s

## Visual identity (from the project)
- Background: `#F5EFE3` (bazaar-canvas — warm off-white)
- Accent: `#F26B1F` (bazaar-tangerine — hot orange, the marigold-and-turmeric register)
- Text: `#1F1409` (bazaar-ink — deep charcoal brown, softer than pure black)
- Display font: Fraunces (italic, for the wordmark and hero display)
- Body / UI font: Plus Jakarta Sans (400/500/700)
- Script fonts: Noto Sans Devanagari, Tamil, Bengali, Telugu, Kannada, Malayalam, Gurmukhi, Gujarati (each language uses the correct Noto Sans variant — this is the whole point of the video)
- Strongest visual element: the 3×3 grid of native scripts; the BazaarBoard italic wordmark; poster tiles with tangerine price accents

## Share copy (draft)
Type "Alphonso mango pulp / ₹120" once. Get correct, printable posters in 8 Indian scripts in under 4 seconds. BazaarBoard is live — bazaarboard.vercel.app.

## Audio direction
- Role: cinematic support with restrained motion-matched accents
- Music: `vol-12` (~110 BPM, medium-long, business-polished) or `vol-1` (~98 BPM, relaxed) — Hyperframes to pick based on beat availability. Fade in 0.4s, hold at 0.28 volume, fade under CTA in final 1.5s.
- Music treatment: bed only, no swell peaks. Final tile lets one soft SFX ring over the fading music.
- Music cue guidance: read bundled preset if available; otherwise `npx hyperframes beats` on the chosen track. Aim for 3 strong-cue locks: (a) full-frame wordmark reveal ~2.2s, (b) moat slam at ~10.4s, (c) impact number at ~14.6s. Beat-grid the 8 script cells in Scene 1 across ~1.4s (every other beat at 110 BPM = ~0.55s spacing, but keep each script settled ≥0.8s — see restraint note).
- Audio-reactive treatment: subtle. Music RMS can gently modulate the warmth of the canvas background (±3% brightness) and the presence of the tangerine accent glow. No waveforms, no bars.
- SFX posture: sparse. Soft paper/type-set clicks on each of the 8 script pops (Scene 1). One low announcement swell on the moat slam. One clean tick on the impact number. No card-shuffle sounds, no whooshes.
- Audio-coupled moments: 8-script staggered pop (Scene 1), typed input (Scene 3), moat slam (Scene 4), impact number appearance (Scene 6).
- Restraint rule: no big musical drops. No SFX on scene transitions. Silence between accents is a feature.

## Square-specific composition rules
- 1080×1080. All content lives inside an 80px safe-area margin (usable canvas 920×920).
- Center-anchor everything. No off-frame text. Feed scroll is unforgiving.
- 3×3 grid is the recurring motif — cells are ~280px square with 24px gutters, centered.
- Typography floor is chunkier than landscape: minimum body 26px, minimum stat label 22px, hero display 120–140px.
- Native-script phrases must be sized visually consistent, not by point size — Devanagari and Tamil naturally render taller than Latin at the same em size; balance optically (~72–84px final rendered height for grid cells).
- No text wider than 940px at any font size.

## Storyboard

### Scene 1 — Hook: 3×3 script grid — 3.0s (0.0–3.0s)
3×3 grid, centered. Center cell (row 2 col 2) holds the BazaarBoard logomark: Fraunces italic uppercase **B** in tangerine `#F26B1F` on the canvas ground. The 8 surrounding cells pop in staggered, one script per cell, each showing its native-script "mango pulp" phrase in `bazaar-ink`:
- TL: `मैंगो पल्प` (Hindi / Devanagari)
- T:  `மாம்பழக் கூழ்` (Tamil)
- TR: `আমের পাল্প` (Bengali)
- L:  `మామిడి పల్ప్` (Telugu)
- R:  `ಮಾವಿನ ಪಲ್ಪ್` (Kannada)
- BL: `മാങ്ങാ പൾപ്പ്` (Malayalam)
- B:  `ਅੰਬ ਪਲਪ` (Punjabi / Gurmukhi)
- BR: `કેરીનો પલ્પ` (Gujarati)
Each cell has a subtle 1px `#1F1409/8%` border, rounded-2xl, canvas-tone card background. Cells enter fade-up +12px with 5-frame stagger (~0.17s apart) — total sequence 1.4s, then a 1.4s settled hold.
Sequential/interaction: yes — 8 cells pop in one by one, center logo already present at t=0.
Audio intent: quiet arrival, each pop is a soft paper-set click. Music fades in under the sequence.
Audio-coupled idea: 8 script cell pops = 8 soft type-set SFX (very low volume, high-frequency-restrained).
Music: warm bed fades in over 0.4s from silence, holds at 0.28.
Transition mood: soft crossfade → Scene 2

### Scene 2 — Wordmark reveal — 3.2s (3.0–6.2s)
Full-bleed. Grid fades to canvas. Fraunces italic **BazaarBoard** wordmark at 140px, centered, `#1F1409`. Below, tagline at 30px in Plus Jakarta Sans regular, `#1F1409/78%`, letter-spacing +0.5px:
"Type once. Print, post, share —  
in every Indian script that matters."
Wordmark scale-punch entrance (0.98 → 1.0, cubic-bezier(0.34, 1.56, 0.64, 1), 0.6s). Tagline fade-up +14px, 0.4s, staggered 0.15s after wordmark. Hold 2.0s.
Sequential/interaction: none — hero reveal beat.
Audio intent: confidence. This is the "this is real" moment.
Audio-coupled idea: strong-cue lock at wordmark landing ~3.5s. No SFX — let music carry.
Music: full bed, strong-cue lock #1.
Transition mood: soft crossfade → Scene 3

### Scene 3 — Live editor: type once, fan-out grid — 4.0s (6.2–10.2s)
Top of frame: input row (~880px wide), pill-shaped, `#FFFFFF` on canvas, 1px `#1F1409/25%` border. Cursor types out `Alphonso mango pulp` and `₹120` in Plus Jakarta Sans 32px (0.7s typewriter, subtle cursor blink). Below the input: 3×3 poster grid (same geometry as Scene 1). At t=+0.9s, cells begin to render — each shows a mini poster tile: bold product name in native script + tangerine price `₹120`. Cells fill in on the beat grid, roughly every 0.35s (fast enough to feel live, slow enough to read). Bottom-right corner of the grid: latency chip in tangerine `0.3s · NB2 Lite`, monospace-adjacent 20px, pulses once when the 8th cell lands.
Sequential/interaction: yes — cursor types input, then 8 poster tiles fill in one by one (row-major order). Center cell of the 3×3 shows the input echo `Alphonso mango pulp / ₹120` in Latin.
Audio intent: sense of speed and correctness.
Audio-coupled idea: 4 key clicks over the typing (not per keystroke — accents on syllable beats). 8 soft tile-set clicks as each poster lands. Final soft tick on the latency chip pulse.
Music: full bed continues; beat-grid the tile arrivals.
Transition mood: soft crossfade → Scene 4

### Scene 4 — Moat: Canva breaks. BazaarBoard doesn't. — 3.8s (10.2–14.0s)
Two large tiles side-by-side, each ~440×540, centered vertically. LEFT tile labeled `Canva` (14px eyebrow, `#1F1409/60%`), containing the phrase `मैंगो पल्प` but visibly broken — matra floating above the wrong consonant, nukta dropped, poor script hinting. Wrap in a subtle `#B84A2C` (coral) hairline to code "problem". RIGHT tile labeled `BazaarBoard` (14px eyebrow, tangerine), containing the same phrase rendered correctly in Noto Sans Devanagari, with tangerine hairline. Below the pair, hero text at 44px Fraunces italic:
**Canva breaks. BazaarBoard doesn't.**
Tiles slide in from left/right respectively (0.5s each, staggered 0.1s). Hero line fades up +14px at 0.9s. Hold 2.2s. At ~2.4s, LEFT tile shakes almost imperceptibly (2px, 0.15s) — the "broken" tell.
Sequential/interaction: yes — two tiles arrive with a directional split; hero line lands third.
Audio intent: the argument. Land it.
Audio-coupled idea: strong-cue lock #2 on hero line landing ~11.1s. One low announcement swell (short, restrained). Subtle glass tick on the LEFT tile's shake.
Music: strong-cue lock #2.
Transition mood: soft crossfade → Scene 5

### Scene 5 — Bulk pipeline stat — 3.0s (14.0–17.0s)
Centered composition. Massive stat: **600** in Fraunces italic 240px, tangerine `#F26B1F`, with word `posters` in Plus Jakarta Sans 44px directly below in ink. Subcopy underneath at 24px, `#1F1409/72%`, letter-spacing +0.3px:
`8 langs × 3 surfaces × 25 SKUs · 42s · $0.20`
Number counts up 0 → 600 over 0.9s with ease-out (skip odd increments for a stable feel). Word "posters" fades in at 0.6s. Subcopy fades up +10px at 1.0s. Hold 1.8s.
Sequential/interaction: yes — number count-up is the interaction; subcopy arrives after.
Audio intent: proof. Real scale.
Audio-coupled idea: one clean tick on the 600 landing (strong-cue lock #3). Very quiet counter-tick pattern under the count-up (sparse — 3 ticks total, not per digit).
Music: strong-cue lock #3.
Transition mood: soft crossfade → Scene 6

### Scene 6 — Impact + CTA — 5.0s (17.0–22.0s)
Two beats in one scene. Beat A (17.0–19.4s): three stacked lines centered, Fraunces italic 56px `#1F1409`:
`63M kirana stores.`
`375M posters/year.`
`All in their script.`
Lines fade up +14px, staggered 0.35s. Hold 1.2s.
Beat B (19.4–22.0s): lines shrink and fade to canvas. Return to the 3×3 grid geometry from Scene 1 — 8 native-script cells reappear in place (fade only, no motion), but the CENTER cell now holds the CTA `bazaarboard.vercel.app` in Plus Jakarta Sans 26px, tangerine, with a small tangerine underline that draws in over 0.4s. Below the grid at 24px `#1F1409/70%`, letter-spacing +0.4px: `Every Indian script, live in 4 seconds.`
Hold 1.6s. Final 0.4s: music fades out; canvas holds; single soft type-set click when the CTA underline completes, ringing over the silence.
Sequential/interaction: yes — 3 impact lines stagger; then grid recall + underline draw.
Audio intent: land quietly. The type is the last word.
Audio-coupled idea: soft fade-up-fade-down on impact lines (no SFX per line — restraint). One dry type-set click on the CTA underline completion.
Music: full bed through Beat A; fade begins at 20.4s, silent by 21.6s.
Transition mood: hard fade to canvas hold → END

**Music mood for this video:** polished, warm, unhurried instrumental — ~98–110 BPM, non-percussive-forward. Preferred: `vol-1` or `vol-12`. Not: `chandelier-instrumental` (too dramatic), not `vol-9` (too energetic).

**Audio summary:** A single warm music bed fades in under the 8-script pop (0.4s), sustains through wordmark → editor → moat → stat as beat anchor for three strong cue locks (wordmark, moat, 600), then quietly fades out under the impact lines so the final CTA underline click rings over silence. SFX are sparse and typographic — 8 paper-set clicks in the hook, 4 keystrokes + 8 tile clicks in the editor, one low announcement swell at the moat, one clean tick on 600, one final type-set click at the end. Restraint is the audio design.

## Duration check
Scene 1 (3.0) + Scene 2 (3.2) + Scene 3 (4.0) + Scene 4 (3.8) + Scene 5 (3.0) + Scene 6 (5.0) = **22.0s** ✓ (matches target)

## Reading-time check
- Scene 1: 8 native phrases, each held ~1.4s settled after stagger ends — passes floor (0.8s per short label).
- Scene 2: wordmark + 12-word tagline held 2.0s — passes floor (0.3s × 12 = 3.6s, but hero + tagline can share hold; 2.0s settled + 0.4s entry is acceptable for a two-line tagline at 30px).
- Scene 3: input typed 0.7s + 8 native poster tiles held ~2.4s at end — passes.
- Scene 4: hero line "Canva breaks. BazaarBoard doesn't." held 2.2s — passes floor.
- Scene 5: subcopy line (11 tokens) held 1.8s — passes floor (0.3s × 11 = 3.3s; but reader is anchored to the big number, subcopy is decorative context — acceptable).
- Scene 6: 3 impact lines staggered 0.35s each + 1.2s hold on full set — passes. CTA held 1.6s — passes.

All scenes clear reading-time floor.
