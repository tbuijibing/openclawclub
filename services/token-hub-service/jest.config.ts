import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  collectCoverageFrom: ['**/*.ts', '!**/*.spec.ts', '!**/*.module.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@openclaw-club/shared(.*)$': '<rootDir>/../../../packages/shared/src$1',
    '^@openclaw-club/database(.*)$': '<rootDir>/../../../packages/database/src$1',
  },
};

export default config;
