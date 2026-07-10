# Hyperframes Composition Brief: BazaarBoard (Vertical, 22s)

## Objective
Create a short launch-style brag video for BazaarBoard — a live regional-language marketing-asset generator for India's 63M kirana stores and 12M street vendors. Typography-first, polished, vertical 9:16 for Instagram Reels, YouTube Shorts, and TikTok.

## Output
- Composition directory: `brag-output-2026-07-11/vertical/hyperframes/composition/`
- Rendered video: `brag-output-2026-07-11/vertical/brag.mp4`
- Format: vertical — 1080x1920
- Duration: 22 seconds
- Frame rate: 30 fps

## Source Material
- Project root: `C:\Users\I587436\projects\bazaarboard`
- Primary files read: `src/app/page.tsx`, `src/lib/languages.ts`
- Product name: BazaarBoard
- Tagline / strongest claim: "Type once. Print, post, share — in every Indian script that matters."
- Key UI or visual moment to recreate: The `AllScriptsStrip` component reimagined as a vertical column — one input rendered into 8 native scripts side-by-side, all typographically correct at the same moment. The `regenerateSingle` live-editor fan-out is the demo.
- Copy that must appear verbatim (Indic phrases — actual translations of "mango pulp"):
  - `मैंगो पल्प` (Hindi/Devanagari)
  - `மாம்பழக் கூழ்` (Tamil)
  - `আমের পাল্প` (Bengali)
  - `మామిడి పల్ప్` (Telugu)
  - `ಮಾವಿನ ಪಲ್ಪ್` (Kannada)
  - `മാങ്ങാ പൾപ്പ്` (Malayalam)
  - `ਅੰਬ ਪਲਪ` (Punjabi/Gurmukhi)
  - `કેરીનો પલ્પ` (Gujarati)
  - `Alphonso mango pulp / ₹120` (typed into the input in scene 4)
  - `0.3s · NB2 Lite` (latency chip)
  - `Canva breaks. BazaarBoard doesn't.`
  - `8 languages × 3 surfaces × 25 products`
  - `42 seconds · $0.20`
  - `600 posters`
  - `63M kirana stores.`
  - `375M posters a year.`
  - `All in their script.`
  - `bazaarboard.vercel.app`
  - Tagline: `Type once. Print, post, share — in every Indian script that matters.`
  - Hook stack: `one input.` / `every Indian script.`

**Digit and currency fidelity is load-bearing.** `₹120`, `600`, `63M`, `375M`, `42`, `$0.20`, `8`, `3`, `25` must render byte-for-byte. This mirrors the product's own digit-fidelity contract in `src/lib/fidelity.ts`.

## Creative Direction
- Tone preset: **polished**
- Creative direction: quiet premium product film for typography nerds and dukan owners alike
- Interpretation: fewer scenes, longer holds on hero Indic type. Restraint is the flex — the scripts are already beautiful; motion should get out of their way. No caps, no exclamation, no chaos cuts. Motion vocabulary: crossfades (0.4s), gentle slam-ins (scale 0.94→1.0, cubic-bezier(0.2, 0.9, 0.2, 1)), 5-frame fade-up staggers, one scale-punch on the punchline.
- Angle: Canva can't spell "आम" without breaking the conjunct; Google Translate gives you words, not a poster. BazaarBoard is the only tool that takes one English line and renders eight typographically-correct posters — reph, pulli, chillu, gunintam all intact — before you finish sipping chai. The moat is script fidelity at NB2 Lite speed.
- Hook: Full-bleed `मैंगो पल्प` in massive tangerine Devanagari at ~320px on canvas, slam-in at 0.15s. Hook line at y=1500: *one input. every Indian script.* The unfamiliar Indic word is what earns the swipe.
- Outro / punchline: `63M kirana stores.` / `375M posters a year.` / `All in their script.` — scale-punch on *"their"* — followed by CTA card `bazaarboard.vercel.app`.
- Avoid:
  - Generic SaaS language ("AI-powered", "unlock", "seamlessly")
  - Abstract filler visuals (particle systems, color washes, waveform bars)
  - Unrelated visual redesign — use the exact bazaar-canvas / bazaar-ink / bazaar-tangerine palette from the project
  - Side-by-side horizontal layouts (this is 9:16 — everything stacks)
  - Fake or wrong Indic phrases — every native-script word listed above is a real translation and must render exactly as written
  - Speeding through the 8-script column faster than reading floor allows

