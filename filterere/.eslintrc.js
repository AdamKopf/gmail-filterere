module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    "ecmaVersion": 2018,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "no-restricted-globals": ["error", "name", "length"],
    "prefer-arrow-callback": "off",
    "quotes": "off",
    "comma-dangle": "off",
    "require-jsdoc": "off",
    "max-len": "off",
    "object-curly-spacing": "off",
    "padded-blocks": "off",
    "indent": "off",
    "prefer-const": "off",
    "no-unused-vars": "warn",
    "arrow-parens": "off",
    "spaced-comment": "off",
    "no-async-promise-executor": "off",
    "space-before-function-paren": "off",
    "curly": "off",
  },
  overrides: [
    {
      files: ["**/*.spec.*"],
      env: {
        mocha: true,
      },
      rules: {},
    },
  ],
  globals: {},
};
