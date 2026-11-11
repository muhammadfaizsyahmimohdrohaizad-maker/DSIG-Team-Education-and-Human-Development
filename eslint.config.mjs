import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts", "lib/database.types.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Engines are pure: no database, network, AI or email imports (System Design 2.1).
    files: ["server/engines/**/*.ts"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: ["@/server/data/*", "@/server/llm/*", "@/server/email/*", "next/*", "@supabase/*"],
      }],
    },
  },
  {
    // Client code never reaches into the server layer.
    files: ["**/*-client.tsx", "components/**/*.tsx"],
    rules: { "no-restricted-imports": ["error", { patterns: ["@/server/*"] }] },
  },
];
