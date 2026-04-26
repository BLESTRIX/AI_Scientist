// ─── backend/index.ts ─────────────────────────────────────────────────────────
// Full drop-in replacement. Adds:
//   1. Smart Procurement  – queries Supabase user_equipment and injects it into
//      the Groq prompt so in-lab items get price:0 / supplier:"Available In-Lab"
//   2. application_justification  – a new string field on GenerateOutput that
//      asks the LLM to write a formal impact paragraph.
// Everything else is unchanged from the original.

const express = require("express") as typeof import("express");
const cors = require("cors") as typeof import("cors");
const dotenv = require("dotenv") as typeof import("dotenv");
const Groq = require("groq-sdk").default as typeof import("groq-sdk").default;
const { createClient } = require("@supabase/supabase-js") as typeof import("@supabase/supabase-js");

type Request = import("express").Request;
type Response = import("express").Response;

dotenv.config();

// ─── Types ─────────────────────────────────────────────────────────────────────

type NoveltySignal = "not found" | "similar work exists" | "exact match found";

interface Reference {
  title: string;
  url: string;
  authors: string;
  journal: string;
  year: number;
}

interface NoveltyCheck {
  signal: NoveltySignal;
  summary: string;
  references: Reference[];
}

interface ProtocolStep {
  step_number: number;
  title: string;
  description: string;
  duration: string;
  key_parameters: Record<string, string>;
  safety_notes: string | null;
  editable: boolean;
}

interface Material {
  item: string;
  supplier: string;
  catalog_number: string;
  quantity: string;
  estimated_price: number;
  notes: string;
  url: string | null;
}

interface TimelinePhase {
  phase: number;
  name: string;
  duration_weeks: number;
  week_range: string;
  description: string;
  dependencies: string[];
  deliverables: string[];
}

// ── NEW: includes application_justification ───────────────────────────────────
interface GenerateOutput {
  protocol: ProtocolStep[];
  materials: Material[];
  budget_total: number;
  timeline_phases: TimelinePhase[];
  application_justification: string;   // <-- NEW FIELD
}

// ─── Tavily types ──────────────────────────────────────────────────────────────

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

interface TavilyResponse {
  answer?: string;
  results: TavilyResult[];
}

interface TavilyExtractResult {
  url: string;
  title?: string;
  raw_content?: string;
  content?: string;
  favicon?: string;
}

interface TavilyExtractResponse {
  results: TavilyExtractResult[];
  failed_results?: Array<{ url: string; error?: string }>;
}

interface CorrectionRow {
  created_at: string;
  hypothesis: string;
  correction: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY ??
  "";
const CORRECTIONS_TABLE = "corrections";
const GROQ_QC_MODEL = process.env.GROQ_QC_MODEL ?? "llama-3.3-70b-versatile";
const GROQ_GENERATE_MODEL =
  process.env.GROQ_GENERATE_MODEL ?? "llama-3.3-70b-versatile";
const GROQ_PROCUREMENT_MODEL = "llama3-70b-8192";
const GROQ_QC_MAX_TOKENS = Number(process.env.GROQ_QC_MAX_TOKENS ?? 1200);
const GROQ_GENERATE_MAX_TOKENS = Number(process.env.GROQ_GENERATE_MAX_TOKENS ?? 2500);
const QC_CONTEXT_CHAR_BUDGET = Number(process.env.QC_CONTEXT_CHAR_BUDGET ?? 12000);
const QC_COMPACT_CONTEXT_CHAR_BUDGET = Number(process.env.QC_COMPACT_CONTEXT_CHAR_BUDGET ?? 3500);
const GENERATE_LITERATURE_CHAR_BUDGET = Number(process.env.GENERATE_LITERATURE_CHAR_BUDGET ?? 9000);
const DEFAULT_DOMAINS = [
  "arxiv.org",
  "pubmed.ncbi.nlm.nih.gov",
  "nature.com",
  "science.org",
  "ieee.org",
  "github.com",
  "cell.com",
  "doi.org",
  "biorxiv.org",
  "frontiersin.org",
  "springer.com",
  "wiley.com",
  "protocols.io",
  "jove.com",
];

// ─── Init ──────────────────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT ?? 3001;

const configuredOrigins = (process.env.FRONTEND_URL ?? "")
  .split(",")
  .map((o: string) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) { callback(null, true); return; }
      const isLocalDevOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
      if (isLocalDevOrigin || configuredOrigins.includes(origin)) { callback(null, true); return; }
      callback(new Error(`CORS blocked origin: ${origin}`));
    },
  })
);
app.use(express.json());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ─── Helpers ───────────────────────────────────────────────────────────────────

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

