# BazaarBoard

**Live regional-language marketing-asset generator for kirana stores, street
vendors, and small businesses across India.** Type a product + price in
English or any Indian language; BazaarBoard renders print-ready posters,
WhatsApp Business status graphics, and Google Business Profile posts
live — powered by Gemini's Nano Banana 2 Lite for sub-4-second,
script-accurate image generation.

Built for the [Google DeepMind Bangalore Hackathon 2026](https://cerebralvalley.ai/e/google-deepmind-bangalore-hackathon).

## The wedge

- **63M kirana stores + 12M street vendors.** Most on WhatsApp Business.
- **22 official languages, 100+ commercial scripts.** Canva, Figma, and
  Photoshop templates handle Latin script well; every one of them breaks
  down on Devanagari kerning, Tamil ligatures, or Malayalam vowel signs.
- **NB2 Lite is the only image gen that makes live-render economically
  viable.** ~$0.034 per 1,000 images, sub-4-second latency, 1K
  resolution. Canva-speed for AI image generation.
- **Load-bearing Gemini.** Type a character, five posters re-render. Not
  a screen with an image gen call stapled on — the tool doesn't
  exist without high-throughput image gen.

## Prize-track fit

Idea 3 (High-Throughput Creative Workflows with NB2 Lite). The bar:
*"If your app is just a standard prompt-box-to-image generator, it's
not leveraging the speed of NB2 Lite. Show us automated, programmatic
pipelines, dynamic ad localizers, or interactive storytelling canvases
where real-time, high-volume generation is load-bearing to the user
experience."*

BazaarBoard is a **dynamic ad localizer** — every input change fans out
to N scripts × M surfaces in parallel. The pipeline is load-bearing.

## Stack

- Next.js 15 (App Router) + React 19
- TypeScript strict, `noUnusedLocals`, `noUnusedParameters`
- Tailwind CSS 3
- Noto Sans typography (Devanagari, Tamil, Bengali, Telugu, Kannada,
  Malayalam, Gurmukhi, Gujarati) + Fraunces + Plus Jakarta Sans
- Gemini Nano Banana 2 Lite for image generation (via same-origin
  `/api/generate` proxy — the Gemini key stays server-side; nothing
  ships in the client bundle)
- Vercel deploy target

## Run locally

```bash
npm install
cp .env.example .env.local        # then paste your GEMINI_API_KEY
npm run dev                       # http://localhost:3000
```

Pre-hackathon-day: the API key can be any Gemini-capable key. The
default model (`gemini-2.5-flash-image-preview`) works today.

Hackathon day: swap `NB2_MODEL=gemini-3.1-flash-lite-image` once the
day-of creds land.

## Repo layout

```
bazaarboard/
├── src/
│   ├── app/
│   │   ├── page.tsx              # the live editor + preview grid
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── api/generate/route.ts # server-side Gemini image call
│   └── lib/
│       └── languages.ts          # 9-language catalog with script hints
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
└── HACKATHON_DAY.md              # the 10:30 AM → 4:30 PM plan
```

## License

MIT. Public repo per hackathon rules.
