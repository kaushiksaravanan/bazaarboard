# BazaarBoard — Screen-only script (vertical, 22s)

No voiceover. All on-screen text only. Times are absolute seconds from t=0.

## Scene 1 · Hook (0.0 – 2.0s)

**On-screen (hero, center):**
```
मैंगो पल्प
```
Font: Noto Sans Devanagari 700 · 320px · #F26B1F on #F5EFE3

- 0.15s → slam in (scale 0.94 → 1.0, opacity 0 → 1, 0.5s ease)
- 1.5s → hero held; tangerine glow behind (audio-reactive)

**On-screen (bottom stack, y≈1500):**
```
one input.
every Indian script.
```
Font: Fraunces italic · 44px · #1F1409 @ 85%

- 0.9s → fade-up 20px, 0.4s
- Hold to 2.0s

**Cut:** crossfade 0.4s → scene 2

---

## Scene 2 · The Vertical 8-Script Column (2.0 – 6.0s)

**On-screen (top-anchored column, vertical stack, 24px gap, each ~150px):**

Item 1 (arrives 2.15s):
```
मैंगो पल्प
```
Noto Sans Devanagari 600 · 150px · #1F1409

Item 2 (arrives 2.50s):
```
மாம்பழக் கூழ்
```
Noto Sans Tamil 600 · 150px · #1F1409

Item 3 (arrives 2.85s):
```
আমের পাল্প
```
Noto Sans Bengali 600 · 150px · #1F1409

Item 4 (arrives 3.20s):
```
మామిడి పల్ప్
```
Noto Sans Telugu 600 · 150px · #1F1409

Item 5 (arrives 3.55s):
```
ಮಾವಿನ ಪಲ್ಪ್
```
Noto Sans Kannada 600 · 150px · #1F1409

Item 6 (arrives 3.90s):
```
മാങ്ങാ പൾപ്പ്
```
Noto Sans Malayalam 600 · 150px · #1F1409

Item 7 (arrives 4.25s):
```
ਅੰਬ ਪਲਪ
```
Noto Sans Gurmukhi 600 · 150px · #1F1409

Item 8 (arrives 4.60s):
```
કેરીનો પલ્પ
```
Noto Sans Gujarati 600 · 150px · #1F1409

- Each: slide-up 40px + fade in, 0.35s per arrival, beat-locked to `vol-12`
- 4.60s – 6.00s → full stack held for 1.4s (reading floor)

**Cut:** crossfade 0.4s → scene 3

---

## Scene 3 · Logo Reveal (6.0 – 8.0s)

**On-screen (center, y≈900):**
```
BazaarBoard
```
Font: Fraunces italic · 168px · #1F1409

- 6.05s → slam in (scale 0.96 → 1.0, 0.4s), beat-locked to strong cue near 6.0s

**On-screen (below logo, y≈1080):**
```
Type once. Print, post, share —
in every Indian script that matters.
```
Font: Plus Jakarta Sans 500 · 40px · #1F1409 @ 80%, two lines, center-aligned

- 6.20s → fade up 20px, 0.4s
- Hold to 8.0s

**Cut:** crossfade 0.4s → scene 4

---

## Scene 4 · Live Editor Moment (8.0 – 12.0s)

**On-screen (top, y≈380):** search-bar input mock
- Empty at 8.0s, cursor blinking
- Types character-by-character 8.10s – 9.50s:
```
Alphonso mango pulp / ₹120
```
Font inside input: Plus Jakarta Sans 500 · 40px · #1F1409 · white bg · rounded 12px · ink/30 border · width ≈ 900px

**On-screen (top-right of input, y≈380):**
```
0.3s · NB2 Lite
```
Latency chip · Plus Jakarta 500 · 24px · rounded-full pill · ink/06 bg
- Appears 9.90s with a 1-frame pulse

**On-screen (below input, 8-tile vertical stack, y≈600–1720):** 8 poster tiles at 3/4 aspect
- 9.90s → tiles fan in with 40ms stagger (~9.90s – 10.22s), then hold 1.78s
- Each tile: tangerine field · rendered Indic caption in matching Noto font · native-script label at bottom
- Tile 1: `मैंगो पल्प · ₹120`
- Tile 2: `மாம்பழக் கூழ் · ₹120`
- Tile 3: `আমের পাল্প · ₹120`
- Tile 4: `మామిడి పల్ప్ · ₹120`
- Tile 5: `ಮಾವಿನ ಪಲ್ಪ್ · ₹120`
- Tile 6: `മാങ്ങാ പൾപ്പ് · ₹120`
- Tile 7: `ਅੰਬ ਪਲਪ · ₹120`
- Tile 8: `કેરીનો પલ્પ · ₹120`

