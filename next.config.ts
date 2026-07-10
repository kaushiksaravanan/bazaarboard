import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server-side env vars used by /api/generate. Never prefix with
  // NEXT_PUBLIC_ — the Gemini key MUST stay server-side.
  //   GEMINI_API_KEY: day-of hackathon credential
  //   NB2_MODEL: override for the image-gen model id (defaults set in route)
  experimental: {},
};

export default nextConfig;
