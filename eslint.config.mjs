import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // 添加 prettier-config（关闭与 Prettier 冲突的规则）
  {
    name: "prettier-config",
    rules: prettierConfig.rules,
  },

  // 可选：将 Prettier 错误显示为 ESLint 错误（配合 eslint --fix 使用）
  {
    name: "plugin:prettier/recommended",
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "error",
    },
  },
];

export default eslintConfig;
