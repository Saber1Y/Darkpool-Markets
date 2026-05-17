import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

export default [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "dist/**",
      "next-env.d.ts",
      "eslint.config.mjs",
      "postcss.config.mjs",
      "next.config.ts",
      "tailwind.config.ts"
    ]
  },
  ...compat.extends("next/core-web-vitals", "next/typescript")
];
