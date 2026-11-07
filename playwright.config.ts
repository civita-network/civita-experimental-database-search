import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3197";
const channel = process.env.PLAYWRIGHT_CHANNEL;

export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  use: { ...devices["Desktop Chrome"], baseURL, channel, trace: "retain-on-failure" },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3197",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 90_000,
  },
});
