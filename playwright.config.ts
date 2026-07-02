import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5183',
  },
  webServer: {
    // Dedicated port so this never picks up (or gets shadowed by) an
    // unrelated dev server the user may already have running on 5173.
    command: 'npm run dev -- --port 5183 --strictPort',
    url: 'http://localhost:5183',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