function getTopUrlsFromDifferentDomains(results: TavilyResult[], maxUrls: number): string[] {
  const seenDomains = new Set<string>();
  const selected: string[] = [];
  for (const r of results) {
    if (selected.length >= maxUrls) break;
    const domain = extractDomain(r.url);
    if (!seenDomains.has(domain)) { seenDomains.add(domain); selected.push(r.url); }
  }
  return selected;
}

function clampText(text: string, maxChars: number): string {
  if (!text) return "";
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 24))}\n\n[truncated]`;
}

// ─── GET /health ───────────────────────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── POST /api/corrections ────────────────────────────────────────────────────

app.post("/api/corrections", async (req: Request, res: Response) => {
  const { hypothesis, correction } = req.body as { hypothesis?: string; correction?: string };
  if (!hypothesis?.trim()) { res.status(400).json({ error: "hypothesis is required." }); return; }
  if (!correction?.trim()) { res.status(400).json({ error: "correction is required." }); return; }
  try {
    const { error } = await supabase.from(CORRECTIONS_TABLE).insert({
      hypothesis: hypothesis.trim(),
      correction: correction.trim(),
    });
    if (error) throw error;
    res.json({ success: true, message: "Correction saved to feedback loop." });
  } catch (err) {
    console.error("/api/corrections Supabase error:", err);
    res.status(500).json({ error: "Failed to save correction.", detail: String(err) });
  }
});

// ─── POST /api/qc ─────────────────────────────────────────────────────────────
// (unchanged from original — omitted here for brevity; paste original content)

app.post("/api/qc", async (req: Request, res: Response) => {
  const { hypothesis, preferred_domains } = req.body as {
    hypothesis?: string;
    preferred_domains?: string[];
  };

  if (!hypothesis?.trim()) {
    res.status(400).json({ error: "hypothesis is required." });
    return;
  }

  let tavilyAnswer = "";
  let tavilyResults: TavilyResult[] = [];

  try {
    const tavilyRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: `${hypothesis} methodology experimental setup`,
        search_depth: "advanced",
        include_answer: true,
        max_results: 8,
        include_domains: preferred_domains?.length ? preferred_domains : DEFAULT_DOMAINS,
      }),
    });
    if (tavilyRes.ok) {
      const d = (await tavilyRes.json()) as TavilyResponse;
      tavilyAnswer = d.answer ?? "";
      tavilyResults = d.results ?? [];
    }
  } catch (e) { console.error("Tavily search failed:", e); }

  let extractedContent = "";
  const topUrls = getTopUrlsFromDifferentDomains(tavilyResults, 2);
  if (topUrls.length > 0 && process.env.TAVILY_API_KEY) {
    try {
      const extractRes = await fetch("https://api.tavily.com/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, urls: topUrls }),
      });
      if (extractRes.ok) {
        const d = (await extractRes.json()) as TavilyExtractResponse;
        extractedContent = (d.results ?? [])
          .map((r, i) =>
            `[EXTRACTED PAPER ${i + 1}]\nTitle: ${r.title ?? "Unknown"}\nURL: ${r.url}\n\n${(r.raw_content ?? r.content ?? "").slice(0, 3500)}`
          )
          .join("\n\n" + "=".repeat(80) + "\n\n");
      }
    } catch (e) { console.error("Tavily extract failed:", e); }
  }

  const snippetContext = tavilyResults.length
    ? tavilyResults.map((r, i) => `[SNIPPET ${i + 1}] ${r.title}\n${r.content.slice(0, 500)}`).join("\n\n")
    : "No results.";

  const fullContext = extractedContent
    ? `${extractedContent}\n\n${"=".repeat(80)}\n\nADDITIONAL SNIPPETS:\n${snippetContext}`
    : snippetContext;
  const fullContextForPrompt = clampText(fullContext, QC_CONTEXT_CHAR_BUDGET);
  const compactContextForPrompt = clampText(snippetContext, QC_COMPACT_CONTEXT_CHAR_BUDGET);

  const systemPrompt = `You are a rigorous scientific peer-reviewer.
