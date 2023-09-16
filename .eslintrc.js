module.exports = {
  plugins: [],
  extends: ["eslint:recommended", "prettier"],
  env: { node: true, es2020: true },
  overrides: [
    {
      files: ["src/**/*.ts", "examples/**/*.ts"],
      extends: [
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier",
      ],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        sourceType: "module",
        project: "./tsconfig.json",
      },
      rules: {},
    },
  ],
};
