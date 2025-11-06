export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/__tests__/**/*.test.mjs', '**/?(*.)+(spec|test).mjs'],
  collectCoverageFrom: [
    'src/**/*.mjs',
    '!src/server.mjs',
    '!src/app.mjs',
  ],
  coverageThreshold: {
    global: {
      branches: 68,
      functions: 88,
      lines: 81,
      statements: 81,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.mjs'],
  forceExit: true,
  testTimeout: 10000,
};