Evaluate the hypothesis against literature and return ONLY a valid JSON NoveltyCheck:
interface Reference { title:string; url:string; authors:string; journal:string; year:number }
interface NoveltyCheck { signal:"not found"|"similar work exists"|"exact match found"; summary:string; references:Reference[] }
No markdown, no fences.`;

  try {
    const fullUserMessage = `Hypothesis: "${hypothesis}"\n\nSearch answer: ${clampText(tavilyAnswer, 1200)}\n\nLiterature:\n${fullContextForPrompt}`;
    const compactUserMessage = `Hypothesis: "${hypothesis}"\n\nSearch answer: ${clampText(tavilyAnswer, 600)}\n\nLiterature:\n${compactContextForPrompt}`;

    let rawCompletion = "{}";
    try {
      const completion = await groq.chat.completions.create({
        model: GROQ_QC_MODEL,
        temperature: 0.2,
        max_tokens: GROQ_QC_MAX_TOKENS,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: fullUserMessage },
        ],
      });
      rawCompletion = completion.choices[0]?.message?.content ?? "{}";
    } catch (firstErr) {
      const status = (firstErr as { status?: number })?.status;
      if (status !== 413) throw firstErr;

      console.warn("/api/qc hit Groq 413; retrying with compact context.");
      const retry = await groq.chat.completions.create({
        model: GROQ_QC_MODEL,
        temperature: 0.2,
        max_tokens: Math.min(700, GROQ_QC_MAX_TOKENS),
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: compactUserMessage },
        ],
      });
      rawCompletion = retry.choices[0]?.message?.content ?? "{}";
    }

    const noveltyCheck = JSON.parse(rawCompletion) as NoveltyCheck;
    if (!Array.isArray(noveltyCheck.references)) noveltyCheck.references = [];
    res.json(noveltyCheck);
  } catch (err) {
    console.error("/api/qc error:", err);
    res.status(500).json({ error: "Failed to evaluate novelty.", detail: String(err) });
  }
});

// ─── POST /api/procurement ────────────────────────────────────────────────────
// (unchanged — omitted for brevity; paste original content here)

app.post("/api/procurement", async (req: Request, res: Response) => {
  const { materials } = req.body as { materials?: Material[] };
  if (!Array.isArray(materials)) {
    res.status(400).json({ error: "materials must be an array." });
    return;
  }
  const normalizedMaterials = materials
    .filter((m): m is Material =>
      Boolean(m) &&
      typeof m === "object" &&
      typeof m.item === "string" &&
      typeof m.supplier === "string" &&
      typeof m.catalog_number === "string" &&
      typeof m.quantity === "string" &&
      typeof m.estimated_price === "number" &&
      typeof m.notes === "string"
    )
    .map((m) => ({ ...m, url: typeof m.url === "string" ? m.url : null }));

  if (normalizedMaterials.length === 0) {
    res.status(400).json({ error: "No valid materials." });
    return;
  }

  // Skip procurement enrichment for in-lab items
  const updatedMaterials = [...normalizedMaterials];
  const itemsToProcess = [...normalizedMaterials]
    .filter((m) => m.supplier !== "Available In-Lab" && m.estimated_price > 0)
    .sort((a, b) => b.estimated_price - a.estimated_price)
    .slice(0, 10);

  for (const material of itemsToProcess) {
    const idx = normalizedMaterials.findIndex((m) => m.item === material.item && m.supplier === material.supplier);
    if (idx === -1) continue;
    const target = updatedMaterials[idx];
    if (!target) continue;
    try {
      const searchRes = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: `buy ${material.item} ${material.supplier} catalog price`,
          search_depth: "basic",
          include_answer: false,
          max_results: 3,
        }),
      });
      if (!searchRes.ok) continue;
      const searchData = (await searchRes.json()) as TavilyResponse;
      const topUrl = searchData.results?.[0]?.url;
      if (!topUrl) continue;

      const extractRes = await fetch("https://api.tavily.com/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, urls: [topUrl] }),
      });
      if (!extractRes.ok) continue;
      const extractData = (await extractRes.json()) as TavilyExtractResponse;
      const page = extractData.results?.[0];
      if (!page) continue;
      const pageContent = (page.raw_content ?? page.content ?? "").slice(0, 5000);

      const completion = await groq.chat.completions.create({
        model: GROQ_PROCUREMENT_MODEL,
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `Extract real product info from this page. Return ONLY JSON: {"price":number|null,"catalog_number":string|null,"url":string}` },
          { role: "user", content: `Product: ${material.item}\nSupplier: ${material.supplier}\nURL: ${topUrl}\n\n${pageContent}` },
        ],
      });
      const parsed = JSON.parse(completion.choices[0]?.message?.content ?? "{}") as { price: number | null; catalog_number: string | null; url: string };
      if (parsed.price !== null && parsed.price > 0) target.estimated_price = parsed.price;
      if (parsed.catalog_number) target.catalog_number = parsed.catalog_number;
      if (parsed.url) target.url = parsed.url;
    } catch (e) { console.error(`Error processing ${material.item}:`, e); }
  }

  const budgetTotal = updatedMaterials.reduce((s, m) => s + (typeof m.estimated_price === "number" ? m.estimated_price : 0), 0);
  res.json({ materials: updatedMaterials, budget_total: Math.round(budgetTotal * 100) / 100 });
});

// ─── POST /api/generate ──────────────────────────────────────────────────────
// KEY CHANGES:
//  1. Accepts `user_id` in request body
//  2. Fetches user's equipment from Supabase and injects into system prompt
//  3. Instructs LLM to mark owned items as price:0 / supplier:"Available In-Lab"
//  4. Adds `application_justification` to the output schema & prompt

app.post("/api/generate", async (req: Request, res: Response) => {
  const { hypothesis, qc_summary, deep_literature, preferred_domains, user_id } =
    req.body as {
      hypothesis?: string;
      qc_summary?: string;
      deep_literature?: boolean;
      preferred_domains?: string[];
      user_id?: string;           // <-- NEW: authenticated user's Supabase ID
    };

  const targetDomains = preferred_domains?.length
    ? preferred_domains
    : [
        "pubmed.ncbi.nlm.nih.gov",
        "nature.com",
        "science.org",
        "arxiv.org",
        "ieeexplore.ieee.org",
        "github.com",
      ];

  if (!hypothesis?.trim()) {
    res.status(400).json({ error: "hypothesis is required." });
    return;
  }

  // ── 1. Fetch user equipment from Supabase ────────────────────────────────
  let userEquipment: string[] = [];
  if (user_id) {
    try {
      const { data, error } = await supabase
        .from("user_equipment")
        .select("item_name")
        .eq("user_id", user_id);
      if (!error && data) {
        userEquipment = data.map((row: { item_name: string }) => row.item_name);
        console.log(`✓ Fetched ${userEquipment.length} equipment item(s) for user ${user_id}`);
      }
    } catch (e) {
      console.error("Equipment fetch failed (non-fatal):", e);
    }
  }

  // ── 2. Build equipment injection block ───────────────────────────────────
  const equipmentBlock =
    userEquipment.length > 0
      ? `

