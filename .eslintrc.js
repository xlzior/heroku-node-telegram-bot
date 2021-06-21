module.exports = {
  "env": {
    "commonjs": true,
    "es2021": true,
    "node": true,
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 12,
  },
  "rules": {
    "arrow-parens": ["error", "as-needed"],
    "comma-dangle": ["error", {
      "arrays": "always-multiline",
      "objects": "always-multiline",
      "imports": "always-multiline",
      "exports": "always-multiline",
      "functions": "ignore",
    }],
    "eol-last": ["error", "always"],
    "eqeqeq": ["error", "always"],
    "max-len": ["error", {
      "code": 100,
      "ignoreComments": true,
      "ignoreStrings": true,
      "ignoreTemplateLiterals": true,
    }],
    "no-bitwise": ["error"],
    "no-else-return": "error",
    "no-trailing-spaces": ["error"],
    "no-unused-expressions": ["error"],
    "no-useless-escape": ["error"],
    "no-var": "error",
    "object-shorthand": "error",
    "prefer-const": "error",
    "quotes": ["error"],
    "semi": ["error", "always"],
  },
};
