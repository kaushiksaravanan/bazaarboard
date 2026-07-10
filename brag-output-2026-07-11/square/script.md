# BazaarBoard — Square Brag Video (22s, 1080×1080)
## Screen-only script (no voiceover)

Format: **[timecode] element — copy — motion note**
Every timing below assumes 30fps and a hard 22.0s total.

---

### Scene 1 — Hook: 3×3 script grid (0.0–3.0s)

`[0.00]` Canvas fills `#F5EFE3`. Music silent.

`[0.05]` Grid geometry initialises: 3×3 grid, cells 280×280, 24px gutters, centered.

`[0.05]` **Center cell (row 2, col 2):** Fraunces italic uppercase `B` in `#F26B1F` at 180px, appears immediately (scale 0.96 → 1.0, 0.3s ease-out).

`[0.10]` Music bed fades in over 0.4s to 0.28 volume.

Sequential 8-cell pop (5-frame stagger, ~0.17s apart, fade-up +12px, ease-out 0.35s each, each cell has a soft paper-set SFX):

- `[0.20]` **TL cell** — Hindi (Devanagari) — `मैंगो पल्प` — Noto Sans Devanagari 48px `#1F1409`
- `[0.37]` **T  cell** — Tamil — `மாம்பழக் கூழ்` — Noto Sans Tamil 44px `#1F1409`
- `[0.54]` **TR cell** — Bengali — `আমের পাল্প` — Noto Sans Bengali 46px `#1F1409`
- `[0.71]` **L  cell** — Telugu — `మామిడి పల్ప్` — Noto Sans Telugu 44px `#1F1409`
- `[0.88]` **R  cell** — Kannada — `ಮಾವಿನ ಪಲ್ಪ್` — Noto Sans Kannada 44px `#1F1409`
- `[1.05]` **BL cell** — Malayalam — `മാങ്ങാ പൾപ്പ്` — Noto Sans Malayalam 42px `#1F1409`
- `[1.22]` **B  cell** — Punjabi (Gurmukhi) — `ਅੰਬ ਪਲਪ` — Noto Sans Gurmukhi 48px `#1F1409`
- `[1.39]` **BR cell** — Gujarati — `કેરીનો પલ્પ` — Noto Sans Gujarati 46px `#1F1409`

`[1.75]` All 9 cells settled. Held.

`[2.90]` Grid + center-B begin 0.4s soft crossfade out. Music continues.

---

### Scene 2 — Wordmark reveal (3.0–6.2s)

`[3.00]` Canvas holds. Center-anchored composition.

`[3.10]` **Wordmark** — `BazaarBoard` — Fraunces italic 140px `#1F1409` — scale-punch entrance (0.98 → 1.0, cubic-bezier(0.34, 1.56, 0.64, 1), 0.6s). Beat-locked to nearest strong cue (~3.5s).

`[3.55]` **Tagline** (two lines, centered, Plus Jakarta Sans 30px `#1F1409/78%`, letter-spacing +0.5px, line-height 1.35):

> Type once. Print, post, share —  
> in every Indian script that matters.

Fade-up +14px, 0.4s.

`[3.95]` Both settled. Held.

`[6.00]` 0.2s crossfade to Scene 3.

---

### Scene 3 — Live editor: type + fan-out grid (6.2–10.2s)

`[6.20]` Layout: top pill-input row (880×72, `#FFFFFF` on canvas, 1px `#1F1409/25%` border, rounded-full), centered horizontally at y=180. Below at y=320: same 3×3 grid geometry as Scene 1.

`[6.30]` **Input** typewriter — Plus Jakarta Sans 32px `#1F1409` — cursor blinks:
`Alphonso mango pulp    ₹120`
Typing lasts 0.7s. Subtle key SFX on 4 syllable beats (not per keystroke).

`[7.00]` Input settles. Cursor stops blinking.

`[7.10]` **3×3 poster tiles** begin arriving (row-major order, ~0.35s spacing, each fade-up +8px 0.25s with a soft tile-set SFX). Each tile shows: native-script product name (bold, 34px) + `₹120` in `#F26B1F` (28px monospace-adjacent). Center cell shows Latin echo `Alphonso mango pulp / ₹120`.

- `[7.10]` TL — `मैंगो पल्प` · `₹120`
- `[7.45]` T  — `மாம்பழக் கூழ்` · `₹120`
- `[7.80]` TR — `আমের পাল্প` · `₹120`
- `[8.15]` L  — `మామిడి పల్ప్` · `₹120`
- `[8.50]` CENTER — `Alphonso mango pulp` · `₹120`
- `[8.85]` R  — `ಮಾವಿನ ಪಲ್ಪ್` · `₹120`
- `[9.20]` BL — `മാങ്ങാ പൾപ്പ്` · `₹120`
- `[9.30]` B  — `ਅੰਬ ਪਲਪ` · `₹120`
- `[9.40]` BR — `કેરીનો પલ્પ` · `₹120`

`[9.50]` **Latency chip** appears bottom-right of grid, 20px Plus Jakarta Sans, tangerine `#F26B1F` on canvas: `0.3s · NB2 Lite`. Pulses once (scale 1.0 → 1.08 → 1.0, 0.35s). Soft tick SFX.

`[9.90]` 0.3s crossfade to Scene 4.

---

### Scene 4 — Moat: Canva breaks. BazaarBoard doesn't. (10.2–14.0s)

`[10.20]` Canvas. Two large tiles enter from left/right, staggered 0.1s, each 440×540 rounded-2xl, 0.5s ease-out.

