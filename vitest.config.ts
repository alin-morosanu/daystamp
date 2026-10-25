import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Only services tests import obsidian; core never does.
    alias: { obsidian: fileURLToPath(new URL('./tests/obsidian-stub.ts', import.meta.url)) }
  },
  test: {
    // `npm run bench` sets BENCH=1 to run the timing budgets instead of the unit tests.
    include: process.env.BENCH ? ['tests/**/*.bench.ts'] : ['tests/**/*.test.ts'],
    // A zone with DST, so daylight-saving tests cross a real change (2026-03-29 and 2026-10-25).
    env: { TZ: 'Europe/Bucharest' },
    setupFiles: ['tests/setup.ts']
  }
});
