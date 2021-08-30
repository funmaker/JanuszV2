// eslint-disable-next-line import/no-commonjs
module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
  ],
  globals: {
    __: false,
  },
  parser: "babel-eslint",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
      legacyDecorators: true,
    },
    ecmaVersion: 2018,
    sourceType: "module",
  },
  plugins: [
    "react",
    "import",
    "indent-empty-lines",
  ],
  rules: {
    "array-bracket-spacing": [
      "warn",
      "never",
    ],
    "arrow-spacing": "warn",
    "block-spacing": [
      "warn",
      "always",
    ],
    "comma-dangle": [
      "warn",
      "always-multiline",
    ],
    "comma-spacing": "warn",
    "comma-style": "warn",
    "computed-property-spacing": "warn",
    "eol-last": "warn",
    "eqeqeq": "off",
    "func-call-spacing": "warn",
    "generator-star-spacing": [
      "warn",
      {
        after: true,
        before: false,
        method: "neither",
      },
    ],
    "import/export": "warn",
    "import/extensions": [
      "error",
      "never",
    ],
    "import/named": "error",
    "import/namespace": "error",
    "import/newline-after-import": "warn",
    "import/no-absolute-path": "error",
    "import/no-amd": "warn",
    "import/no-commonjs": "warn",
    "import/no-cycle": "off", // FIXME
    "import/no-deprecated": "warn",
    "import/no-duplicates": "warn",
    "import/no-dynamic-require": "error",
    "import/no-extraneous-dependencies": "warn",
    "import/no-self-import": "error",
    "import/no-useless-path-segments": "warn",
    "import/order": "warn",
    "indent": [
      "warn",
      2,
      {
        ArrayExpression: "first",
        CallExpression: {
          arguments: "first",
        },
        FunctionDeclaration: {
          parameters: "first",
        },
        FunctionExpression: {
          parameters: "first",
        },
        ignoredNodes: [
          "JSXElement",
          "JSXElement *",
          "JSXAttribute",
        ],
        ImportDeclaration: "first",
        MemberExpression: "off",
        ObjectExpression: "first",
        SwitchCase: 1,
        VariableDeclarator: {
          const: 3,
          let: 2,
          var: 2,
        },
      },
    ],
    "indent-empty-lines/indent-empty-lines": ["warn", 2],
    "key-spacing": "warn",
    "keyword-spacing": [
      "warn",
      {
        overrides: {
          catch: {
            after: false,
          },
          for: {
            after: false,
          },
          if: {
            after: false,
          },
          switch: {
            after: false,
          },
          while: {
            after: false,
          },
        },
      },
    ],
    "linebreak-style": "error",
    "lines-between-class-members": [
      "warn",
      "always",
      {
        exceptAfterSingleLine: true,
      },
    ],
    "no-console": "off",
    "no-empty": "off",
    "no-ex-assign": "off",
    "no-inner-declarations": "off",
    "no-lonely-if": "off",
    "no-mixed-spaces-and-tabs": "warn",
    "no-multiple-empty-lines": [
      "warn",
      {
        max: 2,
        maxBOF: 1,
        maxEOF: 1,
      },
    ],
    "no-prototype-builtins": "off",
    "no-trailing-spaces": [
      "warn",
      {
        skipBlankLines: true,
        ignoreComments: true,
      },
    ],
    "no-unexpected-multiline": "warn",
    "no-unneeded-ternary": "warn",
    "no-unused-vars": "off",
    "no-useless-computed-key": "warn",
    "no-useless-constructor": "warn",
    "no-useless-rename": "warn",
    "no-var": "warn",
    "no-whitespace-before-property": "warn",
    "nonblock-statement-body-position": "warn",
    "object-curly-newline": [
      "warn",
      {
        consistent: true,
      },
    ],
    "object-curly-spacing": [
      "warn",
      "always",
    ],
    "object-shorthand": "warn",
    "operator-assignment": "warn",
    "padded-blocks": [
      "warn",
      "never",
    ],
    "prefer-arrow-callback": "warn",
    "prefer-const": [
      "warn",
      {
        destructuring: "all",
      },
    ],
    "prefer-rest-params": "warn",
    "prefer-spread": "warn",
    "quote-props": [
      "warn",
      "consistent-as-needed",
    ],
    "quotes": "off",
    "react/jsx-boolean-value": "warn",
    "react/jsx-closing-bracket-location": [
      "warn",
      "after-props",
    ],
    "react/jsx-closing-tag-location": "warn",
    "react/jsx-curly-brace-presence": "warn",
    "react/jsx-curly-spacing": "warn",
    "react/jsx-equals-spacing": "warn",
    "react/jsx-filename-extension": "warn",
    "react/jsx-indent": [
      "warn",
      2,
    ],
    "react/jsx-indent-props": [
      "warn",
      "first",
    ],
    "react/jsx-key": "warn",
    "react/jsx-pascal-case": "warn",
    "react/jsx-props-no-multi-spaces": "warn",
    "react/jsx-tag-spacing": "warn",
    "react/no-access-state-in-setstate": "warn",
    "react/no-this-in-sfc": "error",
    "react/no-typos": "warn",
    "react/prop-types": [
      "error",
      {
        skipUndeclared: true,
      },
    ],
    "react/sort-comp": "warn",
    "react/void-dom-elements-no-children": "warn",
    "rest-spread-spacing": "warn",
    "semi": "warn",
    "semi-spacing": "warn",
    "semi-style": "warn",
    "space-before-blocks": "warn",
    "space-before-function-paren": [
      "warn",
      {
        anonymous: "never",
        asyncArrow: "always",
        named: "never",
      },
    ],
    "space-in-parens": "warn",
    "space-infix-ops": "warn",
    "space-unary-ops": "warn",
    "switch-colon-spacing": "warn",
    "template-curly-spacing": "warn",
    "yield-star-spacing": "warn",
  },
  settings: {
    react: {
      version: "16.2",
    },
  },
};
