import type { NextConfig } from "next";

// Security headers from the System Design doc, section 5.3.
// Next.js injects small inline scripts for hydration, so script-src keeps 'unsafe-inline'
// until we switch to nonce-based CSP in middleware.
// `next dev` evaluates code for fast refresh, so 'unsafe-eval' is added in development only; production
// builds don't need it and never get it.
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const devEval = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${devEval}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self' ${supabase}`.trim(),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const config: NextConfig = {
  reactStrictMode: true, 
  basePath: "/careerprep",
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Permissions-Policy", value: "microphone=(self), camera=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default config;
