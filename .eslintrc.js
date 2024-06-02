/* eslint-env node */
module.exports = {
    settings: {
    },
    ignorePatterns: [
      "*.html",
      "*.css",
      "*.txt",
      "*.bat",
      "*.py",
      "*.json",
      "*.md",
      "*.png",
      "*.ico",
      "unused_code",
      "tmp",
      "dist",
      "node_modules",
      ".git",
      ".vscode",
      "data",
      "3dparty"
    ],
    env: {
        webextensions: false,
        browser: false,
        es2021: true,
    },
    extends: [
        "eslint:recommended"
    ],
    root: true,
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module"
    },
    rules: {
      /*"no-shadow": [
        "warnings", 
        { "builtinGlobals": false, "hoist": "functions", "allow": [], "ignoreOnInitialization": false }
      ],*/
      "no-func-assign":"error",
      "no-unused-vars": ["warn",   { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      "no-var":"off",
      "prefer-const":"warn"
    },
    "overrides": [
      {
        "files": ["**/*.ts"],
        parserOptions: {
          project: true,
          tsconfigRootDir: __dirname,
        },        
        parser: '@typescript-eslint/parser',
        plugins: ['@typescript-eslint'],
        extends: [
          "plugin:import/typescript",
          "plugin:import/recommended",
          'eslint:recommended', 
          'plugin:@typescript-eslint/recommended',
        //  'plugin:@typescript-eslint/recommended-requiring-type-checking'
        ],
        rules: {
          "quotes": [2, "single", { "avoidEscape": true }],
          "no-empty-pattern":"off",
          "import/no-unresolved":"warn",
          "no-use-before-define":"warn",
          "no-self-compare":"warn",
          "no-unused-expressions":"warn",
         "max-params":"warn",
         "no-param-reassign":"off", //cant have that because this is how components work, ctl chanhed values and thats ok
         "logical-assignment-operators":"warn",
          "no-func-assign":"warn",
          "no-var":"off", //todo: restore
          "prefer-const":"warn",
          "import/no-self-import":"warn",
          "import/no-cycle":"warn",
          "@typescript-eslint/ban-ts-comment": "off",
          "@typescript-eslint/no-unused-vars": ["warn",   { 
            "argsIgnorePattern": "^_",
            "varsIgnorePattern": "^(_|debug_)",
            "caughtErrorsIgnorePattern": "^_"
          }],
          "@typescript-eslint/ban-types": "error",
          "@typescript-eslint/no-explicit-any":"off",
          "@typescript-eslint/no-non-null-assertion": "off"
        },
      }
    ]
};
