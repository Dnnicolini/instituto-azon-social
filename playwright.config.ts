import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:8001';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? 'github' : 'list',
    use: {
        baseURL,
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
            ? {
                  executablePath:
                      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
              }
            : undefined,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'off',
    },
    projects: [
        {
            name: 'desktop-chromium',
            testIgnore: /public-mobile\.spec\.ts/,
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'mobile-chromium',
            testMatch: /public-mobile\.spec\.ts/,
            use: { ...devices['Pixel 7'] },
        },
    ],
    webServer: {
        command: 'php artisan serve --host=127.0.0.1 --port=8001',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
