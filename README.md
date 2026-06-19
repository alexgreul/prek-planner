# Pre-K Activity Planner

A tool that helps Pre-K teachers turn a classroom theme into developmentally
appropriate activities — each one tied to specific Florida early-learning
standards, with every citation verified before it reaches the teacher.

Built for Peace Lutheran Early Learning Center to cut the time teachers spend
hunting through the standards while lesson planning.

## The problem

Early-childhood teachers are expected to align activities to the Florida Early
Learning and Developmental Standards (FELDS), but the standards document is long
and dense, and planning happens in stolen minutes. Generic AI lesson-plan tools
make this worse, not better: they confidently cite standards that don't exist.
This tool's whole design goal is to be useful *without* that failure mode.

## How it works — three agents in sequence

1. **Retrieve.** Filter the benchmark set to the requested age band in plain code,
   then ask the model to rank which benchmarks fit the theme. (Narrowing by age
   band in code first means it can never surface a benchmark for the wrong age.)
2. **Plan.** The model drafts three activities, each citing specific benchmark IDs,
   with materials and steps.
3. **Verify, with a revision loop.** If anything fails, the draft goes back to the
   planner once with the specific problems, then gets re-checked.

## The design decision worth reading

Verification is split deliberately between code and the model:

- **Code checks what's checkable.** Does each cited benchmark ID actually exist?
  Is it in the requested age band? These are hard facts with a definite answer, so
  they're verified in `lib/verify.js` — no model involved. A fabricated ID cannot
  slip through.
- **The model judges what needs judgment.** Does the activity genuinely support the
  standard? Is it safe and age-appropriate? Are the materials cheap and realistic?
  These are qualitative, so the model handles them, and its verdict is folded in.

The model is never trusted to grade its own factual claims. That division is the
point of the project.

## Evals

`npm run evals` runs the verifier against its main failure modes: a fabricated
benchmark ID, a citation from the wrong age band, a valid activity flagged on
safety, and mixed-validity sets. All assertions run on the real `lib/verify.js`
code the app uses.

## Run it locally

```bash
npm install
cp .env.example .env.local   # then paste your Anthropic API key
npm run dev                  # http://localhost:3000
```

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Import it in Vercel.
3. Add an environment variable `ANTHROPIC_API_KEY` with your key.
4. Deploy — you get a live URL.

The API key stays server-side in `app/api/agent/route.js`; it is never exposed to
the browser. That route also rate-limits requests as a soft guard. **Set a low
monthly spend limit in the Anthropic console** as the real ceiling.

## Limitations / what I'd do differently

- The benchmark set in `lib/benchmarks.js` is **sample data**. The real version
  loads the official FELDS 4-to-K benchmarks; the format is identical.
- Retrieval is a code filter plus model ranking. With the full standards set,
  semantic embeddings within the age-band subset would rank borderline themes
  better — a clear next step, not needed at this scale.
- The model still occasionally returns malformed JSON; parsing is defensive but a
  schema-validation retry would be more robust.
- Teacher approval is intentionally manual — nothing is auto-published.