---
EXISTING LAB INVENTORY (SMART PROCUREMENT):
CRITICAL PROCUREMENT RULE: You must explicitly list ALL major equipment and materials required to execute this protocol in the materials JSON array.

Compare the required items against the user's existing inventory: [ ${JSON.stringify(userEquipment)} ].
If a required item is already in their inventory, you MUST NOT skip it. You must add it to the materials array, but you must strictly set its estimated_price to 0, its supplier to 'Available In-Lab', and its url to null. It is mandatory that existing utilized equipment appears in the final output to prove resource efficiency to the grant board.
---`
      : "";

  // ── 3. Optionally fetch deep literature ─────────────────────────────────
  let deepLiteratureContext = "";
  if (deep_literature && process.env.TAVILY_API_KEY) {
    try {
      const tavilyRes = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: `${hypothesis} experimental protocol methods materials`,
          search_depth: "advanced",
          include_answer: false,
          max_results: 5,
          include_domains: targetDomains,
        }),
      });
      if (tavilyRes.ok) {
        const tavilyData = (await tavilyRes.json()) as TavilyResponse;
        const topUrls = getTopUrlsFromDifferentDomains(tavilyData.results ?? [], 2);
        if (topUrls.length > 0) {
          const extractRes = await fetch("https://api.tavily.com/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, urls: topUrls }),
          });
          if (extractRes.ok) {
            const extractData = (await extractRes.json()) as TavilyExtractResponse;
            deepLiteratureContext = (extractData.results ?? [])
              .map((r, i) => `[REFERENCE PROTOCOL ${i + 1}]\nTitle: ${r.title ?? "Unknown"}\nURL: ${r.url}\n\n${(r.raw_content ?? r.content ?? "").slice(0, 6000)}`)
              .join("\n\n" + "=".repeat(80) + "\n\n");
            deepLiteratureContext = clampText(
              deepLiteratureContext,
              GENERATE_LITERATURE_CHAR_BUDGET
            );
          }
        }
      }
    } catch (e) { console.error("Deep literature fetch failed:", e); }
  }

  // ── 4. Fetch past corrections ────────────────────────────────────────────
  let learnedKnowledge = "";
  try {
    const { data, error } = await supabase
      .from(CORRECTIONS_TABLE)
      .select("hypothesis, correction, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    if (!error && (data ?? []).length > 0) {
      const lines = (data as CorrectionRow[]).map((c, i) => `${i + 1}. ${c.correction.trim()}`).join("\n");
      learnedKnowledge = `\n\n---\nLEARNED KNOWLEDGE FROM EXPERT FEEDBACK:\n${lines}\n---`;
    }
  } catch (e) { console.error("Corrections fetch failed:", e); }

  // ── 5. Build system prompt ───────────────────────────────────────────────
  const literatureSection = deepLiteratureContext
    ? `\n\n---\nREFERENCE PROTOCOLS FROM LITERATURE:\n${deepLiteratureContext}\n---`
    : "";

  const targetDomainsSection = `

