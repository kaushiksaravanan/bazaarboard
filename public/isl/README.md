# BazaarBoard ISL Lexicon (seed)

A 30-sign gloss dataset covering shop-floor vocabulary in Indian Sign Language: verbs (SELL, BUY, EAT...), pantry items (MANGO, RICE, MILK...), numbers (TEN, FIFTY, HUNDRED...), and modifiers (GOOD, HOT, NEW). Each entry carries the gloss token, an English label, a Hindi (Devanagari) label, and a nullable `videoUrl`. UIs render the gloss text when no clip is available.

## License

CC-BY-4.0. Reuse freely with attribution to the BazaarBoard project.

## Source attribution

This seed ships gloss-only. Live scrapes of `indiansignlanguage.org`, `dictionary.islrtc.nic.in`, and `talkingfingers.com` on 2026-07-11 either sat behind Cloudflare challenges, failed DNS, or exposed no downloadable MP4 assets. Downstream consumers may bring their own video CDN, generative sign renderer, or licensed clip pack and update `videoUrl` accordingly.

## Contributing

To add a clip for a sign:

1. Confirm the source's license permits redistribution.
2. Drop `<GLOSS>.mp4` (< 500 KB, ~2 s, waist-up, plain backdrop) into this directory.
3. Update the matching entry in `lexicon.json`: set `videoUrl`, `duration`, and `source`.
4. Record the source in `sourceAttribution`.

## Scaling to 5,000+ signs

The schema is intentionally flat: adding rows is a JSON append. For a production dictionary, split by category (`signs/verbs.json`, `signs/food.json`, ...) and generate a merged manifest at build time. Videos should move to a CDN with hashed filenames; keep `lexicon.json` as pure metadata.

## Contact

File issues in the BazaarBoard repo.