**Cut:** crossfade 0.4s → scene 5

---

## Scene 5 · The Moat, Top vs. Bottom (12.0 – 15.5s)

**Top half (y≈300–800), muted:**
```
Canva
```
Label · Plus Jakarta 600 · 32px · ink @ 60%

```
मैंगो
```
Word · Noto Sans Devanagari 700 · 260px · #1F1409 with visibly broken kerning (matra above `म` mis-positioned, nukta drifted). Coral underline #E85D3C stroke 4px underneath.

- 12.05s → fade in 0.35s, hold

**Bottom half (y≈1000–1500):**
```
BazaarBoard
```
Label · Plus Jakarta 600 · 32px · #F26B1F with small leaf-green tick `✓`

```
मैंगो
```
Word · Noto Sans Devanagari 700 · 260px · #1F1409, correctly kerned.

- 12.60s → fade in 0.35s, hold

**Overlay card (center, y≈960):**
```
Canva breaks. BazaarBoard doesn't.
```
Font: Fraunces italic · 68px · #1F1409 · canvas card with 12px backdrop-blur · rounded 24px · padding 32×40px

- 14.00s → wipe in from left, 0.5s, beat-locked to strong cue near 14.0s
- Hold to 15.5s

**Cut:** crossfade 0.4s → scene 6

---

## Scene 6 · Bulk Stat (15.5 – 19.0s)

**On-screen (center, y≈700):**
```
posters, rendered
```
Font: Plus Jakarta 500 · 34px · #1F1409 @ 75%

- 15.55s → fade in 0.3s

**On-screen (center, y≈960):**
```
600
```
Font: Fraunces roman · 320px · #F26B1F
- 15.60s – 17.00s → count up from `0` to `600` with spring settle. Numeric interpolation, integer per frame. Do not overshoot past 600.

**On-screen (center, y≈1300–1420):**
```
8 languages × 3 surfaces × 25 products
42 seconds · $0.20
```
Font: Plus Jakarta 500 · 32px · #1F1409 @ 85%, two lines, center-aligned
- 17.30s → fade up 20px, 0.4s
- Hold to 19.0s

**Cut:** crossfade 0.4s → scene 7

---

## Scene 7 · Punchline & CTA (19.0 – 22.0s)

**On-screen (three-line stack, y≈580–1180, center-aligned):**

Line 1 (19.10s → fade-up 20px, 0.3s):
```
63M kirana stores.
```
Font: Fraunces italic · 88px · #1F1409

Line 2 (19.35s → fade-up 20px, 0.3s):
```
375M posters a year.
```
Font: Fraunces italic · 88px · #1F1409

Line 3 (19.60s → fade-up 20px, 0.3s):
```
All in their script.
```
Font: Fraunces italic · 88px · #F26B1F
- Wrap `their` in its own span.
- 19.90s → scale-punch on `their`: 1.0 → 1.15 → 1.0 over 0.5s, `cubic-bezier(0.34, 1.56, 0.64, 1)`, beat-locked to strong cue near 19.5s

**CTA card (bottom, y≈1520):**
```
bazaarboard.vercel.app
```
Font: Plus Jakarta 600 · 44px · #1F1409 · canvas bg · tangerine 2px border · rounded 24px · padding 20×32px
- 20.60s → fade-up 16px, 0.4s
- Hold to 22.0s (final)

**End:** cut to black frame at 22.0s (music has already faded).

---

## Timing summary

| # | Scene | Start | End | Dur |
|---|---|---|---|---|
| 1 | Hook | 0.0 | 2.0 | 2.0 |
| 2 | 8-script column | 2.0 | 6.0 | 4.0 |
| 3 | Logo reveal | 6.0 | 8.0 | 2.0 |
| 4 | Live editor | 8.0 | 12.0 | 4.0 |
| 5 | Moat | 12.0 | 15.5 | 3.5 |
| 6 | Bulk stat | 15.5 | 19.0 | 3.5 |
| 7 | Punchline & CTA | 19.0 | 22.0 | 3.0 |
|   | **Total** |  |  | **22.0** |

## Audio bed
- `vol-12.mp3` · start 0.0s · volume 0.30 · fade-in 0.4s · fade-out 0.6s ending at 22.0s
- SFX: ~12 events total (8 ticks in scene 2, ~15 quiet key ticks in scene 4 typing, 1 confirm on tile arrival, 1 thump on moat overlay, ~5 decaying ticks on count-up, 1 settle chime on `600`, 1 clean logo hit on CTA card)
- Audio-reactive: bass RMS drives tangerine radial-glow opacity 0.15↔0.25 behind hero word in scene 1 only
