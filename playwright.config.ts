import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
	testDir: 'tests',
	workers: 1,
	timeout: 60000,
	use: {
		baseURL: process.env.TEST_BASE_URL ?? 'http://localhost:8787',
		trace: 'retain-on-failure'
	},
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] } },
		{ name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }
	],
	webServer: process.env.TEST_BASE_URL
		? undefined
		: {
				command: 'npm run preview -- --port 8787',
				url: 'http://localhost:8787',
				reuseExistingServer: !process.env.CI,
				timeout: 60000
			}
});
