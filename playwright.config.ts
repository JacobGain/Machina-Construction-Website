import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  workers: 2,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'node tests/browser/server.mjs',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    env: {
      PORT: '4173',
      // Browser checks never use production SMTP, even if a local .env exists.
      SMTP_HOST: '127.0.0.1', SMTP_PORT: '1', SMTP_USER: 'test', SMTP_PASS: 'test',
      SMTP_FROM: 'test@example.invalid', CONTACT_RECIPIENT_EMAIL: 'test@example.invalid',
    },
  },
});
