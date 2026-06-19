import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Switch to "claude-haiku-4-5-20251001" to cut cost-per-run if quality allows.
const MODEL = "claude-sonnet-4-6";

// Lightweight in-memory rate limiting. Note: serverless instances are ephemeral,
// so this is a soft guard against casual abuse, not a hard cap. The real ceiling
// is the monthly spend limit you set in the Anthropic console.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
const MAX_PER_DAY = 300;

const hits = new Map();
let dayKey = "";
let dayCount = 0;

function rateLimited(ip) {
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  if (today !== dayKey) {
    dayKey = today;
    dayCount = 0;
  }
  if (dayCount >= MAX_PER_DAY) return true;
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (recent.length > MAX_PER_WINDOW) return true;
  dayCount++;
  return false;
}

export async function POST(req) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
    if (rateLimited(ip)) {
      return NextResponse.json({ error: "Rate limit reached. Give it a minute." }, { status: 429 });
    }

    const { system, user } = await req.json();
    if (typeof system !== "string" || typeof user !== "string" || user.length > 6000) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Server is missing ANTHROPIC_API_KEY." }, { status: 500 });
    }

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        system,
        messages: [{ role: "user", content: user }],
      }),
    });

    if (!r.ok) {
      const detail = (await r.text()).slice(0, 200);
      return NextResponse.json({ error: "Upstream error " + r.status, detail }, { status: 502 });
    }

    const data = await r.json();
    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
