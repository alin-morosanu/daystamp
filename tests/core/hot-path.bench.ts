import moment from 'moment';
import { describe, expect, it } from 'vitest';

import { buildMonthGrid } from '../../src/core/calendar-grid';
import { render } from '../../src/core/format';
import { buildTriggerPattern, findTrigger, parseTriggerQuery } from '../../src/core/query';

// Budgets from docs/developer/architecture.md#performance, in milliseconds per call. Run with `npm run bench`.
const ITERATIONS = 20_000;
const NOW = moment('2026-10-25T14:30:00');
const pattern = buildTriggerPattern('@@');
const longLine = `${'Some ordinary prose in a long note line, '.repeat(20)}end`;
const matchLine = `${longLine} @@+3 date`;

function measure(name: string, budgetMs: number, fn: () => void): void {
  for (let i = 0; i < 1000; i++) fn();
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) fn();
  const perCall = (performance.now() - start) / ITERATIONS;
  console.warn(`${name}: ${(perCall * 1000).toFixed(2)} µs/call (budget ${budgetMs * 1000} µs)`);
  expect(perCall).toBeLessThan(budgetMs);
}

describe('hot path budgets', () => {
  it('trigger fast path without a match stays under 0.05 ms', () => {
    measure('findTrigger, no match', 0.05, () => findTrigger(longLine, longLine.length, '@@', pattern));
  });

  it('trigger match plus query parse stays under 2 ms', () => {
    measure('findTrigger + parseTriggerQuery', 2, () => {
      const hit = findTrigger(matchLine, matchLine.length, '@@', pattern);
      if (hit) parseTriggerQuery(hit.query, NOW);
    });
  });

  it('render stays under 1 ms', () => {
    measure('render with wiki-link', 1, () =>
      render({ format: 'YYYY-MM-DD HH:mm', transforms: ['wiki-link'] }, NOW, 'YYYY-MM-DD')
    );
  });

  it('a calendar month rebuild stays under 4 ms', () => {
    measure('buildMonthGrid', 4, () => buildMonthGrid(NOW, 1, NOW));
  });
});
