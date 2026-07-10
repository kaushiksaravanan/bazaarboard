# Brag Plan: BazaarBoard — Every Indian script, live in 4 seconds

## What is this app?
BazaarBoard is a live, regional-language marketing-asset generator for India's 63M kirana stores and 12M street vendors: type one product name + price, get a print-ready poster in every Indian script that matters — Devanagari, Tamil, Bengali, Telugu, Kannada, Malayalam, Gurmukhi, Gujarati — rendered by Gemini Nano Banana 2 Lite at sub-4-second, digit-exact fidelity, with an SVG typography fallback the moment quota runs out.

## The angle
The UI *is* the message. Every other AI poster tool ships a slick English preview and hands Indic scripts to a text-to-image model that breaks Devanagari kerning on the first `म` (mango) glyph. BazaarBoard's edge is a boring, unglamorous, load-bearing detail: **it renders the scripts correctly.** The video is a typographic case for that detail — display type in eight real scripts, actual translations, real prices, one input, sub-4s render. No fake dashboards, no glossy stock B-roll — the type carries the whole thing because in this product the type IS the product.

## Hook (first 2-3 seconds)
Black cursor blinking on `#F5EFE3` canvas. The user types `Alphonso mango pulp / ₹120`. On the beat of the space, eight native-script translations SLAM in around the phrase in a cross-shape — मैंगो पल्प · மாம்பழம் · আমের পাল্প · మామిడి పల్ప్ · ಮಾವಿನ ಪಲ್ಪ್ · മാങ്ങാ പൾപ്പ് · ਅੰਬ ਪਲਪ · કેરીનો પલ્પ. Hook line reads underneath in Fraunces italic: **"One input. Every Indian script."**

## Key moments (the middle)
- **Logo reveal** — `BazaarBoard` wordmark in Fraunces italic, tangerine underline sweeps in left-to-right, tagline settles below: "Type once. Print, post, share — in every Indian script that matters."
- **Live editor** — a real input pill types "Alphonso mango pulp / ₹120", eight poster tiles bloom into a 4×2 grid, tangerine latency badges tick "0.3s · NB2 Lite" onto each tile as it lands. Final beat: a small pill under the grid reads "8 posters · 3.1s wall clock".
- **The moat** — screen splits into two halves labeled `Canva` (left, muted grey) and `BazaarBoard` (right, tangerine). Both render the Hindi word `मैंगो पल्प`. Canva's glyph shows broken half-form (bad conjunct, shifted `ै` mātrā). BazaarBoard's glyph is clean. A single tangerine underline sweeps under the correct one. Line beneath: **"Canva breaks. BazaarBoard doesn't."**
- **Bulk pipeline** — 600 tiles stream into a dense grid, each 12px × 16px, tangerine progress hairline sweeps across the bottom. Center overlay: **"600 posters. 42 seconds. $0.20."** The `$0.20` count-ticks from `$0.00`.

## Outro / punchline
Full-bleed canvas. Big type, one line at a time, held: **"63M kirana stores. 375M posters/year. All in the script they read."** Cut to BazaarBoard wordmark + `bazaarboard.vercel.app`. Small caption underneath: "Google DeepMind Bangalore Hackathon · Idea 3."

## User flow worth showing
Single input → 8 native-script tiles render in parallel → bulk pipeline fanning out 600 posters. Entry (one product name) → key action (fan-out translation + render) → result (grid of correct-script posters, printable). All three scenes below are the flow, not the landing page.

## Tone
- Preset: **polished**
- Creative direction: quiet premium product film for an infrastructure detail that nobody else got right
- Interpretation: fewer scenes, longer holds, Fraunces italic display, generous letter-spacing, soft crossfades, no CAPS, no exclamation, restraint through the whole runtime. The scripts do the emotional work — the video's job is to get out of their way.

## Format: landscape — 1920×1080
## Duration: 22 seconds

## Visual identity (from the project)
- Background: `#F5EFE3` (bazaar-canvas warm cream; slightly warmer than `#FFF8EE` so the tangerine sits deeper)
- Accent: `#F26B1F` (bazaar-tangerine)
- Secondary accent: `#FFB43C` (bazaar-saffron) — used sparingly, e.g. bulk-pipeline latency badge on light tiles
- Text (ink): `#1F1409` (bazaar-ink)
- Error/moat contrast: `#E43C4B` (bazaar-coral) — one flash under the broken-Canva side
- Display font: **Fraunces** (italic, weight 500-600, for hero + product name)
- UI font: **Plus Jakarta Sans** (weight 500-700, for labels, latency badges, CTA)
- Indic fonts: Noto Sans Devanagari, Tamil, Bengali, Telugu, Kannada, Malayalam, Gurmukhi, Gujarati — each rendering its own real translation, never Latin transliteration
- Strongest visual element: the eight native-script phrases arranged in a grid — display type IS the visual.

## Share copy (draft)
BazaarBoard: type one product name, get a print-ready poster in every Indian script that matters — in under four seconds. Built for the 63M kirana stores that Canva can't spell for. bazaarboard.vercel.app

