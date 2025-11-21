import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "*.config.js",
      "*.config.mjs",
    ],
  },
]);

export default eslintConfig;
