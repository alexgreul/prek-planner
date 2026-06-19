"use client";

import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  BookOpen,
  Layers,
  ShieldCheck,
  Send,
  RotateCcw,
  Lightbulb,
} from "lucide-react";
import { BENCHMARKS } from "../lib/benchmarks.js";
import { verifyInCode, merge, buildFeedback } from "../lib/verify.js";

const C = {
  paper: "#FBF7F0",
  card: "#FFFFFF",
  ink: "#2A2D34",
  muted: "#7A746B",
  teal: "#2F8F7F",
  tealDark: "#1E5F54",
  tealSoft: "#E7F1EE",
  marigold: "#E0A43B",
  marigoldSoft: "#FBEFD6",
  danger: "#C2503D",
  dangerSoft: "#F6E3DF",
  line: "#EDE6D9",
};

async function callClaude(system, user) {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ system, user }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "API error " + res.status);
  return data.text;
}

function extractJSON(text) {
  let t = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  const fObj = t.indexOf("{");
  const fArr = t.indexOf("[");
  let start, close;
  if (fArr !== -1 && (fArr < fObj || fObj === -1)) {
    start = fArr;
    close = "]";
  } else {
    start = fObj;
    close = "}";
  }
  if (start === -1) throw new Error("No JSON in model output");
  const end = t.lastIndexOf(close);
  return JSON.parse(t.slice(start, end + 1));
}

const STAGES = [
  { key: "retrieve", label: "Retrieve standards", Icon: BookOpen },
  { key: "plan", label: "Draft activities", Icon: Layers },
  { key: "verify", label: "Verify alignment", Icon: ShieldCheck },
  { key: "deliver", label: "Deliver plan", Icon: Sparkles },
];

const EXAMPLES = ["Ocean animals", "Fall leaves", "Community helpers", "Shapes all around"];

