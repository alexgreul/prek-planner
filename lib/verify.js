// Deterministic verification — the "hard oracle" half of the verify agent.
// These functions never call a model: they check facts that are checkable in code
// (does a cited benchmark id exist, is it in the requested age band). The model
// only handles the qualitative judgments (supports / safe / feasible), which get
// folded in via merge(). Keeping these pure makes them testable in evals/.

export function verifyInCode(activities, ageBand, corpus) {
  return activities.map((a) => {
    const idChecks = (a.benchmarkIds || []).map((id) => {
      const found = corpus.find((b) => b.id === id);
      return {
        id,
        exists: !!found,
        inBand: !!found && found.ageBand === ageBand,
      };
    });
    return { ...a, idChecks };
  });
}

export function merge(coded, reviews) {
  return coded.map((a) => {
    const r =
      (reviews || []).find((x) => (x.title || "").trim() === (a.title || "").trim()) || {
        supports: true,
        safe: true,
        feasible: true,
        notes: "",
      };
    const idsOk = a.idChecks.every((c) => c.exists && c.inBand);
    const pass = idsOk && r.supports && r.safe && r.feasible;
    return { ...a, review: r, pass };
  });
}

export function buildFeedback(merged) {
  const lines = [];
  merged.forEach((a) => {
    if (a.pass) return;
    const bad = a.idChecks.filter((c) => !c.exists).map((c) => c.id);
    const oob = a.idChecks.filter((c) => c.exists && !c.inBand).map((c) => c.id);
    if (bad.length) lines.push(`"${a.title}" cites ids that do not exist: ${bad.join(", ")}.`);
    if (oob.length) lines.push(`"${a.title}" cites ids from the wrong age band: ${oob.join(", ")}.`);
    if (a.review && !a.review.supports) lines.push(`"${a.title}" does not clearly support its benchmarks: ${a.review.notes}`);
    if (a.review && !a.review.safe) lines.push(`"${a.title}" has a safety concern: ${a.review.notes}`);
    if (a.review && !a.review.feasible) lines.push(`"${a.title}" is not feasible: ${a.review.notes}`);
  });
  return lines.join("\n");
}
