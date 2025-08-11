import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import { writeFileSync } from "fs";

function delete_uneeded(key, value) {
  if (['@typescript-eslint'].includes(key))
    return '#deleted:' + Object.keys(value).join(',')
  return value
}
function write_config(obj) {
  const all = JSON.stringify(obj,delete_uneeded, 2);
  writeFileSync("eslint.config.inspect.json", all);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});
const check_import = true//very slow, so turn on when needed
const import_extend = function () {
  if (!check_import)
    return []
  return [
    "plugin:import-x/typescript",
    "plugin:import-x/recommended"
  ]
}()
const import_rules = function () {
  if (!check_import)
    return {}
  return {
    "import-x/no-unresolved": "off",
    "import-x/no-named-as-default-member":"off",
    "import-x/no-named-as-default":"off",
    "import-x/namespace":"off",
    'import-x/no-cycle': ['error', {
      ignoreExternal: true,  // Skip checking external dependencies - not working due to bug in the plugin
    }],
    "import-x/named": "off",
    "import-x/default": "off",
  }
}()

const ans=[{
  ignores: [
    "**/dist",
    "**/node_modules",
    "**/.git",
  ],
}, ...fixupConfigRules(compat.extends(

  "eslint:recommended",
  ...import_extend,
  "eslint:recommended",
  "plugin:@typescript-eslint/recommended",
)), {
  plugins: {
    "@typescript-eslint": fixupPluginRules(typescriptEslint),
  },

  languageOptions: {
    globals: {
      ...globals.webextensions,
      ...globals.browser,
    },

    parser: tsParser,
    ecmaVersion: 2022,
    sourceType: "module",
  },

  settings: {},

  rules: {
    "eqeqeq": ["error", "always", { "null": "ignore" }],
    'no-extend-native': 'warn',
    "no-unused-vars": "off",
    ...import_rules,
    "prefer-const": "warn",
    "object-shorthand": "warn",
    "no-inner-declarations": "warn",
    "no-duplicate-imports": "warn",
    "-labels": "off",
    "no-empty-pattern": "off",
    "no-use-before-define": "off",
    "no-self-compare": "warn",
    "no-unused-expressions": "warn",
    "max-params": "warn",
    "no-param-reassign": "off",
    "logical-assignment-operators": "warn",
    "no-func-assign": "warn",
    "no-var": "warn",
    "no-loop-func": "warn",


    "@typescript-eslint/ban-ts-comment": "off",

    "@typescript-eslint/no-unused-vars": ["warn", {
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^(_|debug_)",
      caughtErrorsIgnorePattern: "^_",
    }],

    //"@typescript-eslint/ban-types": "error",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-namespace": "off",
    "@typescript-eslint/no-empty-object-type": "warn",
    "@typescript-eslint/no-unsafe-function-type": "warn",
    "@typescript-eslint/no-wrapper-object-types": "warn",
    "@typescript-eslint/no-use-before-define": ["error", {
      ignoreTypeReferences: false,
      "variables": false,
    }]
  },
}, {
  files: ["**/*.js"],
  rules: {
    "logical-assignment-operators": "off",
    "no-var": "off",
    "@typescript-eslint/no-use-before-define": "off",
    "no-debugger": "off",
    "max-params": "off",
    "no-unreachable": "off",
  },
}];
const debug_mode=false //change to true to see debug file with all elint setting in json format
if (debug_mode)
  write_config(ans)
export default ans