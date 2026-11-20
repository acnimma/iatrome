import { defineConfig } from '@playwright/test';

/**
 * End-to-end: a real stage + real phones playing real games against the local
 * realtime server. Run with `npm run e2e` (starts both servers if needed).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 240_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: { channel: 'chrome', baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'npm run dev --prefix ../..',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
