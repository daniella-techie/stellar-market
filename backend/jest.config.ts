import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  clearMocks: true,
  transform: {
    "^.+\\.[tj]sx?$": ["ts-jest", { diagnostics: false, allowJs: true }],
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(@scure|@otplib|otplib)/)",
  ],
};

export default config;
