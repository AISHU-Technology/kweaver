const PATH_ALIAS = [
  'pages',
  'components',
  'utils',
  'services',
  'locales',
  'graphQLSerVer',
  'reduxConfig',
  'theme',
  'tests',
  'hooks',
  'enums',
  'version',
  'vendors'
].reduce((res, path) => ({ ...res, [`^@/${path}(.*)$`]: `<rootDir>/src/${path}$1` }), {});

module.exports = {
  verbose: true,
  roots: ['<rootDir>/src'],
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.d.ts'],
  setupFiles: ['react-app-polyfill/jsdom'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*[^mockData].{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}'
  ],
  testEnvironment: 'jest-environment-jsdom-fourteen',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': '<rootDir>/node_modules/babel-jest',
    '^.+\\.css$': '<rootDir>/config/jest/cssTransform.js',
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '<rootDir>/config/jest/fileTransform.js'
  },
  transformIgnorePatterns: ['[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$', '^.+\\.module\\.(css|sass|scss)$'],
  modulePaths: [],
  moduleNameMapper: {
    '^react-native$': 'react-native-web',
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    ...PATH_ALIAS,
    '^@/assets/images(.*)$': '<rootDir>/src/assets/images$1',
    '^@/assets/style(.*)$': '<rootDir>/src/assets/style$1',
    '^@/assets/font/(.*)$': '<rootDir>/src/assets/font/iconfontMock.js',
    '^@/downLoad/(.*)$': '<rootDir>/src/downLoad/fileMock.js'
  },
  moduleFileExtensions: ['web.js', 'js', 'web.ts', 'ts', 'web.tsx', 'tsx', 'json', 'web.jsx', 'jsx', 'node'],
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],

  // 忽略某些文件的测试
  coveragePathIgnorePatterns: [
    '<rootDir>/src/assets/*',
    '<rootDir>/src/services/*',
    '<rootDir>/src/locales/*',
    '<rootDir>/src/reduxConfig/*',
    '<rootDir>/src/enums/*',
    '<rootDir>/src/theme/*',
    '<rootDir>/src/tests/*',
    '<rootDir>/src/graphQLSerVer*',
    '<rootDir>/src/pages/SwaggerUI*',
    '<rootDir>/src/vendors/*'
  ]
};
