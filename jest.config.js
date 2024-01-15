// eslint-disable-next-line jsdoc/valid-types
/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  // [...]
  preset: 'ts-jest/presets/js-with-ts-esm', // or other ESM presets
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testPathIgnorePatterns: ["integration"],
  testEnvironment: "node",
  extensionsToTreatAsEsm: ['.ts'],

  transform: {
    // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
}
