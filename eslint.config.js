import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      // Código gerado (shadcn/ui) e código morto identificado na auditoria — FASE 2c/2d
      "src/components/ui/**",
      "src/components/ProductsSection.tsx",
      "src/components/CartDrawer.tsx",
      "src/pages/PeliculasPage.tsx",
      "src/pages/ProductPage.tsx",
      "src/components/FilmsTable.tsx",
      "src/components/MaiaChat.tsx",
    ],
  },
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
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
);
