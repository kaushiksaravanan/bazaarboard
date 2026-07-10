import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        // Peggy-adjacent — Fraunces for display, Plus Jakarta for body,
        // Noto Sans for the Indic script fallbacks. Judges will see
        // real script rendering, not tofu boxes.
        display: ["'Fraunces'", "serif"],
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        devanagari: ["'Noto Sans Devanagari'", "sans-serif"],
        tamil: ["'Noto Sans Tamil'", "sans-serif"],
        bengali: ["'Noto Sans Bengali'", "sans-serif"],
        telugu: ["'Noto Sans Telugu'", "sans-serif"],
        kannada: ["'Noto Sans Kannada'", "sans-serif"],
        malayalam: ["'Noto Sans Malayalam'", "sans-serif"],
        gurmukhi: ["'Noto Sans Gurmukhi'", "sans-serif"],
        gujarati: ["'Noto Sans Gujarati'", "sans-serif"],
      },
      colors: {
        // Tangerine — India-market retail-signage warmth. Not Peggy's
        // cornflower blue on purpose — this is a NEW project.
        bazaar: {
          ink: "#1F1409",
          canvas: "#FFF8EE",
          tangerine: "#F26B1F",
          saffron: "#FFB43C",
          leaf: "#2E7B4E",
          coral: "#E43C4B",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