---
TARGET RESEARCH DOMAINS:
${targetDomains.join(", ")}

The user is targeting research standards from the following domains: [${targetDomains.join(
    ", "
  )}]. When evaluating if their existing user_equipment is sufficient, ensure it meets the rigorous standards expected by these specific domains. Furthermore, tailor the application_justification to appeal to grant boards and reviewers typical of these specific domains.
---`;

  const systemPrompt = `You are a Principal Investigator (PI) at a top-tier research institution with 20+ years of hands-on experimental biology experience.
Generate a hyper-realistic, operationally complete experiment plan for the given hypothesis.

You MUST return a single, valid JSON object matching this TypeScript interface exactly:

interface ProtocolStep {
  step_number: number;
  title: string;
  description: string;   // Full operational detail (3–6 sentences)
  duration: string;
  key_parameters: Record<string, string>;
  safety_notes: string | null;
  editable: boolean;     // Always true
}

interface Material {
  item: string;
  supplier: string;       // Use "Available In-Lab" for owned equipment
  catalog_number: string; // Use "In-Lab Inventory" for owned equipment
  quantity: string;
  estimated_price: number; // 0 for in-lab items
  notes: string;
  url: string | null;     // null for in-lab items
}

interface TimelinePhase {
  phase: number;
  name: string;
  duration_weeks: number;
  week_range: string;
  description: string;
  dependencies: string[];
  deliverables: string[];
}