## Visual Identity
- Background: `#F5EFE3` (bazaar-canvas)
- Text: `#1F1409` (bazaar-ink)
- Accent: `#F26B1F` (bazaar-tangerine)
- Supporting: `#7BA05B` (bazaar-leaf, for tick/confirm marks only), `#E85D3C` (bazaar-coral, for the Canva "broken" indicator only)
- Display font: **Fraunces** (italic for tagline and punchline lines; roman for numeric count-up)
- Body font: **Plus Jakarta Sans** (weights 400, 500, 600)
- Script fonts (load via Google Fonts):
  - `Noto Sans Devanagari` (weights 400, 600, 700)
  - `Noto Sans Tamil` (weights 400, 600)
  - `Noto Sans Bengali` (weights 400, 600)
  - `Noto Sans Telugu` (weights 400, 600)
  - `Noto Sans Kannada` (weights 400, 600)
  - `Noto Sans Malayalam` (weights 400, 600)
  - `Noto Sans Gurmukhi` (weights 400, 600)
  - `Noto Sans Gujarati` (weights 400, 600)
- Visual references from the project:
  - The header bar (`bg-white/80 backdrop-blur`, tangerine accent)
  - The `AllScriptsStrip` component (`src/components/AllScriptsStrip.tsx`) — 8 native scripts rendered side-by-side; we're re-shooting this as a vertical column
  - The bulk pipeline progress bar (thin tangerine fill on ink/10 track) — inspiration for the count-up scene's understated aesthetic
  - The throughput chip (small pill with model name and latency) — reused in scene 4 as `0.3s · NB2 Lite`
  - The `preset-chip` rounded-full outlined-then-filled aesthetic — reused for the CTA card

## Storyboard
Use the storyboard in `brag-output-2026-07-11/vertical/brag-plan.md` as the creative contract.

Scene summary:
1. **Hook: single Indic word** — 2.0s — `मैंगो पल्प` full-bleed tangerine on canvas; hook stack fades in at y=1500.
2. **Vertical 8-script column** — 4.0s — 8 native-script versions of "mango pulp" stack top-to-bottom, beat-locked arrivals, held 1.4s at full stack.
3. **Logo reveal** — 2.0s — `BazaarBoard` in Fraunces italic + tagline: "Type once. Print, post, share — in every Indian script that matters."
4. **Live editor moment** — 4.0s — search-bar input types `Alphonso mango pulp / ₹120`; 8 poster tiles fan in below; `0.3s · NB2 Lite` chip pulses.
5. **The moat (top/bottom)** — 3.5s — Canva's broken `मैंगो` up top, BazaarBoard's correct one on the bottom; overlay: "Canva breaks. BazaarBoard doesn't."
6. **Bulk stat** — 3.5s — count-up to `600 posters`, breakdown `8 languages × 3 surfaces × 25 products` / `42 seconds · $0.20`.
7. **Punchline & CTA** — 3.0s — 3-line stack (`63M kirana stores.` / `375M posters a year.` / `All in their script.`) with scale-punch on *their*, then `bazaarboard.vercel.app` card.

**Total: 22.0s.**