export default function PreKActivityPlanner() {
  const [theme, setTheme] = useState("");
  const [ageBand, setAgeBand] = useState("4-K");
  const [phase, setPhase] = useState("idle");
  const [results, setResults] = useState([]);
  const [usedBenchmarks, setUsedBenchmarks] = useState([]);
  const [revised, setRevised] = useState(false);
  const [error, setError] = useState("");

  const running = ["retrieving", "planning", "verifying", "revising"].includes(phase);

  function stageState(key) {
    const order = ["retrieve", "plan", "verify", "deliver"];
    const phaseToStage = {
      retrieving: "retrieve",
      planning: "plan",
      verifying: "verify",
      revising: "verify",
      done: "deliver",
    };
    if (phase === "done") return "done";
    const active = phaseToStage[phase];
    if (!active) return "pending";
    const ai = order.indexOf(active);
    const ki = order.indexOf(key);
    if (ki < ai) return "done";
    if (ki === ai) return "active";
    return "pending";
  }

  async function selectBenchmarks(candidates) {
    const list = candidates.map((b) => `${b.id} | ${b.domain} | ${b.text}`).join("\n");
    const out = await callClaude(
      "You match classroom themes to early-learning benchmarks. Return ONLY a JSON array of benchmark id strings — no prose, no markdown.",
      `Theme: "${theme}"\nAge band: ${ageBand}\n\nCandidate benchmarks:\n${list}\n\nReturn the 3 to 5 ids most relevant to the theme.`
    );
    const ids = extractJSON(out);
    const valid = candidates.filter((b) => ids.includes(b.id));
    return valid.length ? valid : candidates.slice(0, 4);
  }

  async function planActivities(selected, feedback) {
    const list = selected.map((b) => `${b.id}: ${b.text}`).join("\n");
    const fix = feedback
      ? `\n\nA reviewer flagged problems with the previous draft. Fix these and ONLY cite ids from the list above:\n${feedback}`
      : "";
    const out = await callClaude(
      'You are an experienced Pre-K curriculum designer. Design developmentally appropriate, low-cost classroom activities. Return ONLY JSON, no markdown. Schema: {"activities":[{"title":"","goal":"","materials":[""],"steps":[""],"benchmarkIds":[""]}]}. Cite ONLY benchmark ids from the provided list. Exactly 3 activities, 3 to 4 short steps each.',
      `Theme: "${theme}"\nAge band: ${ageBand}\n\nAvailable benchmarks:\n${list}${fix}`
    );
    return extractJSON(out).activities || [];
  }

  async function critique(activities, corpus) {
    const cited = {};
    activities.forEach((a) => (a.benchmarkIds || []).forEach((id) => (cited[id] = true)));
    const refs = corpus
      .filter((b) => cited[b.id])
      .map((b) => `${b.id}: ${b.text}`)
      .join("\n");
    const compact = activities.map((a) => ({
      title: a.title,
      cites: a.benchmarkIds,
      steps: a.steps,
      materials: a.materials,
    }));
    const out = await callClaude(
      'You are a careful early-childhood reviewer. For each activity judge three things: supports (does it genuinely advance every cited benchmark), safe (age-appropriate and safe for the band), feasible (materials are cheap and classroom-realistic). Return ONLY JSON. Schema: {"reviews":[{"title":"","supports":true,"safe":true,"feasible":true,"notes":""}]}.',
      `Age band: ${ageBand}\n\nCited benchmark text:\n${refs}\n\nActivities:\n${JSON.stringify(compact)}`
    );
    return extractJSON(out).reviews || [];
  }

  async function run() {
    if (!theme.trim() || running) return;
    setError("");
    setResults([]);
    setRevised(false);
    try {
      setPhase("retrieving");
      const candidates = BENCHMARKS.filter((b) => b.ageBand === ageBand);
      const selected = await selectBenchmarks(candidates);
      setUsedBenchmarks(selected);

      setPhase("planning");
      let activities = await planActivities(selected, "");

      setPhase("verifying");
      let coded = verifyInCode(activities, ageBand, BENCHMARKS);
      let reviews = await critique(activities, BENCHMARKS);
      let merged = merge(coded, reviews);

      if (merged.some((a) => !a.pass)) {
        setPhase("revising");
        const feedback = buildFeedback(merged);
        activities = await planActivities(selected, feedback);
        coded = verifyInCode(activities, ageBand, BENCHMARKS);
        reviews = await critique(activities, BENCHMARKS);
        merged = merge(coded, reviews);
        setRevised(true);
      }

      setResults(merged);
      setPhase("done");
    } catch (e) {
      setError(e.message || "Something went wrong running the pipeline.");
      setPhase("error");
    }
  }

  const bandLabel = "4 years - Kindergarten (VPK)";

  return (
    <div style={{ background: C.paper, color: C.ink, minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 20px 64px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <Lightbulb size={22} color={C.teal} />
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>
            Pre-K Activity Planner
          </h1>
        </div>
        <p style={{ color: C.muted, margin: "0 0 18px", fontSize: 15, lineHeight: 1.5 }}>
          Type a classroom theme. Three agents work in sequence — they pull the matching standards,
          draft activities that cite them, and verify every citation before anything reaches you.
        </p>

        <div style={{ background: C.tealSoft, border: `1px solid ${C.line}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, color: C.tealDark, display: "flex", gap: 8, marginBottom: 22 }}>
          <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            Built on a curated subset of the official <strong>Florida FELDS</strong> standards
            (4 years - Kindergarten, 2017).
          </span>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18, marginBottom: 22 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: C.muted, display: "block", marginBottom: 6 }}>Theme</label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && run()}
              placeholder="e.g. Ocean animals"
              style={{ flex: "1 1 220px", border: `1px solid ${C.line}`, borderRadius: 10, padding: "11px 13px", fontSize: 15, outline: "none", color: C.ink, background: C.paper }}
            />
            <select
              value={ageBand}
              onChange={(e) => setAgeBand(e.target.value)}
              style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: "11px 13px", fontSize: 14, background: C.paper, color: C.ink }}
            >
              <option value="4-K">4 yrs - Kindergarten</option>
            </select>
            <button
              onClick={run}
              disabled={running || !theme.trim()}
              style={{ background: running || !theme.trim() ? "#BFD8D1" : C.teal, color: "#fff", border: "none", borderRadius: 10, padding: "11px 18px", fontSize: 15, fontWeight: 600, cursor: running || !theme.trim() ? "default" : "pointer", display: "flex", alignItems: "center", gap: 7 }}
            >
              {running ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
              {running ? "Working" : "Plan activities"}
            </button>
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 12 }}>
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => setTheme(ex)} style={{ background: C.tealSoft, color: C.tealDark, border: "none", borderRadius: 999, padding: "5px 12px", fontSize: 13, cursor: "pointer" }}>
                {ex}
              </button>
            ))}
          </div>
        </div>

        {(running || phase === "done") && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "16px 14px", marginBottom: 22 }}>
            {STAGES.map((s, i) => {
              const st = stageState(s.key);
              const color = st === "done" ? C.teal : st === "active" ? C.marigold : "#CFC8BB";
              return (
                <React.Fragment key={s.key}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 999, background: st === "pending" ? C.paper : st === "active" ? C.marigoldSoft : C.tealSoft, border: `2px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {st === "active" ? <Loader2 size={18} color={color} className="spin" /> : st === "done" ? <CheckCircle2 size={18} color={color} /> : <s.Icon size={18} color={color} />}
                    </div>
                    <span style={{ fontSize: 12, color: st === "pending" ? C.muted : C.ink, textAlign: "center", fontWeight: st === "active" ? 600 : 400 }}>
                      {s.key === "verify" && phase === "revising" ? "Revising draft" : s.label}
                    </span>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div style={{ height: 2, flex: 0.5, background: stageState(STAGES[i + 1].key) === "pending" ? "#E4DDD0" : C.teal, marginBottom: 20 }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {phase === "error" && (
          <div style={{ background: C.dangerSoft, border: `1px solid ${C.danger}`, borderRadius: 12, padding: 14, color: C.danger, fontSize: 14, marginBottom: 22 }}>
            {error} — try again, or rephrase the theme.
          </div>
        )}

        {phase === "done" && revised && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.marigoldSoft, borderRadius: 10, padding: "9px 12px", fontSize: 13, color: "#8a6418", marginBottom: 16 }}>
            <RotateCcw size={15} />
            The verifier caught an issue in the first draft, so the planner revised it once before delivering.
          </div>
        )}

        {results.map((a, i) => (
          <div key={i} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 18, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, fontFamily: "Georgia, serif" }}>{a.title}</h3>
              <span style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: a.pass ? C.tealDark : C.danger, background: a.pass ? C.tealSoft : C.dangerSoft, padding: "4px 9px", borderRadius: 999 }}>
                {a.pass ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                {a.pass ? "Verified" : "Flagged"}
              </span>
            </div>
            <p style={{ margin: "6px 0 12px", color: C.muted, fontSize: 14, lineHeight: 1.5 }}>{a.goal}</p>

            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
              {a.idChecks.map((c) => {
                const ok = c.exists && c.inBand;
                const reason = !c.exists ? "not a real benchmark" : !c.inBand ? "wrong age band" : "";
                return (
                  <span key={c.id} title={reason} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, fontFamily: "ui-monospace, monospace", color: ok ? C.tealDark : C.danger, background: ok ? C.tealSoft : C.dangerSoft, padding: "4px 9px", borderRadius: 7 }}>
                    {ok ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    {c.id}
                    {!ok && reason ? ` · ${reason}` : ""}
                  </span>
                );
              })}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Materials</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
                  {(a.materials || []).map((m, j) => <li key={j}>{m}</li>)}
                </ul>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Steps</div>
                <ol style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
                  {(a.steps || []).map((s, j) => <li key={j}>{s}</li>)}
                </ol>
              </div>
            </div>

            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.line}`, display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13, color: C.muted, alignItems: "center" }}>
              <ReviewChip ok={a.review.supports} label="Supports standards" />
              <ReviewChip ok={a.review.safe} label="Age-appropriate" />
              <ReviewChip ok={a.review.feasible} label="Feasible" />
              {a.review.notes ? <span style={{ flexBasis: "100%", fontStyle: "italic" }}>{'"' + a.review.notes + '"'}</span> : null}
            </div>
          </div>
        ))}

        {phase === "done" && usedBenchmarks.length > 0 && (
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
            Standards pulled for "{theme}" · {bandLabel}: {usedBenchmarks.map((b) => b.id).join(", ")}
          </div>
        )}

        {phase === "idle" && (
          <div style={{ textAlign: "center", color: C.muted, fontSize: 14, padding: "20px 0" }}>
            Pick a theme above to see the pipeline run.
          </div>
        )}
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function ReviewChip({ ok, label }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 5, color: ok ? "#2F8F7F" : "#C2503D" }}>
      {ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      {label}
    </span>
  );
}
