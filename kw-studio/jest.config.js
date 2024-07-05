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
  globals: {
    IS_REACT_ACT_ENVIRONMENT: true
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': '<rootDir>/node_modules/babel-jest',
    '^.+\\.css$': '<rootDir>/config/jest/cssTransform.js',
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '<rootDir>/config/jest/fileTransform.js'
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!lodash-es)',
    '<rootDir>/node_modules/(?!codemirror)',
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|ts|tsx)$',
    '^.+\\.module\\.(css|sass|scss)$'
  ],
  moduleNameMapper: {
    '^lodash-es$': 'lodash',
    '^react-native$': 'react-native-web',
    'd3-interpolate': '<rootDir>/src/tests/mockModules/d3Mock.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/assets/images(.*)$': '<rootDir>/src/assets/images$1',
    '^@/assets/style(.*)$': '<rootDir>/src/assets/style$1',
    '^@/assets/font/(.*)$': '<rootDir>/src/assets/font/iconfontMock.js',
    '^@/assets/graphIcons/iconfont.js$': '<rootDir>/src/assets/font/iconfontMock.js',
    '^@/assets/graphIcons/iconfont.json': '<rootDir>/src/assets/graphIcons/iconfont.json',
    '^@/assets/graphIconsMore/iconfont.js': '<rootDir>/src/assets/graphIcons/iconfont.json',
    '^@/pages(.*)$': '<rootDir>/src/pages$1',
    '^@/components(.*)$': '<rootDir>/src/components$1',
    '^@/utils(.*)$': '<rootDir>/src/utils$1',
    '^@/services(.*)$': '<rootDir>/src/services$1',
    '^@/locales(.*)$': '<rootDir>/src/locales$1',
    '^@/reduxConfig(.*)$': '<rootDir>/src/reduxConfig$1',
    '^@/theme(.*)$': '<rootDir>/src/theme$1',
    '^@/tests(.*)$': '<rootDir>/src/tests$1',
    '^@/hooks(.*)$': '<rootDir>/src/hooks$1',
    '^@/enums(.*)$': '<rootDir>/src/enums$1',
    '^@/version(.*)$': '<rootDir>/src/version$1',
    '^@/downLoad/(.*)$': '<rootDir>/src/downLoad/fileMock.js'
  },
  moduleFileExtensions: ['web.js', 'js', 'web.ts', 'ts', 'web.tsx', 'tsx', 'json', 'web.jsx', 'jsx', 'node'],
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
  coveragePathIgnorePatterns: [
    '<rootDir>/src/assets/*',
    '<rootDir>/src/components/*',
    '<rootDir>/src/downLoad/*',
    '<rootDir>/src/enums/*',
    '<rootDir>/src/hooks/*',
    '<rootDir>/src/locales/*',
    '<rootDir>/src/pages/Global/*',
    '<rootDir>/src/pages/CognitiveService/AnalysisServiceConfig/ConfigAndTest/GraphQuery/*',
    '<rootDir>/src/pages/ModelFactory/Prompt/PromptConfig/*',
    '<rootDir>/src/pages/ModelFactory/Prompt/PromptHome/*',
    '<rootDir>/src/pages/CognitiveSearchService/*',
    '<rootDir>/src/pages/DPApiService/*',
    '<rootDir>/src/pages/Home/Workflow/KnowledgeMap/*',
    '<rootDir>/src/pages/KnowledgeNetwork/ExploreGraph/*',
    '<rootDir>/src/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/*',
    '<rootDir>/src/pages/KnowledgeNetwork/OntologyLibrary/*',
    '<rootDir>/src/pages/SwaggerUI/*',
    '<rootDir>/src/reduxConfig/*',
    '<rootDir>/src/services/*',
    '<rootDir>/src/tests/*',
    '<rootDir>/src/theme/*',
    '<rootDir>/src/*mockData.(js|ts)$'
  ]
};
