const { defineConfig, devices } = require('@playwright/test');

// The only target: the deployed GitHub Pages site. "v2" runs the redesigned UI (?v=2).
const SITE = process.env.SITE_URL || 'https://siddharth-bstack.github.io/brewcart-webinar/website/';
const UI_VERSION = process.env.UI === 'v2' ? '?v=2' : '';

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: SITE + UI_VERSION,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
