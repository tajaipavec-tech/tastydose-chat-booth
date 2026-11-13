// Vercel serverless function: POST /api/chat  { messages: [{role, content}] } -> { reply }
//
// Which AI is used (first key that is set wins):
//   1. OPENAI_API_KEY  -> OpenAI (optional OPENAI_MODEL, default gpt-4.1-mini)
//   2. GEMINI_API_KEY  -> Google Gemini
//   3. ANTHROPIC_API_KEY -> Claude
//
// Google Gemini free tier:
//   Env var GEMINI_API_KEY (from https://aistudio.google.com/apikey, no credit card).
//   Optional GEMINI_MODEL (default gemini-2.5-flash).
// Paid option: Anthropic Claude. Used only if GEMINI_API_KEY is NOT set and ANTHROPIC_API_KEY is.
//   Optional CLAUDE_MODEL (default claude-haiku-4-5).
import { SYSTEM_PROMPT } from "../lib/knowledge.js";

const MAX_TURNS = 12;      // last N messages sent to the model
const MAX_CHARS = 1500;    // per user message

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const raw = Array.isArray(body?.messages) ? body.messages : [];

  const messages = raw
    .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-MAX_TURNS)
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return res.status(400).json({ error: "bad_request" });
  }

  try {
    let reply;
    if (process.env.OPENAI_API_KEY) reply = await askOpenAI(messages);
    else if (process.env.GEMINI_API_KEY) reply = await askGemini(messages);
    else if (process.env.ANTHROPIC_API_KEY) reply = await askClaude(messages);
    else return res.status(500).json({ error: "missing_key" });
    if (!reply) return res.status(502).json({ error: "empty" });
    return res.status(200).json({ reply });
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: "upstream" });
  }
}

async function askGemini(messages) {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      generationConfig: { maxOutputTokens: 800, temperature: 0.4, thinkingConfig: { thinkingBudget: 0 } }
    })
  });
  const data = await r.json();
  if (!r.ok) throw new Error("Gemini " + r.status + " " + JSON.stringify(data));
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map(p => p.text || "").join("").trim();
}

async function askClaude(messages) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || "claude-haiku-4-5",
      max_tokens: 600,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages
    })
  });
  const data = await r.json();
  if (!r.ok) throw new Error("Anthropic " + r.status + " " + JSON.stringify(data));
  return (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
}

async function askOpenAI(messages) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": "Bearer " + process.env.OPENAI_API_KEY },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      max_completion_tokens: 800,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages]
    })
  });
  const data = await r.json();
  if (!r.ok) throw new Error("OpenAI " + r.status + " " + JSON.stringify(data));
  return (data.choices?.[0]?.message?.content || "").trim();
}
