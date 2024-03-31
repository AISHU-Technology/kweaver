module.exports = {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-no-unsupported-browser-features', 'stylelint-order', 'stylelint-prettier'],
  ignoreFiles: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx', '**/*.html'],
  rules: {
    'no-descending-specificity': null,
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['export', 'import', 'global', 'local', 'external']
      }
    ],
    'selector-type-no-unknown': [
      true,
      {
        ignoreTypes: ['from']
      }
    ],
    'property-no-unknown': [
      true,
      {
        ignoreProperties: ['composes', 'compose-with', '/^my-/']
      }
    ],
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['value']
      }
    ],
    'no-empty-source': null,
    'selector-type-no-unknown': [true, { ignoreTypes: ['from'] }],
    'at-rule-no-unknown': [true, { ignoreAtRules: ['value'] }]
  }
};
