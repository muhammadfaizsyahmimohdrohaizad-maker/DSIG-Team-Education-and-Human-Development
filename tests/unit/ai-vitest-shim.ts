// Minimal stand-in for the parts of Vitest the ai-*.test.ts files use. Only loaded by tests/unit/ai-run.ts.
type Fn = () => unknown | Promise<unknown>;
const tests: { name: string; fn: Fn }[] = [];
const prefix: string[] = [];

export function describe(name: string, fn: () => void) {
  prefix.push(name);
  try { fn(); } finally { prefix.pop(); }
}
export function it(name: string, fn: Fn) {
  tests.push({ name: [...prefix, name].join(" > "), fn });
}
export const test = it;

function same(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a).filter((k) => (a as Record<string, unknown>)[k] !== undefined);
  const kb = Object.keys(b).filter((k) => (b as Record<string, unknown>)[k] !== undefined);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => same((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}

const show = (v: unknown) => { try { return JSON.stringify(v); } catch { return String(v); } };

function matchers(actual: unknown, negate: boolean) {
  const check = (pass: boolean, msg: string) => { if (pass === negate) throw new Error((negate ? "not: " : "") + msg); };
  return {
    toBe: (e: unknown) => check(Object.is(actual, e), `expected ${show(actual)} to be ${show(e)}`),
    toEqual: (e: unknown) => check(same(actual, e), `expected ${show(actual)} to equal ${show(e)}`),
    toContain: (e: unknown) => check((actual as string | unknown[]).includes(e as never), `expected ${show(actual)} to contain ${show(e)}`),
    toMatch: (e: RegExp | string) => check(typeof actual === "string" && (typeof e === "string" ? actual.includes(e) : e.test(actual)), `expected ${show(actual)} to match ${String(e)}`),
    toBeGreaterThan: (e: number) => check((actual as number) > e, `expected ${show(actual)} > ${e}`),
    toBeGreaterThanOrEqual: (e: number) => check((actual as number) >= e, `expected ${show(actual)} >= ${e}`),
    toBeLessThan: (e: number) => check((actual as number) < e, `expected ${show(actual)} < ${e}`),
    toBeLessThanOrEqual: (e: number) => check((actual as number) <= e, `expected ${show(actual)} <= ${e}`),
    toHaveLength: (e: number) => check((actual as { length: number }).length === e, `expected length ${(actual as { length: number }).length} to be ${e}`),
    toBeTruthy: () => check(!!actual, `expected ${show(actual)} to be truthy`),
    toBeFalsy: () => check(!actual, `expected ${show(actual)} to be falsy`),
  };
}

export function expect(actual: unknown) {
  return { ...matchers(actual, false), not: matchers(actual, true) };
}

export async function run(): Promise<number> {
  let failed = 0;
  for (const t of tests) {
    try {
      await t.fn();
      console.log(`  ok   ${t.name}`);
    } catch (e) {
      failed++;
      console.log(`  FAIL ${t.name}\n       ${(e as Error).message}`);
    }
  }
  console.log(`\n${tests.length - failed} passed, ${failed} failed`);
  return failed;
}
