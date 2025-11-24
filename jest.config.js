const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  // Performance optimizations
  maxWorkers: 4, // Limit workers for better Next.js compatibility and memory usage
  testTimeout: 10000, // 10 seconds - fail slow tests faster
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@clerk|@testing-library))', // Skip transforming node_modules except ESM packages and specific libs
  ],
  clearMocks: true, // Automatically clear mock calls between tests
  resetMocks: true, // Automatically reset mock state between tests
  cacheDirectory: '<rootDir>/.jest-cache', // Explicit cache directory
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