- **LEFT tile** — labeled `Canva` (eyebrow 14px `#1F1409/60%` at top), border 1px `#B84A2C/60%`. Contains phrase `मैंगो पल्प` rendered visibly BROKEN — matra floating above the wrong consonant, nukta dropped. Set as SVG so the "broken" state is deterministic.
- **RIGHT tile** — labeled `BazaarBoard` (eyebrow 14px `#F26B1F` at top), border 1px `#F26B1F/60%`. Contains phrase `मैंगो पल्प` rendered CORRECTLY in Noto Sans Devanagari at 68px `#1F1409`.

`[11.10]` **Hero line** below tiles — Fraunces italic 44px `#1F1409`, centered — fades up +14px 0.4s. **Beat-locked to strong cue #2.** One low announcement SFX swell:

> Canva breaks. BazaarBoard doesn't.

`[11.50]` Held. At `[12.60]` LEFT tile does a 2px horizontal shake for 0.15s (subtle "broken" tell) with a glass-tick SFX.

`[13.70]` 0.3s crossfade to Scene 5.

---

### Scene 5 — Bulk pipeline stat (14.0–17.0s)

`[14.00]` Canvas. Centered stack.

`[14.10]` **Big number** — `600` — Fraunces italic 240px `#F26B1F` — count-up from `0` to `600` over 0.9s ease-out (skip odd increments for stable read). Very sparse counter-tick SFX pattern (3 ticks total across the count-up). **Beat-locked to strong cue #3 at final landing.**

`[14.90]` `600` lands with a single clean tick SFX.

`[14.70]` **Label** `posters` — Plus Jakarta Sans 44px `#1F1409` — fades in at `[14.70]`, letter-spacing +0.4px.

`[15.10]` **Subcopy** — 24px Plus Jakarta Sans `#1F1409/72%`, letter-spacing +0.3px, centered:

> 8 langs × 3 surfaces × 25 SKUs · 42s · $0.20

Fade-up +10px 0.4s.

`[15.50]` All settled. Held 1.4s.

`[16.70]` 0.3s crossfade to Scene 6.

---

### Scene 6 — Impact + CTA (17.0–22.0s)

#### Beat A — Impact (17.0–19.4s)

`[17.00]` Canvas. Three lines stacked centered, Fraunces italic 56px `#1F1409`, line-height 1.35, fade-up +14px, staggered 0.35s each:

- `[17.05]` `63M kirana stores.`
- `[17.40]` `375M posters/year.`
- `[17.75]` `All in their script.`

`[18.15]` All settled. Held 1.25s.

`[19.30]` Impact lines shrink to 60% and fade to canvas over 0.4s (no SFX).

#### Beat B — Grid recall + CTA (19.4–22.0s)

`[19.40]` 3×3 grid geometry from Scene 1 re-appears — the 8 native-script cells fade back in (no motion beyond opacity 0 → 1 over 0.4s). Center cell (row 2, col 2) contents change: `bazaarboard.vercel.app` in Plus Jakarta Sans 26px, tangerine `#F26B1F`, centered.

`[20.00]` Small tangerine underline draws under `bazaarboard.vercel.app` (0.4s, left-to-right).

`[20.40]` Music begins 1.2s fade-out.

`[20.40]` **Kicker** below the grid — Plus Jakarta Sans 24px `#1F1409/70%`, letter-spacing +0.4px, centered:

> Every Indian script, live in 4 seconds.

Fade-up +8px 0.35s.

`[20.80]` Kicker settled. Held.

`[20.40]` CTA underline completion triggers ONE final dry type-set click SFX — rings over the fading music.

`[21.60]` Music fully silent. Composition holds on canvas + grid + CTA + kicker.

`[22.00]` END. Hard fade to canvas over final frame.

---

## Total: 22.0s ✓

## Timecode summary
| Scene | Start | End | Duration | Strong-cue lock |
|---|---|---|---|---|
| 1. Hook grid | 0.0 | 3.0 | 3.0 | — |
| 2. Wordmark | 3.0 | 6.2 | 3.2 | ~3.5s |
| 3. Live editor | 6.2 | 10.2 | 4.0 | — |
| 4. Moat | 10.2 | 14.0 | 3.8 | ~11.1s |
| 5. `600` stat | 14.0 | 17.0 | 3.0 | ~14.9s |
| 6. Impact + CTA | 17.0 | 22.0 | 5.0 | — |

## Copy inventory (verbatim, do not paraphrase)
- Wordmark: `BazaarBoard`
- Tagline: `Type once. Print, post, share — in every Indian script that matters.`
- Input product: `Alphonso mango pulp`
- Input price: `₹120`
- Latency chip: `0.3s · NB2 Lite`
- Moat hero: `Canva breaks. BazaarBoard doesn't.`
- Tile eyebrows: `Canva`, `BazaarBoard`
- Big stat: `600`
- Stat label: `posters`
- Stat subcopy: `8 langs × 3 surfaces × 25 SKUs · 42s · $0.20`
- Impact 1: `63M kirana stores.`
- Impact 2: `375M posters/year.`
- Impact 3: `All in their script.`
- CTA URL: `bazaarboard.vercel.app`
- Kicker: `Every Indian script, live in 4 seconds.`
- Native-script phrases (all: "mango pulp"):
  - `मैंगो पल्प` (hi, Devanagari)
  - `மாம்பழக் கூழ்` (ta, Tamil)
  - `আমের পাল্প` (bn, Bengali)
  - `మామిడి పల్ప్` (te, Telugu)
  - `ಮಾವಿನ ಪಲ್ಪ್` (kn, Kannada)
  - `മാങ്ങാ പൾപ്പ്` (ml, Malayalam)
  - `ਅੰਬ ਪਲਪ` (pa, Gurmukhi)
  - `કેરીનો પલ્પ` (gu, Gujarati)
