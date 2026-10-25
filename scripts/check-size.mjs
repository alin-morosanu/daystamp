import fs from 'node:fs';

// Budget from docs/developer/architecture.md#performance.
const MAX_BYTES = 40 * 1024;

const size = fs.statSync('main.js').size;
if (size > MAX_BYTES) {
  console.error(`main.js is ${size} bytes, over the ${MAX_BYTES} byte budget.`);
  process.exit(1);
}
console.error(`main.js is ${size} bytes (budget ${MAX_BYTES}).`);