## Audio direction
- Role: warm cinematic bed with sparse professional accents
- Music: bundled `vol-12` (~110 BPM, business-warm) at 0.30 volume; fade in over 0.6s, fade out over 1.0s under the final wordmark
- Music treatment: bed sits under the whole runtime; light swell around the "600 posters" stat drop (scene 5, ~15.5s); duck 4dB (0.22) over the final wordmark for the URL to breathe
- Music cue guidance: presets available for bundled `vol-12`; target 3 strongCues in this order — (1) hook-line settle ~2.6s (2) moat reveal ~11.5s (3) 600-poster stat land ~16.0s. Beat-grid the 8-tile bloom in scene 3 on every other beat (~0.55s spacing at 110 BPM) so each latency badge lands on the pulse but the Indic phrases still have their full read floor. See `assets/music/cues/vol-12.json` conditionally.
- Audio-reactive treatment: subtle — a soft radial glow behind the BazaarBoard wordmark breathes on RMS during logo scene and outro. No waveform bars, no particle systems.
- SFX posture: sparse, motion-matched, polished restraint. Candidates: soft key-tick under the typed-in hook, one hushed woody card-drop per script slam (8 total, quiet), a single hushed swell under the "600 posters · $0.20" reveal, one clean note under the wordmark landing. Nothing sharp, nothing digital.
- Audio-coupled moments: typed hook (key ticks), 8-script bloom (card drops on beat grid), moat sweep (single soft underline whoosh), stat count-up ($0.00 → $0.20 with faint counter tick), final wordmark (one warm note).
- Restraint rule: no music sting on the Canva/BazaarBoard moat — the visual carries it. No SFX layered thick enough to override any of the Indic phrases while they're on read floor.

## Storyboard

### Scene 1 — Hook (typed input → 8-script bloom) — 3.0s
**On screen.** `#F5EFE3` canvas. A single input pill in Plus Jakarta Sans (~44px) centers at 40% height: `Alphonso mango pulp  /  ₹120`. As the last character types, eight Indic phrases fly in from the eight compass points and settle in a loose grid around the pill:
- N: `मैंगो पल्प`
- NE: `மாம்பழம்`
- E: `আমের পাল্প`
- SE: `మామిడి పల్ప్`
- S: `ಮಾವಿನ ಪಲ್ಪ್`
- SW: `മാങ്ങാ പൾപ്പ്`
- W: `ਅੰਬ ਪਲਪ`
- NW: `કેરીનો પલ્પ`

Hook line in Fraunces italic (~64px, `#1F1409`) fades up under the grid at 2.4s: **One input. Every Indian script.**

Sequential/interaction: yes — the typed hook types character-by-character (~1.2s), then the 8 phrases arrive on the beat grid (~0.15s apart per compass slot). Hook line has a 0.6s hold once settled.
Audio intent: quiet, curious, "watch what this does".
Audio-coupled idea: key-tick under typed characters; soft hushed card-drop under each of the 8 phrases.
Music: warm bed fades in at 0.0s.
Transition mood: soft crossfade → Scene 2

### Scene 2 — Logo reveal — 3.5s
**On screen.** All 8 phrases pull down and reflow into a single-line ticker along the bottom (~28px, opacity 0.65). Center of the frame: `BazaarBoard` in Fraunces italic ~180px, `#1F1409`. Tangerine underline (2px, `#F26B1F`) sweeps in left-to-right under the wordmark over 0.7s. Tagline appears under the underline in Plus Jakarta Sans ~24px, `#1F1409/85`:

**Type once. Print, post, share — in every Indian script that matters.**

Sequential/interaction: yes — ticker reflows first (0.4s), wordmark scales in from 0.94 → 1.0 with soft ease-out (0.5s), underline sweeps (0.7s), tagline fades up (0.3s), then a 1.6s hold on the full lockup so the tagline is legibly readable (30 words → floor ~2s including the hold on entry glyphs).
Audio intent: settle, confidence.
Audio-coupled idea: single warm-note SFX on wordmark landing.
Music: bed continues, no swell.
Transition mood: soft crossfade → Scene 3

### Scene 3 — Live editor (8 tiles) — 4.0s
**On screen.** Canvas splits: left third holds a real-looking editor panel with the input pill from Scene 1 (~40% opacity, contextual), Fraunces italic label `Live editor · 8 languages · 1 surface`. Right two-thirds: a 4×2 grid of poster tiles, each `3:4` at ~200×267px. Each tile:
- Tangerine 2px border top, cream body
- Native product phrase in its script font, ~28px, `#1F1409`
- `₹120 / kg` in its language's numeric form (Devanagari: `₹120 / किलो`; Tamil: `₹120 / கிலோ`; etc — pulled verbatim from `src/lib/languages.ts`)
- Small `Bazaar Kirana` business name in Plus Jakarta Sans ~14px `#1F1409/70`
- Tangerine latency pill in bottom-right corner: `0.3s · NB2 Lite`

Tiles bloom one at a time on the beat grid (~0.35s apart), each landing with a subtle scale-in (0.92 → 1.0). At 3.4s, a small pill under the grid reads: `8 posters · 3.1s wall clock · Gemini NB2 Lite`.

