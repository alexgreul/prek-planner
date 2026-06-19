// Eval harness for the verify agent's hard-oracle checks.
// Run with: npm run evals
// These tests assert the deterministic verifier catches the failure modes that
// matter most: a fabricated benchmark id, a citation from the wrong age band,
// and a valid activity that a critic flags on judgment grounds.

import { BENCHMARKS } from "../lib/benchmarks.js";
import { verifyInCode, merge } from "../lib/verify.js";

let passed = 0;
let failed = 0;

function check(name, condition) {
  if (condition) {
    passed++;
    console.log("  \x1b[32mPASS\x1b[0m  " + name);
  } else {
    failed++;
    console.log("  \x1b[31mFAIL\x1b[0m  " + name);
  }
}

const allTrue = (title) => [{ title, supports: true, safe: true, feasible: true, notes: "" }];

console.log("\nVerifier evals (age band: 4-K)\n");

// 1. A valid activity citing a real, in-band id and clearing the critic should pass.
{
  const acts = [{ title: "Count the shells", benchmarkIds: ["MT.4K.1"], steps: [], materials: [] }];
  const merged = merge(verifyInCode(acts, "4-K", BENCHMARKS), allTrue("Count the shells"));
  check("valid in-band citation passes", merged[0].pass === true);
}

// 2. A fabricated benchmark id must be caught (exists === false) and fail.
{
  const acts = [{ title: "Made-up activity", benchmarkIds: ["LL.4K.99"], steps: [], materials: [] }];
  const merged = merge(verifyInCode(acts, "4-K", BENCHMARKS), allTrue("Made-up activity"));
  check("fabricated id is detected", merged[0].idChecks[0].exists === false);
  check("fabricated id forces a fail", merged[0].pass === false);
}

// 3. A real id from the wrong age band must fail the in-band check.
{
  const acts = [{ title: "Wrong band", benchmarkIds: ["MT.34.1"], steps: [], materials: [] }];
  const merged = merge(verifyInCode(acts, "4-K", BENCHMARKS), allTrue("Wrong band"));
  check("out-of-band id is detected", merged[0].idChecks[0].inBand === false);
  check("out-of-band id forces a fail", merged[0].pass === false);
}

// 4. Valid ids but a critic safety flag should still fail (judgment layer respected).
{
  const acts = [{ title: "Risky craft", benchmarkIds: ["CA.4K.1"], steps: [], materials: [] }];
  const reviews = [{ title: "Risky craft", supports: true, safe: false, feasible: true, notes: "choking hazard" }];
  const merged = merge(verifyInCode(acts, "4-K", BENCHMARKS), reviews);
  check("critic safety flag forces a fail", merged[0].pass === false);
}

// 5. Mixed activity: one valid id, one fabricated id should still fail overall.
{
  const acts = [{ title: "Mixed", benchmarkIds: ["SE.4K.1", "ZZ.0.0"], steps: [], materials: [] }];
  const merged = merge(verifyInCode(acts, "4-K", BENCHMARKS), allTrue("Mixed"));
  check("any bad id in a set forces a fail", merged[0].pass === false);
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
