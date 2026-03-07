import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@openclaw-club/shared/(.*)$': '<rootDir>/../../packages/shared/$1',
    '^@openclaw-club/shared$': '<rootDir>/../../packages/shared/src',
  },
};

export default config;
