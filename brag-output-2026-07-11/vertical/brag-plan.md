# Brag Plan: BazaarBoard — Vertical (9:16, 22s)

## What is this app?
BazaarBoard turns one English product line into print-ready marketing posters in every Indian script — Devanagari, Tamil, Bengali, Telugu, Kannada, Malayalam, Gurmukhi, Gujarati — in under 4 seconds, for India's 63M kirana stores and 12M street vendors. Powered by Gemini Nano Banana 2 Lite, with SVG typography fallback when quota exhausts.

## The angle
Canva can't spell "आम" without breaking the conjunct. Google Translate gives you words, not a poster. BazaarBoard is the only tool that takes `Alphonso mango pulp / ₹120` and renders eight typographically-correct posters — reph, pulli, chillu, gunintam intact — before you finish sipping chai. The moat is script fidelity at NB2 Lite speed.

## Hook (first 2-3 seconds)
Full-bleed **मैंगो पल्प** in massive tangerine Devanagari on canvas. Slam-in at 0.2s. Hook line stacks under it: *"one input. every Indian script."* Vertical algorithm rule: the first frame must earn the swipe — a single unfamiliar Indic word at 320px does that in one glance.

## Key moments (the middle)
- The 8-script vertical column: `मैंगो पल्प` → `மாம்பழக் கூழ்` → `আমের পাল্প` → `మామిడి పల్ప్` → `ಮಾವಿನ ಪಲ್ಪ್` → `മാങ്ങാ പൾപ്പ്` → `ਅੰਬ ਪਲਪ` → `કેરીનો પલ્પ`. Each slides up, staggered, forming a stacked column.
- Live editor: search-bar input at top types `Alphonso mango pulp / ₹120`; below, 8 poster tiles stack vertically with a `0.3s · NB2 Lite` latency chip.
- The moat, top vs. bottom: top panel shows Canva's broken kerning on "मैंगो" (misplaced matra); bottom shows BazaarBoard's correct conjunct. Overlay: *"Canva breaks. BazaarBoard doesn't."*
- The bulk stat: **600 posters** count-up, then breakdown line: *"8 languages × 3 surfaces × 25 products / 42 seconds / $0.20"*.

## Outro / punchline
`63M kirana stores.` (hold)
`375M posters a year.` (hold)
`All in their script.` (scale-punch on "their")
CTA: **bazaarboard.vercel.app**

## User flow worth showing
Real flow from `page.tsx`: (1) type "Alphonso mango pulp / ₹120" into single-mode input; (2) live debounce fires, 400ms later 8 script cells render in parallel via `regenerateSingle`; (3) throughput bar shows latency chip; (4) toggle bulk mode → paste 25 products → hit "Run bulk pipeline" → progress bar fills 0→600 → toast "600 posters generated in 42.0s".

## Tone
- Preset: **polished**
- Creative direction: quiet premium product film for typography nerds and dukan owners alike
- Interpretation: fewer scenes, longer holds on hero Indic type. Restraint is the flex — the scripts are already beautiful; motion should get out of their way. No caps, no exclamation, no chaos cuts.

## Format: vertical — 1080x1920
## Duration: 22 seconds

## Visual identity (from the project)
- Background: `#F5EFE3` (bazaar-canvas)
- Accent: `#F26B1F` (bazaar-tangerine)
- Text: `#1F1409` (bazaar-ink)
- Display font: Fraunces (italic for tagline, roman for CTA)
- Body font: Plus Jakarta Sans
- Script fonts: Noto Sans Devanagari, Tamil, Bengali, Telugu, Kannada, Malayalam, Gurmukhi, Gujarati
- Strongest visual element: the 8-language `AllScriptsStrip` reimagined as a vertical column — one input rendered into 8 native scripts, all correct, all at the same moment

## Share copy (draft)
Type once in English. Print, post, share in every Indian script that matters — in 4 seconds flat. bazaarboard.vercel.app

## Audio direction
- Role: cinematic support — warm bed with a low swell that lifts under the moat reveal, then a soft final tail under the CTA
- Music: `vol-12` (110 BPM, ~2 min, business-cinematic — best fit for polished restraint and the 22s runtime)
- Music treatment: start at 0.0s, volume 0.30, fade-in 0.4s, gentle 0.6s fade-out under the CTA
- Music cue guidance: preset unavailable; run `npx hyperframes beats` on `vol-12.mp3` at composition time. Target 1 strong cue near 6.0s (logo/reveal slam) and 1 near 18.0s (punchline scale-punch). Beat-grid the 8-script column reveal (scene 2) across ~4 consecutive beats — but hold the completed stack ≥2.4s after all 8 land, so viewers can read them.
- Audio-reactive treatment: subtle. Bass RMS breathes the tangerine glow behind the hero word (opacity 0.15↔0.25). Nothing louder.
- SFX posture: sparse. One soft "type" tick per Indic word arrival in scene 2 (8 total, low-freq risk). One deep "confirm" thump on scene 4 moat overlay. One clean "logo hit" on final CTA. No swipe/whoosh library sounds.
- Audio-coupled moments: typing into the search-bar input in scene 3 (key ticks match keystrokes); the 8 scripts arriving one by one; the "600 posters" count-up (subtle ticks under motion, not on every digit); the moat overlay slam.
- Restraint rule: no build-drop EDM energy, no glitch stutters, no waveform bars. Music must never fight the Indic type — if in doubt, duck.

