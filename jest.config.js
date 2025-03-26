module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverage: false,
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "lib/**/*.ts",
    "!lib/**/__tests__/**",
    "!**/node_modules/**",
  ],
  transformIgnorePatterns: ["node_modules/(?!(chalk|other-esm-modules)/)"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": [
      "babel-jest",
      { presets: ["@babel/preset-env", "@babel/preset-typescript"] },
    ],
  },
};