interface GenerateOutput {
  protocol: ProtocolStep[];         // 6–8 steps minimum
  materials: Material[];            // 10+ items minimum
  budget_total: number;             // Sum of ALL estimated_price values (including 0s)
  timeline_phases: TimelinePhase[]; // 6–10 phases
  application_justification: string; // 1-paragraph formal justification: explain the real-world application of this research and why this budget is necessary to achieve it. Reference the domain, potential patient/societal impact, and the specific gaps this experiment fills.
}

Critical rules:
- budget_total MUST equal the exact arithmetic sum of all material estimated_price values.
- Return ONLY the raw JSON object. No markdown, no code fences.${targetDomainsSection}${equipmentBlock}${literatureSection}${learnedKnowledge}`;

  // ── 6. Call Groq ─────────────────────────────────────────────────────────
  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_GENERATE_MODEL,
      temperature: 0.3,
      max_tokens: GROQ_GENERATE_MAX_TOKENS,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Scientific Hypothesis: "${hypothesis}"\n\nLiterature Context: ${qc_summary ?? "No prior context. Treat as potentially novel."}\n\nGenerate the complete experiment plan JSON now.`,
        },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content ?? "{}";
    const output = JSON.parse(rawContent) as GenerateOutput;

    // ── Normalise output ─────────────────────────────────────────────────
    if (!Array.isArray(output.protocol)) output.protocol = [];
    if (!Array.isArray(output.materials)) output.materials = [];
    if (!Array.isArray(output.timeline_phases)) output.timeline_phases = [];
    if (typeof output.application_justification !== "string") {
      output.application_justification = "";
    }

    output.protocol = output.protocol.map((step, idx) => ({
      ...step,
      step_number: step.step_number ?? idx + 1,
      editable: true,
      key_parameters: step.key_parameters ?? {},
      safety_notes: step.safety_notes ?? null,
    }));

    output.materials = output.materials.map((m) => ({
      ...m,
      url: typeof m.url === "string" ? m.url : null,
    }));

    // Recompute budget_total (sum of all items, in-lab items contribute 0)
    const computedTotal = output.materials.reduce(
      (s, m) => s + (typeof m.estimated_price === "number" ? m.estimated_price : 0),
      0
    );
    output.budget_total = Math.round(computedTotal * 100) / 100;

    res.json(output);
  } catch (err) {
    console.error("/api/generate error:", err);
    res.status(500).json({ error: "Failed to generate experiment plan.", detail: String(err) });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🧪 The AI Scientist backend running on http://localhost:${PORT}`);
  console.log(`   GROQ_API_KEY   : ${process.env.GROQ_API_KEY ? "✓ set" : "✗ MISSING"}`);
  console.log(`   TAVILY_API_KEY : ${process.env.TAVILY_API_KEY ? "✓ set" : "✗ MISSING"}`);
  console.log(`   SUPABASE_URL   : ${SUPABASE_URL ? "✓ set" : "✗ MISSING"}`);
});

module.exports = app;