## Vertical layout doctrine
- One column, full width per moment. Never split L/R.
- Hero word gets 60-75% of vertical height in scene 1.
- The 8-script stack in scene 2 is a vertical roll — each word full width, ~180-220px tall, stacked with 24px gaps.
- Moat comparison (scene 4) is top-half (Canva broken) / bottom-half (BazaarBoard correct) — never L/R.
- Safe zones: keep critical type between y=200 and y=1720 (Reels/TikTok UI chrome eats top and bottom).

## Storyboard

### Scene 1 — Hook: single Indic word — 2.0s
Full-bleed **मैंगो पल्प** in Noto Sans Devanagari, weight 700, ~320px, `#F26B1F` on `#F5EFE3` canvas. Word slams in at 0.15s (scale 0.94 → 1.0, opacity 0 → 1, cubic-bezier(0.2, 0.9, 0.2, 1), 0.5s). Holds 1.0s. Small tagline stack fades in at 0.9s at y=1500: *one input.* / *every Indian script.* (Fraunces italic 44px, ink at 85% alpha).
Sequential/interaction: none.
Audio intent: warm music enters at 0.0s and settles; a soft low-frequency pad under the slam-in.
Audio-coupled idea: none — let the word land in near-silence.
Music: `vol-12` fade-in at 0.0s.
Transition mood: soft crossfade (0.4s) → Scene 2

### Scene 2 — The vertical 8-script column — 4.0s
The Devanagari word from scene 1 shrinks to fit the top slot of a vertical column. Then 7 more script versions slide up from below in a beat-locked stagger (~0.35s spacing, matched to `vol-12` beat grid): Tamil `மாம்பழக் கூழ்` → Bengali `আমের পাল্প` → Telugu `మామిడి పల్ప్` → Kannada `ಮಾವಿನ ಪಲ್ಪ్` → Malayalam `മാങ്ങാ പൾപ്പ്` → Gurmukhi `ਅੰਬ ਪਲਪ` → Gujarati `કેરીનો પલ્પ`. Each word full-width, its own Noto Sans script family, `#1F1409` ink, weight 600, ~150px. Once all 8 land at ~4.4s cumulative, hold the full column for 1.4s — reading floor honored.
Sequential/interaction: yes — 8 sequential script arrivals, one per beat, plus final full-column hold.
Audio intent: musical pulse becomes a felt tick under each arrival.
Audio-coupled idea: soft, dry key-tick SFX (~0.03 volume) per arrival; low high-frequency risk. On the 8th arrival, a subtle harmonic swell.
Music: `vol-12` continuing, beats grid drives arrivals.
Transition mood: soft crossfade (0.4s) → Scene 3

### Scene 3 — Logo reveal — 2.0s
Column recedes to opacity 0. Center-screen: `BazaarBoard` in Fraunces italic 168px, `#1F1409`, followed below by the tagline in Plus Jakarta 40px: *"Type once. Print, post, share — in every Indian script that matters."* Logo slam-in (scale 0.96 → 1.0, 0.4s); tagline fades up 0.15s after.
Sequential/interaction: none.
Audio intent: music lifts slightly here — the "reveal" moment. Beat-lock the logo slam within ±0.15s of a strong cue near 6.0s.
Audio-coupled idea: one clean, soft "logo hit" SFX aligned to the slam frame.
Music: `vol-12` at full 0.30 volume.
Transition mood: crossfade (0.4s) → Scene 4

### Scene 4 — Live editor moment — 4.0s
Top of frame: a rendered search-bar input styled like the real app (`border-bazaar-ink/30`, rounded-lg, white bg, `bazaar-canvas` under). Cursor types `Alphonso mango pulp / ₹120` character-by-character (~1.4s). At end of typing, a 400ms debounce shim, then 8 vertically-stacked poster tiles pop in below (aspect 3/4, real product on tangerine field, each labeled with its native script name at the bottom). A latency chip in the top-right of the tile column reads `0.3s · NB2 Lite` — pulses once on arrival.
Sequential/interaction: yes — simulated typing in the input; then 8 poster tiles fan in with 40ms stagger (fast, but held together after — this is one visual arrival, not 8 sequential reads).
Audio intent: dry key ticks under typing, then a soft "confirm" chime as tiles arrive.
Audio-coupled idea: 15 short key ticks matching the typed characters (very quiet, ~0.02 vol, low HF risk); one soft confirm on tile arrival.
Music: continuing.
Transition mood: soft crossfade (0.4s) → Scene 5

