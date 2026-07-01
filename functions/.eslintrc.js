module.exports = {
  env: { es6: true, node: true },
  extends: ["eslint:recommended"],
  parserOptions: { ecmaVersion: 2020 },
  rules: { "no-restricted-globals": ["error", "name", "length"], "prefer-arrow-callback": "error", "quotes": ["error", "double", { avoidEscape: true }] },
};