## Audio
- Audio role: cinematic support — warm bed with a low swell under the moat and the punchline, then soft fade under the CTA
- Audio arc: warm enter (0.0s) → steady pulse under script column (2-6s) → soft lift at logo (6s) → steady under demo (8-12s) → subtle duck + thump at moat overlay (14s) → held pulse through count-up (16-18s) → swell peak on scale-punch at "their" (~19.5s) → 0.6s fade under CTA (21.4-22.0s)
- Music: `vol-12.mp3` — 110 BPM, ~2 min, business-instrumental. Best polished restraint for a 22s piece.
- Music treatment: start at 0.0s, `data-volume="0.30"`, `fadeIn=0.4s`, `fadeOut=0.6s` starting at 21.4s. No abrupt cuts.
- Music cue guidance: no bundled preset for `vol-12` in `/brag` assets — detect at composition time with `npx hyperframes beats vol-12.mp3`. Target strong-cue locks near:
  - **~6.0s** — logo slam in scene 3 (±0.15s)
  - **~14.0s** — moat overlay wipe in scene 5 (±0.15s)
  - **~19.5s** — scale-punch on *"their"* in scene 7 (±0.15s)
  - Beat-grid the 8 script arrivals in scene 2 across ~4 consecutive beats starting near 2.4s (±0.10s each). But hold the completed stack for 1.4s after the last arrival — do NOT keep snapping new reveals onto every beat.
- Audio-reactive treatment: **subtle**. Bass RMS drives a low-opacity tangerine radial-glow behind the hero word in scene 1 (opacity oscillates 0.15↔0.25). Nothing else reacts — no waveform bars, no card-presence pumping. Keep the type still.
- Audio-coupled moments:
  - Scene 2 — 8 sequential script arrivals: soft dry key-tick SFX per arrival (low HF risk), volume ~0.03
  - Scene 4 — simulated typing of `Alphonso mango pulp / ₹120`: 15 short key ticks matching characters, volume ~0.02
  - Scene 4 — tile arrival: one soft confirm chime
  - Scene 5 — overlay wipe: one deep soft thump aligned to the beat lock
  - Scene 6 — count-up 0→600: sparse decaying-pulse ticks (~5 hits total, not per digit), plus one settle chime on 600
  - Scene 7 — CTA card landing: one clean, quiet logo hit
- SFX selection guidance: prefer bundled ticks/confirms/hits with **low high-frequency risk** — this is polished, not glitchy. Match motion: a card-shaped reveal gets a card sound; a text keystroke gets a key tick; a hero payoff gets one clean announcement note. If it isn't matched to a specific visual event, drop it.
- SFX analysis guidance: use `skills/brag/assets/sfx/sfx-analysis.md` if present; prefer files marked low-HF-risk since scene 2 fires 8 in sequence and repeated high-HF ticks fatigue quickly.
- Exact SFX choice: Hyperframes should choose filenames, timestamps, density, and volume based on the implemented animation.
- Audio files: copy `vol-12.mp3` from `~/.claude/skills/brag/assets/music/` into `composition/assets/music/`; Hyperframes copies chosen SFX into `composition/assets/sfx/`.

## Hyperframes Instructions
Use the current `hyperframes` skill and CLI workflow. Prefer native Hyperframes conventions over anything in `/brag`.

Requirements:
- Show at least one real UI, copy, or visual element from the source project — the 8-script vertical column (from `AllScriptsStrip`), the search-bar input (from `page.tsx` single mode), the throughput chip (from `ThroughputBar`), the tangerine-and-canvas palette (from `globals.css` / `tailwind.config.ts`).
- Keep all text readable in the final render. Indic scripts especially — do not scale them below 120px height, do not clip conjuncts, do not apply `text-transform: uppercase` (undefined for Indic).
- Keep the video within 22 seconds. Scene durations sum to exactly 22.0.
- Include the planned music/SFX layer. `vol-12` at 0.30 volume with the fades described above.
- Treat `/brag` audio notes as guidance, not a fixed cue sheet. Choose SFX after the visual animation exists.
- Treat music cue metadata as optional timing hints. If a beat lock hurts readability (e.g., the moat overlay lands 0.2s too early to read the label), use natural timing.
- Major reveals may move toward nearby strong cues within about 0.15s. Smaller entrances may align to nearby beat points within about 0.10s. Use 2-3 strong cue locks total (logo, moat overlay, scale-punch).
- Use SFX to support motion and interaction: key ticks for typed text, card-arrival sounds for tile fan-in, one thump for the moat, one hit for the CTA. Restraint over density.
- Honor planned music treatment: 0.4s fade-in, 0.6s fade-out under CTA, subtle duck under moat overlay.
- Use audio-reactive workflow ONLY for the subtle tangerine glow behind the hero word in scene 1 — bass RMS drives glow opacity 0.15↔0.25. No other visuals should pulse.
- Use local assets. Load Google Fonts via `<link>` in `index.html` head — Fraunces, Plus Jakarta Sans, and the eight `Noto Sans <Script>` families. Preload them so no font swap flashes on the first frame.
- Run `npx hyperframes lint` and `npx hyperframes validate` before render.
- Render with `npx hyperframes render --fps 30 --width 1080 --height 1920`.