### Scene 5 — The moat (top/bottom) — 3.5s
Screen splits horizontally. Top half (label `Canva`, muted): the word **मैंगो** rendered with visibly broken kerning — the matra above `म` mis-positioned, the nukta drifted. Ghost-red underline. Bottom half (label `BazaarBoard`, tangerine tick): the word **मैंगो** rendered correctly, tight conjunct, matra locked. At 2.0s an overlay wipes across the middle: *"Canva breaks. BazaarBoard doesn't."* (Fraunces italic 68px, ink on canvas card, backdrop-blur 12px).
Sequential/interaction: yes — top appears first, then bottom, then overlay wipes across.
Audio intent: a brief pause in the music energy, then a deep soft thump on the overlay slam. Beat-lock the overlay to a strong cue if one lands near ~12.5s.
Audio-coupled idea: one soft "confirm" thump on overlay wipe.
Music: continuing, subtle duck under the overlay slam.
Transition mood: soft crossfade (0.4s) → Scene 6

### Scene 6 — Bulk stat — 3.5s
Center-screen count-up: **000 → 600** in Fraunces italic 320px, tangerine, animated from 0 to 600 over 1.4s with a spring settle. Label above: *"posters, rendered"* (Plus Jakarta 34px, ink 75% alpha). Below, the breakdown line appears at 1.8s: *"8 languages × 3 surfaces × 25 products"* / *"42 seconds · $0.20"* (Plus Jakarta 32px, two lines, ink 85% alpha). Held 1.5s.
Sequential/interaction: yes — the count-up is the interaction; the breakdown reveals afterward.
Audio intent: musical pulse rides under the count-up; a soft harmonic lift as it settles.
Audio-coupled idea: sparse tick pattern under the count-up (not per digit — a decaying pulse ~5 hits total). One soft settle chime on 600.
Music: continuing.
Transition mood: soft crossfade (0.4s) → Scene 7

### Scene 7 — Punchline & CTA — 3.0s
Three lines stack vertically, revealed with 5-frame fade-up stagger, each held to the reading floor:
- **63M kirana stores.** (Fraunces italic 88px, ink)
- **375M posters a year.** (Fraunces italic 88px, ink)
- **All in their script.** (Fraunces italic 88px, tangerine, with a scale-punch on *"their"* at 1.6s: 1.0 → 1.15 → 1.0 with `cubic-bezier(0.34, 1.56, 0.64, 1)`)
Then CTA card at bottom (y=1520): **bazaarboard.vercel.app** (Plus Jakarta 44px, ink on tangerine-outlined canvas card, rounded-2xl). Held 1.0s.
Sequential/interaction: yes — 3-line vertical fade-up stagger plus scale-punch on *their*.
Audio intent: music resolves — swell peaks under *"their script."*, then a soft 0.6s fade under the CTA. Beat-lock the scale-punch to a strong cue near 18.0s.
Audio-coupled idea: one clean logo/CTA hit as the URL card lands.
Music: `vol-12` fade-out over final 0.6s.
Transition mood: hold to end — no further scene.

**Music mood for this video:** cinematic-polished — warm business-instrumental with restrained lift; nothing EDM, nothing chaotic.
**Audio summary:** `vol-12` at 0.30 enters warm at 0.0s, holds through the script column, lifts subtly at the logo, rides through the demo and moat, peaks on the punchline scale-punch, fades under the final CTA. SFX are sparse and low-HF: soft ticks per script arrival, key ticks under typing, one thump on the moat overlay, one clean hit on the CTA. Total under 12 audio events across 22 seconds.

## Vertical-specific reading-time budget
| Scene | Duration | Text load | Floor honored? |
|---|---|---|---|
| 1 | 2.0s | 1 Indic word + 2 short tagline lines | Yes (word 1.5s settled, tagline 1.1s) |
| 2 | 4.0s | 8 short Indic phrases arrive over ~2.4s, hold 1.4s | Yes (full stack held 1.4s ≈ 0.175s/word for re-read) |
| 3 | 2.0s | Logo + 1 tagline sentence | Yes (1.4s settled) |
| 4 | 4.0s | Input string + 8 tile labels | Yes (input at 0.3s/word, tiles held 2.2s) |
| 5 | 3.5s | 2 word labels + 1 overlay line | Yes (overlay held 1.5s) |
| 6 | 3.5s | count + 1 label + 2 breakdown lines | Yes (breakdown held 1.5s) |
| 7 | 3.0s | 3 short punchline lines + CTA | Yes (each line ~0.9s settled, CTA 1.0s) |

**Total: 22.0s.** Scene count: 7 (within polished long-format 5-7 range — appropriate for a 22s piece with 8 scripts to introduce).
