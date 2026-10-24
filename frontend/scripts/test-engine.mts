/**
 * Parity test: the in-browser engine (src/lib/engine.ts) must match the Python
 * engine on every golden vector (scripts/engine-golden.json).
 * Run: npm run test:engine
 */
import { readFileSync } from 'node:fs';
import { calculateDecision, type EngineInput } from '../src/lib/engine.ts';

type Golden = { input: EngineInput; output: Record<string, unknown> };
const cases: Golden[] = JSON.parse(readFileSync(new URL('./engine-golden.json', import.meta.url), 'utf8'));

const close = (a: number, b: number) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));
let failures = 0;

function compare(path: string, expected: unknown, actual: unknown) {
  if (expected === 'Infinity') expected = Infinity;
  if (typeof expected === 'number' && typeof actual === 'number') {
    if (!(expected === actual || close(expected, actual))) fail(path, expected, actual);
  } else if (Array.isArray(expected)) {
    if (!Array.isArray(actual) || actual.length !== expected.length) return fail(path, expected, actual);
    expected.forEach((e, i) => compare(`${path}[${i}]`, e, (actual as unknown[])[i]));
  } else if (expected && typeof expected === 'object') {
    for (const k of Object.keys(expected)) compare(`${path}.${k}`, (expected as Record<string, unknown>)[k], (actual as Record<string, unknown>)?.[k]);
  } else if (expected !== actual) fail(path, expected, actual);
}

function fail(path: string, expected: unknown, actual: unknown) {
  failures++;
  if (failures <= 10) console.error(`MISMATCH ${path}: python=${JSON.stringify(expected)} ts=${JSON.stringify(actual)}`);
}

cases.forEach((c, i) => compare(`case${i}`, c.output, calculateDecision(c.input)));
console.log(`${cases.length} golden cases, ${failures} mismatches`);
process.exit(failures ? 1 : 0);
