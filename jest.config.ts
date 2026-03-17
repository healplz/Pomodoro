import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  coverageProvider: "v8",
  collectCoverageFrom: [
    "src/lib/**/*.ts",
    "src/components/**/*.{ts,tsx}",
    "src/app/api/**/*.ts",
    "!src/**/*.d.ts",
  ],
};

export default createJestConfig(config);
