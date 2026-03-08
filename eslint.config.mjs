import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      "react/display-name": "off",
    },
  },
  {
    files: [
      "src/components/storage/index.tsx",
      "src/components/ui/SpinnerbLoader/index.tsx",
      "src/components/ui/input-group.tsx",
      "src/lib/utils.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "src/generated/**",
    "prisma/migrations/**",
  ]),
]);