Sequential/interaction: yes — tiles arrive one at a time in reading order (Hindi first, then Tamil, Bengali, Telugu, Kannada, Malayalam, Punjabi, Gujarati). Full grid holds for 0.6s at end.
Audio intent: rhythmic, professional, the pipeline is doing its job.
Audio-coupled idea: 8 soft card-drops on the beat grid; faint tick when the wall-clock pill lands.
Music: bed steady.
Transition mood: clean wipe → Scene 4

### Scene 4 — The moat (Canva vs BazaarBoard) — 4.0s
**On screen.** Split-screen. Left half labeled `Canva` in muted grey Plus Jakarta Sans ~18px; right half labeled `BazaarBoard` in tangerine `#F26B1F` Plus Jakarta Sans ~18px. Center of each half: the phrase `मैंगो पल्प` at ~144px in Noto Sans Devanagari, `#1F1409`.

- Left glyph shows a deliberately broken conjunct: the `ै` mātrā (second-vowel sign) shifted 6px right, the `प्` half-form drawn as a full `प` (missing virama). A subtle `#E43C4B` coral hairline underlines the broken portion, with the label `broken conjunct` in ~14px coral above.
- Right glyph is rendered cleanly. Tangerine underline sweeps in under it over 0.6s.

At 3.0s, big Fraunces italic line below both glyphs (~52px, `#1F1409`): **Canva breaks. BazaarBoard doesn't.**

Sequential/interaction: yes — both glyphs settle together (0.4s), coral underline on the broken side fades in (0.3s), tangerine underline sweeps on the correct side (0.6s), then the punchline line fades up and holds ~1.4s (7 words → floor ~1.4s).
Audio intent: quiet, confident, no gloat.
Audio-coupled idea: single soft underline whoosh on the tangerine sweep; no sound on the coral hairline (deliberate silence).
Music: bed steady, no swell.
Transition mood: soft crossfade → Scene 5

### Scene 5 — Bulk pipeline (600 posters, $0.20) — 4.0s
**On screen.** Cream canvas. A dense grid (~30 cols × 20 rows) of tiny 12×16px poster thumbnails streams in from top-left to bottom-right in ~1.8s, each thumbnail a mini render (Hindi, Tamil, Bengali, etc — thumbnails at readable-at-distance density). A tangerine 2px hairline sweeps across the bottom of the grid as a progress indicator.

At 2.0s, a centered card in `#FFF8EE` with a 1px `#1F1409/12` border and 24px padding fades up. Inside, three stacked lines in Fraunces italic:
- **600 posters** (~72px, `#1F1409`)
- **42 seconds** (~44px, `#1F1409/85`)
- **$0.20** (~64px, `#F26B1F`, count-ticks from `$0.00` → `$0.20` over 0.9s)

Sequential/interaction: yes — 600 thumbnails stream (1.8s), stat card fades up (0.4s), stat lines cascade in (0.3s stagger), `$0.20` counter ticks (0.9s), full hold ~1.0s.
Audio intent: quiet swell — the moment the pipeline pays off.
Audio-coupled idea: hushed warm swell under stat-card entry; faint counter tick under the $ count-up.
Music: 4dB swell aligned to the stat-card entry, back to bed by end.
Transition mood: soft crossfade → Scene 6

### Scene 6 — Punchline + CTA — 3.5s
**On screen.** Full-bleed cream. Fraunces italic display type, one line at a time, centered, ~72px `#1F1409`:
- **63M kirana stores.** (holds ~0.9s)
- **375M posters/year.** (fades under, ~0.9s)
- **All in the script they read.** (holds ~1.1s)

At 2.8s, all three lines fade down to opacity 0.15 and the `BazaarBoard` wordmark (Fraunces italic ~120px) settles center-frame with the URL `bazaarboard.vercel.app` in Plus Jakarta Sans ~28px below, and a small caption in ~16px `#1F1409/60`: `Google DeepMind Bangalore Hackathon · Idea 3`.

Sequential/interaction: yes — three punchline lines cascade at ~0.9s each, then wordmark landing.
Audio intent: land it, then breathe.
Audio-coupled idea: one warm note SFX on wordmark landing; music ducks 4dB over the URL.
Music: bed continues at ducked level, fades out over final 1.0s.
Transition mood: fade to canvas (0.8s) — end.

---

**Music mood for this video:** cinematic-warm, business-professional, ~110 BPM (`vol-12`).
**Audio summary:** Warm bed fades in over the typed hook, holds steady through logo and live-editor, stays quiet through the moat scene (visual carries it), swells 4dB under the "600 posters · $0.20" reveal, then ducks under the final wordmark + URL and fades to silence. SFX are sparse and motion-matched: key ticks on the typed input, 8 hushed card-drops on the language bloom, one soft underline whoosh on the moat, a faint counter tick on the cost count-up, one warm note on the final wordmark. Nothing sharp, nothing decorative, nothing that competes with the Indic type.

**Scene duration check:** 3.0 + 3.5 + 4.0 + 4.0 + 4.0 + 3.5 = **22.0s** ✓
