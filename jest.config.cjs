module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }]
  },
  // Map relative .js imports to .ts source files during tests
  // No moduleNameMapper — avoid interfering with node_modules internal imports
  moduleNameMapper: {
    '^\\./database\\.js$': './database.ts',
    '^\\./knexfile\\.js$': './knexfile.ts',
    '^\\.\\./database\\.js$': '../database.ts',
    '^\\.\\./knexfile\\.js$': '../knexfile.ts'
  },
  testMatch: ['**/test/**/*.ts'],
  testPathIgnorePatterns: ['/dist/'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node']
};
