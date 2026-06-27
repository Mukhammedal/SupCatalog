import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  globalSetup: "./tests/e2e/global-setup",
  globalTeardown: "./tests/e2e/global-teardown",
  reporter: process.env.CI ? "github" : "list",
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  workers: 1,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "ios-mini",
      testMatch: /public-responsive\.spec\.ts/,
      use: {
        deviceScaleFactor: 3,
        hasTouch: true,
        isMobile: true,
        viewport: { width: 375, height: 812 },
      },
    },
    {
      name: "ios-standard",
      testMatch: /public-responsive\.spec\.ts/,
      use: {
        deviceScaleFactor: 3,
        hasTouch: true,
        isMobile: true,
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "ios-pro",
      testMatch: /public-responsive\.spec\.ts/,
      use: {
        deviceScaleFactor: 3,
        hasTouch: true,
        isMobile: true,
        viewport: { width: 393, height: 852 },
      },
    },
    {
      name: "ios-pro-max",
      testMatch: /public-responsive\.spec\.ts/,
      use: {
        deviceScaleFactor: 3,
        hasTouch: true,
        isMobile: true,
        viewport: { width: 430, height: 932 },
      },
    },
    {
      name: "android-pixel",
      testMatch: /public-responsive\.spec\.ts/,
      use: {
        deviceScaleFactor: 2.75,
        hasTouch: true,
        isMobile: true,
        viewport: { width: 412, height: 915 },
      },
    },
    {
      name: "android-samsung",
      testMatch: /public-responsive\.spec\.ts/,
      use: {
        deviceScaleFactor: 3,
        hasTouch: true,
        isMobile: true,
        viewport: { width: 360, height: 800 },
      },
    },
    {
      name: "tablet",
      testMatch: /public-responsive\.spec\.ts/,
      use: {
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: false,
        viewport: { width: 820, height: 1180 },
      },
    },
  ],
});