## Vertical-specific implementation notes
- Root composition must be sized 1080×1920 at 30 fps. Use `<div class="stage">` with `width: 1080px; height: 1920px; position: relative; overflow: hidden`.
- Safe zone: keep critical text and CTA between y=200 and y=1720. Reels/TikTok/Shorts UI eats the outer 200px top and bottom.
- Each scene is a `<div class="clip" data-start="X" data-duration="Y">`.
- Hero word in scene 1: `font-family: 'Noto Sans Devanagari', sans-serif; font-weight: 700; font-size: 320px; color: #F26B1F; line-height: 1.05; text-align: center; letter-spacing: -0.01em; max-width: 960px; overflow: hidden;`.
- 8-script column in scene 2: parent `flex-direction: column; gap: 24px; align-items: center; justify-content: center;`. Each item is `width: 100%; text-align: center; font-size: 150px; color: #1F1409; font-weight: 600;` with per-language `font-family` swapped.
- Fonts must be `<link rel="preload" as="font">` or preloaded via a hidden warm-up div that renders one glyph from each family off-screen at scene start (t < 0).
- Search bar in scene 4: `border: 1px solid rgba(31,20,9,0.30); border-radius: 12px; background: #ffffff; padding: 20px 24px; font-family: 'Plus Jakarta Sans'; font-size: 40px;` — the caret should blink at 0.5s cadence.
- Latency chip: rounded-full pill, `background: rgba(31,20,9,0.06); color: #1F1409; padding: 8px 16px; font-family: 'Plus Jakarta Sans'; font-weight: 500; font-size: 24px;`.
- Moat overlay card: `background: rgba(245,239,227,0.85); backdrop-filter: blur(12px); border: 1px solid rgba(31,20,9,0.15); border-radius: 24px; padding: 32px 40px;`.
- Count-up in scene 6: use GSAP + a numeric interpolator; increment displayed integer each frame; must land on exactly `600` and hold, not overshoot past.
- Scale-punch on *"their"* in scene 7: wrap the word in its own span; tween `scale: 1 → 1.15 → 1.0` over 0.5s with `cubic-bezier(0.34, 1.56, 0.64, 1)`.
- Optional gradient orb: one soft tangerine radial (600px radius, `filter: blur(160px)`, opacity 0.18) behind the hero word in scene 1 and behind the CTA in scene 7. Nothing more.

## Self-review checklist (owner: composer)
- [ ] `composition-brief.md`, `brag-plan.md`, `script.md` all present in the vertical output directory
- [ ] `vol-12.mp3` copied into `composition/assets/music/`
- [ ] All 8 Noto Sans Indic fonts loaded and warmed before scene 1 starts
- [ ] Every Indic phrase renders byte-for-byte as specified (verify by copy-paste, not visual approximation)
- [ ] Digits `₹120`, `600`, `8`, `3`, `25`, `42`, `63M`, `375M`, `$0.20` render exactly
- [ ] Hero Indic word at ≥300px font-size; no clipping
- [ ] Vertical safe zone respected (all critical text between y=200 and y=1720)
- [ ] Beat lock on logo (~6.0s), moat overlay (~14.0s), scale-punch (~19.5s) — or documented natural timing
- [ ] Music fades: 0.4s in at 0.0s, 0.6s out ending at 22.0s
- [ ] Subtle audio-reactive glow behind hero word (RMS-driven opacity 0.15↔0.25)
- [ ] `npx hyperframes lint` passes
- [ ] `npx hyperframes validate` passes
- [ ] Rendered `brag.mp4` is exactly 22.0s, 1080×1920, 30 fps
