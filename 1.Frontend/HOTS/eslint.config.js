import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import hots from "@hots/eslint-config";

export default tseslint.config(
  { ignores: ["dist"] },
  ...hots.base.map(config => ({ ...config, files: ["src/platform/**/*.{ts,tsx}", "src/components/forms/shared/**/*.{ts,tsx}", "src/components/report/reportAdapter.ts", "src/components/report/DataTableReport.tsx"] })),
  ...hots.react.map(config => ({ ...config, files: ["src/platform/**/*.tsx", "src/components/forms/shared/**/*.tsx", "src/components/report/DataTableReport.tsx"] })),
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
    },
  }
);
