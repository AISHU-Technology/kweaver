const OFF = 'off';
const WARN = 'warn';
const ERROR = 'error';

module.exports = {
  overrides: [
    {
      files: ['*.js', '*.jsx'],
      parser: 'babel-eslint',
      extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:import/recommended',
        'plugin:jsx-a11y/recommended'
      ],
      plugins: [
        'react',
        'react-hooks',
        'import',
        'jsx-a11y'
        // 'jsdoc'
      ],
      rules: {
        'react/display-name': OFF,
        'jsx-a11y/anchor-is-valid': OFF,
        'jsx-a11y/click-events-have-key-events': OFF,
        'jsx-a11y/no-static-element-interactions': OFF,
        'jsx-a11y/no-noninteractive-element-interactions': OFF,
        'jsx-a11y/no-onchange': OFF,
        'require-atomic-updates': OFF,
        'no-unused-vars': [OFF, { vars: 'all', args: 'after-used', ignoreRestSiblings: false }],
        'react/prop-types': OFF,
        'no-unused-vars': OFF
      }
    },
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:import/recommended'
        // 'plugin:jsdoc/recommended'
        // 'plugin:jsx-a11y/recommended'
      ],
      plugins: ['@typescript-eslint', 'react', 'react-hooks', 'import'],
      rules: {
        '@typescript-eslint/camelcase': OFF,
        '@typescript-eslint/explicit-member-accessibility': [OFF],
        // '@typescript-eslint/indent': [ERROR, 2],
        // 'react/jsx-indent': [ERROR, 2],
        '@typescript-eslint/no-angle-bracket-type-assertion': OFF,
        '@typescript-eslint/no-triple-slash-reference': OFF,
        '@typescript-eslint/prefer-interface': OFF,
        '@typescript-eslint/no-object-literal-type-assertion': OFF,
        'object-curly-spacing': OFF,
        '@typescript-eslint/no-var-requires': OFF,
        '@typescript-eslint/no-explicit-any': OFF,
        '@typescript-eslint/no-unused-vars': [OFF, { vars: 'all', args: 'after-used', ignoreRestSiblings: false }],
        'no-unused-vars': [OFF, { vars: 'all', args: 'after-used', ignoreRestSiblings: false }],
        'react/prop-types': OFF,
        '@typescript-eslint/explicit-function-return-type': OFF,
        'react/display-name': OFF,
        '@typescript-eslint/no-use-before-define': OFF,
        '@typescript-eslint/no-empty-function': OFF,
        '@typescript-eslint/no-non-null-assertion': OFF
      }
    }
  ],
  env: {
    browser: true,
    node: true,
    es6: true,
    jest: true
  },
  // parser: 'babel-eslint',
  globals: {
    MOCK: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
      experimentalObjectRestSpread: true
    }
  },

  settings: {
    react: {
      version: 'detect'
    },
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }
    }
  },

  rules: {
    // Possible Errors
    // jsdoc
    // 'jsdoc/check-alignment': ERROR, // 对齐
    // 'jsdoc/check-examples': ERROR,
    // 'jsdoc/check-indentation': ERROR,
    // 'jsdoc/check-param-names': ERROR,
    // 'jsdoc/check-syntax': ERROR,
    // 'jsdoc/check-tag-names': ERROR,
    // 'jsdoc/check-types': ERROR,
    // 'jsdoc/implements-on-classes': ERROR,
    // 'jsdoc/match-description': ERROR,
    // 'jsdoc/newline-after-description': ERROR,
    // 'jsdoc/no-types': ERROR,
    // 'jsdoc/no-undefined-types': ERROR,
    // 'jsdoc/require-description': ERROR,
    // 'jsdoc/require-description-complete-sentence': ERROR,
    // 'jsdoc/require-example': ERROR,
    // 'jsdoc/require-hyphen-before-param-description': ERROR,
    // 'jsdoc/require-jsdoc': ERROR,
    // 'jsdoc/require-param': ERROR,
    // 'jsdoc/require-param-description': ERROR,
    // 'jsdoc/require-param-name': ERROR,
    // 'jsdoc/require-param-type': ERROR,
    // 'jsdoc/require-returns': ERROR,
    // 'jsdoc/require-returns-check': ERROR,
    // 'jsdoc/require-returns-description': ERROR,
    // 'jsdoc/require-returns-type': ERROR,
    // 'jsdoc/valid-types': ERROR,
    // 'no-await-in-loop': ERROR,
    'no-console': [WARN, { allow: [WARN, ERROR] }],
    'no-debugger': WARN,
    'no-prototype-builtins': ERROR,
    'no-template-curly-in-string': ERROR,

    // Best Practices
    'no-async-promise-executor': OFF,
    'array-callback-return': [ERROR, { allowImplicit: true }],
    curly: [WARN, 'multi-line'],
    'default-case': [WARN, { commentPattern: '^no default$' }],
    'dot-location': [WARN, 'property'],
    'dot-notation': [WARN, { allowKeywords: true }],
    eqeqeq: ERROR,
    'guard-for-in': ERROR,
    'no-alert': WARN,
    'no-caller': ERROR,
    'no-else-return': [ERROR, { allowElseIf: true }],
    'no-empty-function': [ERROR, { allow: ['arrowFunctions', 'functions', 'methods'] }],
    'no-eval': ERROR,
    'no-extend-native': ERROR,
    'no-extra-bind': ERROR,
    'no-extra-label': ERROR,
    'no-floating-decimal': WARN,
    'no-implied-eval': ERROR,
    'no-iterator': ERROR,
    'no-labels': [ERROR, { allowLoop: false, allowSwitch: false }],
    'no-lone-blocks': WARN,
    'no-loop-func': ERROR,
    'no-multi-spaces': [WARN, { ignoreEOLComments: false }],
    'no-multi-str': ERROR,
    'no-new': ERROR,
    'no-new-func': ERROR,
    'no-new-wrappers': ERROR,
    'no-octal-escape': ERROR,
    'no-param-reassign': [ERROR, { props: false }],
    'no-proto': ERROR,
    'no-return-assign': ERROR,
    // 'no-return-await': ERROR,
    'no-script-url': ERROR,
    'no-self-compare': ERROR,
    'no-sequences': ERROR,
    'no-throw-literal': ERROR,
    // 'no-unused-expressions': [WARN, { allowShortCircuit: true, allowTernary: true }],
    'no-useless-concat': WARN,
    'no-useless-return': WARN,
    'no-void': ERROR,
    'no-with': ERROR,
    'prefer-promise-reject-errors': [OFF, { allowEmptyReject: true }],
    radix: OFF,
    'wrap-iife': [ERROR, 'outside', { functionPrototypeMethods: false }],
    yoda: ERROR,

    // Variables
    'no-shadow-restricted-names': ERROR,
    'no-undef-init': WARN,
    // 'no-unused-vars': [WARN, { vars: 'all', args: 'after-used', ignoreRestSiblings: true }],
    'no-use-before-define': [OFF, { functions: false, classes: true, variables: false }],

    // Node.js and CommonJS
    'no-new-require': ERROR,
    'no-path-concat': ERROR,

    // Stylistic Issues
    'array-bracket-spacing': [WARN, 'never'],
    'block-spacing': [WARN, 'always'],
    'brace-style': [WARN, '1tbs', { allowSingleLine: true }],
    // camelcase: [OFF, { properties: 'never' }],
    // 'comma-dangle': [WARN, 'never'],
    'comma-spacing': [WARN, { before: false, after: true }],
    'computed-property-spacing': [WARN, 'never'],
    // 'eol-last': [ERROR, 'always'],
    'func-style': [WARN, 'declaration', { allowArrowFunctions: true }],
    'jsx-quotes': [WARN, 'prefer-double'],
    'key-spacing': [WARN, { beforeColon: false, afterColon: true }],
    'keyword-spacing': [
      WARN,
      {
        before: true,
        after: true,
        overrides: {
          return: { after: true },
          throw: { after: true },
          case: { after: true }
        }
      }
    ],
    // 'lines-between-class-members': [WARN, 'always', { exceptAfterSingleLine: false }],
    'max-len': [
      ERROR,
      120,
      2,
      {
        ignoreUrls: true,
        ignoreComments: false,
        ignoreRegExpLiterals: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true
      }
    ],
    'max-lines': [WARN, { max: 500, skipBlankLines: true, skipComments: true }],
    'max-params': [WARN, 5],
    'new-cap': [
      ERROR,
      {
        newIsCap: true,
        newIsCapExceptions: [],
        capIsNew: false,
        capIsNewExceptions: ['Immutable.Map', 'Immutable.Set', 'Immutable.List']
      }
    ],
    'new-parens': ERROR,
    'newline-per-chained-call': [OFF, { ignoreChainWithDepth: 4 }],
    'no-array-constructor': WARN,
    'no-continue': WARN,
    'no-lonely-if': WARN,
    'no-multi-assign': [ERROR],
    'no-multiple-empty-lines': [WARN, { max: 1, maxEOF: 0 }],
    'no-new-object': WARN,
    'no-trailing-spaces': [ERROR, { skipBlankLines: false, ignoreComments: false }],
    'no-unneeded-ternary': [ERROR, { defaultAssignment: false }],
    'no-whitespace-before-property': ERROR,
    'nonblock-statement-body-position': [ERROR, 'beside', { overrides: {} }],
    'object-curly-newline': [WARN, { multiline: true, consistent: true }],
    'object-curly-spacing': [WARN, 'always'],
    'object-property-newline': [WARN, { allowAllPropertiesOnSameLine: true }],
    'one-var': [ERROR, 'never'],
    'operator-assignment': [ERROR, 'always'],
    'padded-blocks': [ERROR, { blocks: 'never', classes: 'never', switches: 'never' }],
    // 'padding-line-between-statements': [
    //   WARN,
    //   {
    //     blankLine: 'always',
    //     prev: ['const', 'let', 'var'],
    //     next: '*'
    //   },
    //   {
    //     blankLine: 'any',
    //     prev: ['const', 'let', 'var'],
    //     next: ['const', 'let', 'var']
    //   },
    //   { blankLine: 'always', prev: 'directive', next: '*' },
    //   { blankLine: 'any', prev: 'directive', next: 'directive' },
    //   { blankLine: 'always', prev: '*', next: 'return' }
    // ],
    'quote-props': [WARN, 'as-needed', { keywords: false, unnecessary: true, numbers: false }],
    quotes: [WARN, 'single', { avoidEscape: true }],
    // semi: [WARN, 'always'],
    'semi-spacing': [ERROR, { before: false, after: true }],
    'semi-style': [ERROR, 'last'],
    'space-before-blocks': WARN,
    'space-in-parens': [WARN, 'never'],
    'space-infix-ops': WARN,
    'space-unary-ops': [WARN, { words: true, nonwords: false, overrides: {} }],
    'spaced-comment': [WARN, 'always', { exceptions: ['-', '+'], markers: ['=', '!'] }],
    'switch-colon-spacing': [WARN, { after: true, before: false }],
    'template-tag-spacing': [ERROR, 'never'],
    'unicode-bom': [ERROR, 'never'],

    // ECMAScript 6
    'arrow-parens': [WARN, 'as-needed'],
    'arrow-spacing': [WARN, { before: true, after: true }],
    'generator-star-spacing': [WARN, { before: false, after: true }],
    'no-useless-computed-key': WARN,
    'no-useless-constructor': ERROR,
    'no-useless-rename': [
      ERROR,
      {
        ignoreDestructuring: false,
        ignoreImport: false,
        ignoreExport: false
      }
    ],
    'no-var': ERROR,
    'object-shorthand': [WARN, 'always', { ignoreConstructors: false, avoidQuotes: true }],
    'prefer-arrow-callback': WARN,
    'prefer-const': WARN,
    // 'prefer-destructuring': [WARN, { array: false, object: true }, { enforceForRenamedProperties: false }],
    'prefer-numeric-literals': ERROR,
    'prefer-rest-params': WARN,
    'prefer-spread': WARN,
    'prefer-template': WARN,
    'rest-spread-spacing': [WARN, 'never'],
    'symbol-description': WARN,
    'template-curly-spacing': WARN,
    'yield-star-spacing': [WARN, 'after'],

    // eslint-plugin-react
    'react/default-props-match-prop-types': [OFF, { allowRequiredDefaults: false }],
    'react/display-name': [OFF, { ignoreTranspilerName: false }],
    'react/no-access-state-in-setstate': OFF,
    'react/no-array-index-key': OFF, // TODO: 解决方法
    'react/no-redundant-should-component-update': OFF,
    'react/no-typos': OFF,
    'react/no-this-in-sfc': OFF,
    'react/no-unsafe': OFF,
    'react/no-unused-prop-types': [OFF, { customValidators: [], skipShapeProps: true }],
    'react/no-unused-state': OFF, // TODO: 与生命周期`getDerivedStateFromProps`冲突
    'require-atomic-updates': OFF,
    'react/prefer-es6-class': [OFF, 'always'],
    'react/prefer-stateless-function': [OFF, { ignorePureComponents: true }],
    'react/sort-comp': [
      OFF,
      {
        order: [
          'static-methods',
          'instance-variables',
          'lifecycle',
          'instance-methods',
          'everything-else',
          'rendering'
        ],
        groups: {
          lifecycle: [
            'propTypes',
            'statics',
            'defaultProps',
            'constructor',
            'state',
            'getDerivedStateFromProps',
            'UNSAFE_componentWillMount',
            'componentDidMount',
            'UNSAFE_componentWillReceiveProps',
            'shouldComponentUpdate',
            'UNSAFE_componentWillUpdate',
            'getSnapshotBeforeUpdate',
            'componentDidUpdate',
            'componentDidCatch',
            'componentWillUnmount'
          ]
        }
      }
    ],
    'react/style-prop-object': OFF,
    'react/void-dom-elements-no-children': OFF,
    'react/jsx-boolean-value': [OFF, 'never', { always: [] }],
    'react/jsx-closing-bracket-location': [OFF, 'line-aligned'],
    'react/jsx-curly-spacing': [OFF, 'never', { allowMultiline: true }],
    'react/jsx-equals-spacing': [OFF, 'never'],
    'react/jsx-no-bind': [
      OFF,
      {
        ignoreRefs: true,
        allowArrowFunctions: true,
        ignoreDOMComponents: true
      }
    ],
    'react/jsx-pascal-case': [OFF, { allowAllCaps: true, ignore: [] }],
    'react/jsx-props-no-multi-spaces': OFF,

    // eslint-plugin-react-hooks
    'react-hooks/rules-of-hooks': OFF,
    'react-hooks/exhaustive-deps': OFF,

    'import/no-unresolved': [OFF, { ignore: ['^@/', 'workshop-framework'] }],

    'import/no-absolute-path': OFF,
    'import/no-webpack-loader-syntax': OFF,
    'import/no-self-import': OFF,
    'import/no-cycle': [OFF, { maxDepth: Infinity }],
    'import/no-useless-path-segments': OFF,
    'import/no-mutable-exports': OFF,
    'import/no-amd': OFF,
    'import/first': OFF,
    'import/extensions': [OFF, 'ignorePackages', { js: 'never', jsx: 'never' }],
    'import/order': OFF,
    'import/newline-after-import': OFF,
    'import/no-named-default': OFF,

    // eslint-plugin-jsx-a11y
    'jsx-a11y/anchor-is-valid': OFF,
    'jsx-a11y/click-events-have-key-events': OFF,
    'jsx-a11y/no-static-element-interactions': OFF,
    'jsx-a11y/no-onchange': OFF
  }
};
