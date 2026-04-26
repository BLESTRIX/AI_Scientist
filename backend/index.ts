const express = require("express") as typeof import("express");
const cors = require("cors") as typeof import("cors");
const dotenv = require("dotenv") as typeof import("dotenv");
const Groq = require("groq-sdk").default as typeof import("groq-sdk").default;
const { Client, Databases, ID, Query } =
  require("node-appwrite") as typeof import("node-appwrite");

type Request = import("express").Request;
type Response = import("express").Response;

dotenv.config();

// ─── Types (mirrored from src/data/mockExperimentPlan.ts) ────────────────────

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

interface GenerateOutput {
  protocol: ProtocolStep[];
  materials: Material[];
  budget_total: number;
  timeline_phases: TimelinePhase[];
}

// ─── Tavily types ─────────────────────────────────────────────────────────────

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

interface ProcurementOutput {
  materials: Material[];
  budget_total?: number;
}

// ─── Appwrite correction document shape ───────────────────────────────────────

interface CorrectionDocument {
  $id: string;
  $createdAt: string;
  hypothesis: string;
  correction: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const APPWRITE_DB_ID = "ai_scientist_db";
const APPWRITE_COLLECTION_ID = "corrections";
const GROQ_QC_MODEL = process.env.GROQ_QC_MODEL ?? "llama-3.3-70b-versatile";
const GROQ_GENERATE_MODEL =
  process.env.GROQ_GENERATE_MODEL ?? "llama-3.3-70b-versatile";
const GROQ_PROCUREMENT_MODEL = "llama3-70b-8192";
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

// ─── Init: Express ────────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT ?? 3001;

const configuredOrigins = (process.env.FRONTEND_URL ?? "")
  .split(",")
  .map((o: string) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser tools (curl/Postman) and local dev servers.
      if (!origin) {
        callback(null, true);
        return;
      }

      const isLocalDevOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(
        origin,
      );

      if (isLocalDevOrigin || configuredOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
  }),
);
app.use(express.json());

// ─── Init: Groq ───────────────────────────────────────────────────────────────

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Init: Appwrite ───────────────────────────────────────────────────────────

const appwriteClient = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1")
  .setProject(process.env.APPWRITE_PROJECT_ID ?? "")
  .setKey(process.env.APPWRITE_API_KEY ?? "");

const db = new Databases(appwriteClient);

// ─── Helper: Extract domain from URL ──────────────────────────────────────────

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// ─── Helper: Get top N URLs from different domains ────────────────────────────

function getTopUrlsFromDifferentDomains(
  results: TavilyResult[],
  maxUrls: number,
): string[] {
  const seenDomains = new Set<string>();
  const selectedUrls: string[] = [];

  for (const result of results) {
    if (selectedUrls.length >= maxUrls) break;

    const domain = extractDomain(result.url);
    if (!seenDomains.has(domain)) {
      seenDomains.add(domain);
      selectedUrls.push(result.url);
    }
  }

  return selectedUrls;
}

// ─── Health check ─────────────────────────────────────────────────────────────

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── POST /api/corrections ────────────────────────────────────────────────────

app.post("/api/corrections", async (req: Request, res: Response) => {
  const { hypothesis, correction } = req.body as {
    hypothesis?: string;
    correction?: string;
  };

  if (
    !hypothesis ||
    typeof hypothesis !== "string" ||
    hypothesis.trim().length === 0
  ) {
    res
      .status(400)
      .json({ error: "hypothesis is required and must be a non-empty string." });
    return;
  }

  if (
    !correction ||
    typeof correction !== "string" ||
    correction.trim().length === 0
  ) {
    res
      .status(400)
      .json({ error: "correction is required and must be a non-empty string." });
    return;
  }

  try {
    await db.createDocument(
      APPWRITE_DB_ID,
      APPWRITE_COLLECTION_ID,
      ID.unique(),
      {
        hypothesis: hypothesis.trim(),
        correction: correction.trim(),
      },
    );

    res.json({
      success: true,
      message: "Correction saved to feedback loop.",
    });
  } catch (err) {
    console.error("/api/corrections Appwrite error:", err);
    res.status(500).json({
      error: "Failed to save correction.",
      detail: String(err),
    });
  }
});

// ─── POST /api/qc ─────────────────────────────────────────────────────────────
// UPGRADED: Now uses Tavily /extract for deep literature content

app.post("/api/qc", async (req: Request, res: Response) => {
  const { hypothesis, preferred_domains } = req.body as {
    hypothesis?: string;
    preferred_domains?: string[];
  };

  if (
    !hypothesis ||
    typeof hypothesis !== "string" ||
    hypothesis.trim().length === 0
  ) {
    res
      .status(400)
      .json({ error: "hypothesis is required and must be a non-empty string." });
    return;
  }

  // ── Step 1: Tavily literature search with methodology focus ──────────────────
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
        include_domains:
          preferred_domains && preferred_domains.length > 0
            ? preferred_domains
            : DEFAULT_DOMAINS,
      }),
    });

    if (!tavilyRes.ok) {
      console.error(
        `Tavily API error: ${tavilyRes.status} ${tavilyRes.statusText}`,
      );
    } else {
      const tavilyData = (await tavilyRes.json()) as TavilyResponse;
      tavilyAnswer = tavilyData.answer ?? "";
      tavilyResults = tavilyData.results ?? [];
    }
  } catch (tavilyErr) {
    console.error("Tavily fetch failed:", tavilyErr);
  }

  // ── Step 2: Extract full content from top 2 URLs (different domains) ─────────
  let extractedContent = "";
  const topUrls = getTopUrlsFromDifferentDomains(tavilyResults, 2);

  if (topUrls.length > 0 && process.env.TAVILY_API_KEY) {
    try {
      const extractRes = await fetch("https://api.tavily.com/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          urls: topUrls,
        }),
      });

      if (!extractRes.ok) {
        console.error(
          `Tavily extract error: ${extractRes.status} ${extractRes.statusText}`,
        );
      } else {
        const extractData = (await extractRes.json()) as TavilyExtractResponse;
        const extractResults = extractData.results ?? [];

        if (extractResults.length > 0) {
          extractedContent = extractResults
            .map(
              (result, idx) =>
                `[EXTRACTED PAPER ${idx + 1}]\nTitle: ${result.title ?? "Unknown"}\nURL: ${result.url}\n\nFull Content (focus on Methods/Experimental Setup):\n${(result.raw_content ?? result.content ?? "").slice(0, 8000)}`,
            )
            .join("\n\n" + "=".repeat(80) + "\n\n");

          console.log(
            `✓ Extracted ${extractResults.length} full research papers for deep analysis`,
          );
        }
      }
    } catch (extractErr) {
      console.error("Tavily extract failed:", extractErr);
    }
  }

  // ── Step 3: Build literature context (snippets + deep content) ───────────────
  const snippetContext =
    tavilyResults.length > 0
      ? tavilyResults
          .map(
            (r, i) =>
              `[SNIPPET ${i + 1}] Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.content.slice(0, 500)}`,
          )
          .join("\n\n")
      : "No results returned from literature search.";

  const fullLiteratureContext = extractedContent
    ? `${extractedContent}\n\n${"=".repeat(80)}\n\nADDITIONAL SNIPPETS:\n${snippetContext}`
    : snippetContext;

  // ── Step 4: Groq novelty evaluation with deep research content ───────────────
  const systemPrompt = `You are a rigorous scientific peer-reviewer with expertise in biomedical research.
Your task is to evaluate a user's scientific hypothesis against the provided literature context and classify its novelty.

IMPORTANT: You have been provided with FULL EXTRACTED RESEARCH PAPERS, not just snippets. Pay special attention to the Methods/Experimental Setup sections to understand exactly what has been done before.

You MUST return a single, valid JSON object that exactly matches this TypeScript interface:

interface Reference {
  title: string;        // Full paper title
  url: string;         // Direct DOI or PubMed URL
  authors: string;     // Author list as a string, e.g. "Smith, J., Doe, A."
  journal: string;     // Journal name
  year: number;        // Publication year as integer
}

interface NoveltyCheck {
  signal: "not found" | "similar work exists" | "exact match found";
  summary: string;     // 3–5 sentence scientific rationale for the signal. Reference specific methodologies from the extracted papers if relevant.
  references: Reference[]; // 1–3 most relevant references from the context. If no real references exist, return an empty array.
}

Rules:
- "not found": No closely related prior work was found in the literature context.
- "similar work exists": Related approaches or partial overlap with the hypothesis exist, but the exact combination, model, dosage, or endpoints are distinct. BE SPECIFIC about what differs.
- "exact match found": The hypothesis has already been directly tested and published with the same methodology.
- Extract references ONLY from the provided literature context. Do not invent citations.
- Use the extracted full-text content to assess methodology overlap accurately.
- Return ONLY the raw JSON object. No markdown, no code fences, no explanation outside the JSON.`;

  const userMessage = `Hypothesis to evaluate:
"${hypothesis}"

Literature search answer:
${tavilyAnswer || "No answer summary available."}

Deep Literature Context (Full Papers + Snippets):
${fullLiteratureContext}

Return the NoveltyCheck JSON object now.`;

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_QC_MODEL,
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content ?? "{}";
    const noveltyCheck = JSON.parse(rawContent) as NoveltyCheck;

    if (!Array.isArray(noveltyCheck.references)) {
      noveltyCheck.references = [];
    }

    res.json(noveltyCheck);
  } catch (err) {
    console.error("/api/qc Groq error:", err);
    res
      .status(500)
      .json({ error: "Failed to evaluate novelty.", detail: String(err) });
  }
});

// ─── POST /api/procurement ────────────────────────────────────────────────────
// UPGRADED: Per-item search with Tavily extract for real-time pricing

app.post("/api/procurement", async (req: Request, res: Response) => {
  const { materials } = req.body as { materials?: Material[] };

  if (!Array.isArray(materials)) {
    res.status(400).json({ error: "materials is required and must be an array." });
    return;
  }

  const normalizedMaterials = materials
    .filter(
      (material): material is Material =>
        Boolean(material) &&
        typeof material === "object" &&
        typeof material.item === "string" &&
        typeof material.supplier === "string" &&
        typeof material.catalog_number === "string" &&
        typeof material.quantity === "string" &&
        typeof material.estimated_price === "number" &&
        typeof material.notes === "string",
    )
    .map((material) => ({
      ...material,
      url: typeof material.url === "string" ? material.url : null,
    }));

  if (normalizedMaterials.length === 0) {
    res.status(400).json({ error: "materials must contain at least one valid item." });
    return;
  }

  // ── Process top items (by price) individually for accurate procurement ───────
  const itemsToProcess = [...normalizedMaterials]
    .sort((a, b) => b.estimated_price - a.estimated_price)
    .slice(0, Math.min(10, normalizedMaterials.length));

  const updatedMaterials = [...normalizedMaterials];

  for (const material of itemsToProcess) {
    const materialIndex = normalizedMaterials.findIndex(
      (m) => m.item === material.item && m.supplier === material.supplier,
    );

    if (materialIndex === -1) continue;

    const targetMaterial = updatedMaterials[materialIndex];
    if (!targetMaterial) continue;

    try {
      // Step 1: Search for the specific item
      const searchQuery = `buy ${material.item} ${material.supplier} catalog price`;
      console.log(`🔍 Searching for: ${searchQuery}`);

      const searchRes = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: searchQuery,
          search_depth: "basic",
          include_answer: false,
          max_results: 3,
        }),
      });

      if (!searchRes.ok) {
        console.error(
          `Tavily search error for ${material.item}: ${searchRes.status}`,
        );
        continue;
      }

      const searchData = (await searchRes.json()) as TavilyResponse;
      const searchResults = searchData.results ?? [];

      if (searchResults.length === 0) {
        console.log(`⚠️  No results for ${material.item}`);
        continue;
      }

      // Step 2: Extract the top URL to get full product page
      const topResult = searchResults[0];
      if (!topResult?.url) {
        console.log(`⚠️  Top search result missing URL for ${material.item}`);
        continue;
      }

      const topUrl = topResult.url;
      console.log(`📄 Extracting: ${topUrl}`);

      const extractRes = await fetch("https://api.tavily.com/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          urls: [topUrl],
        }),
      });

      if (!extractRes.ok) {
        console.error(
          `Tavily extract error for ${material.item}: ${extractRes.status}`,
        );
        continue;
      }

      const extractData = (await extractRes.json()) as TavilyExtractResponse;
      const extractResults = extractData.results ?? [];

      if (extractResults.length === 0) {
        console.log(`⚠️  No extracted content for ${material.item}`);
        continue;
      }

      const extractedPage = extractResults[0];
      if (!extractedPage) {
        console.log(`⚠️  Extracted result missing page content for ${material.item}`);
        continue;
      }

      const pageContent = (
        extractedPage.raw_content ??
        extractedPage.content ??
        ""
      ).slice(0, 5000);

      // Step 3: Use Groq to parse the page and extract real pricing
      const promptSystem = `You are a laboratory procurement specialist. Extract real product information from the provided webpage content.

Return ONLY a JSON object with this structure:
{
  "price": number | null,           // Real price in USD. Extract from "$123.45" or similar. Return null if not found.
  "catalog_number": string | null,  // Real catalog/SKU number. Return null if not found.
  "url": string                     // The product page URL
}

Rules:
- Extract the EXACT price visible on the page
- Look for catalog numbers, SKU, product ID, etc.
- If price is not found or unclear, return null for price
- Return ONLY the JSON object, no markdown, no explanations`;

      const promptUser = `Product: ${material.item}
Expected Supplier: ${material.supplier}

Webpage URL: ${topUrl}

Webpage Content:
${pageContent}

Extract the real price, catalog number, and confirm the URL.`;

      const completion = await groq.chat.completions.create({
        model: GROQ_PROCUREMENT_MODEL,
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: promptSystem },
          { role: "user", content: promptUser },
        ],
      });

      const rawContent = completion.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(rawContent) as {
        price: number | null;
        catalog_number: string | null;
        url: string;
      };

      // Update the material with real data
      if (parsed.price !== null && parsed.price > 0) {
        targetMaterial.estimated_price = parsed.price;
        console.log(`✓ Updated price for ${material.item}: $${parsed.price}`);
      }

      if (parsed.catalog_number) {
        targetMaterial.catalog_number = parsed.catalog_number;
      }

      if (parsed.url) {
        targetMaterial.url = parsed.url;
      }
    } catch (itemErr) {
      // Graceful fallback: keep original estimate
      console.error(`Error processing ${material.item}:`, itemErr);
      continue;
    }
  }

  // Recalculate budget total
  const budgetTotal = updatedMaterials.reduce(
    (sum, m) => sum + (typeof m.estimated_price === "number" ? m.estimated_price : 0),
    0,
  );

  res.json({
    materials: updatedMaterials,
    budget_total: Math.round(budgetTotal * 100) / 100,
  });
});

// ─── POST /api/generate ───────────────────────────────────────────────────────
// UPGRADED: Can optionally use deep literature context

app.post("/api/generate", async (req: Request, res: Response) => {
  const { hypothesis, qc_summary, deep_literature, preferred_domains } =
    req.body as {
    hypothesis?: string;
    qc_summary?: string;
    deep_literature?: boolean;
    preferred_domains?: string[];
  };

  if (
    !hypothesis ||
    typeof hypothesis !== "string" ||
    hypothesis.trim().length === 0
  ) {
    res
      .status(400)
      .json({ error: "hypothesis is required and must be a non-empty string." });
    return;
  }

  // ── Step 1: Optionally fetch deep literature if requested ────────────────────
  let deepLiteratureContext = "";

  if (deep_literature && process.env.TAVILY_API_KEY) {
    try {
      console.log("📚 Fetching deep literature for protocol generation...");

      // Search for experimental protocols
      const tavilyRes = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: `${hypothesis} experimental protocol methods materials`,
          search_depth: "advanced",
          include_answer: false,
          max_results: 5,
          include_domains:
            preferred_domains && preferred_domains.length > 0
              ? preferred_domains
              : DEFAULT_DOMAINS,
        }),
      });

      if (tavilyRes.ok) {
        const tavilyData = (await tavilyRes.json()) as TavilyResponse;
        const results = tavilyData.results ?? [];

        // Extract top 2 from different domains
        const topUrls = getTopUrlsFromDifferentDomains(results, 2);

        if (topUrls.length > 0) {
          const extractRes = await fetch("https://api.tavily.com/extract", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              api_key: process.env.TAVILY_API_KEY,
              urls: topUrls,
            }),
          });

          if (extractRes.ok) {
            const extractData =
              (await extractRes.json()) as TavilyExtractResponse;
            const extractResults = extractData.results ?? [];

            if (extractResults.length > 0) {
              deepLiteratureContext = extractResults
                .map(
                  (result, idx) =>
                    `[REFERENCE PROTOCOL ${idx + 1}]\nTitle: ${result.title ?? "Unknown"}\nURL: ${result.url}\n\nMethods/Protocol Content:\n${(result.raw_content ?? result.content ?? "").slice(0, 6000)}`,
                )
                .join("\n\n" + "=".repeat(80) + "\n\n");

              console.log(
                `✓ Extracted ${extractResults.length} reference protocols for generation`,
              );
            }
          }
        }
      }
    } catch (litErr) {
      console.error("Deep literature fetch failed:", litErr);
    }
  }

  // ── Step 2: Fetch past corrections from Appwrite (non-fatal) ─────────────────
  let learnedKnowledge = "";

  try {
    const correctionDocs = await db.listDocuments(
      APPWRITE_DB_ID,
      APPWRITE_COLLECTION_ID,
      [Query.limit(5), Query.orderDesc("$createdAt")],
    );

    const corrections =
      correctionDocs.documents as unknown as CorrectionDocument[];

    if (corrections.length > 0) {
      const correctionLines = corrections
        .map((doc, i) => `${i + 1}. ${doc.correction.trim()}`)
        .join("\n");

      learnedKnowledge = `

---
LEARNED KNOWLEDGE FROM EXPERT SCIENTIST FEEDBACK:
Note: Past scientists have made the following corrections to previous experiment plans. Learn from these and incorporate this knowledge if relevant to the current hypothesis:
${correctionLines}
---`;

      console.log(
        `Injecting ${corrections.length} past correction(s) into system prompt.`,
      );
    }
  } catch (appwriteErr) {
    console.error(
      "Appwrite corrections fetch failed — continuing without feedback data:",
      appwriteErr,
    );
  }

  // ── Step 3: Build enhanced system prompt with optional deep literature ───────
  const literatureSection = deepLiteratureContext
    ? `

---
REFERENCE EXPERIMENTAL PROTOCOLS FROM LITERATURE:
The following are real experimental setups from published research. Use these as reference templates for realistic protocol design, but adapt them to the specific hypothesis:

${deepLiteratureContext}
---`
    : "";

  const systemPrompt = `You are a Principal Investigator (PI) at a top-tier research institution with 20+ years of hands-on experimental biology experience.
Your task is to generate a hyper-realistic, operationally complete experiment plan for a given scientific hypothesis.

${literatureSection ? "IMPORTANT: You have been provided with REAL EXPERIMENTAL PROTOCOLS from published research. Study their Methods sections carefully and base your protocol steps, materials, and timeline on these real-world examples. Adapt the methodologies to fit the specific hypothesis." : ""}

You MUST return a single, valid JSON object that exactly matches this TypeScript structure:

interface ProtocolStep {
  step_number: number;          // Sequential integer starting at 1
  title: string;                // Short imperative title, e.g. "Animal Acclimation and Randomization"
  description: string;          // Full operational detail (3–6 sentences). Include specific instruments, volumes, temperatures, speeds, and timing.
  duration: string;             // Human-readable, e.g. "7 days" or "4–6 hours"
  key_parameters: Record<string, string>; // 4–10 specific key–value pairs, e.g. { "centrifugation": "1,000 × g, 10 min, 4°C" }
  safety_notes: string | null;  // PPE, hazardous reagent handling, or null if not applicable
  editable: boolean;            // Always true
}

interface Material {
  item: string;           // Descriptive product name
  supplier: string;       // Real supplier: Sigma-Aldrich, Thermo Fisher, Jackson Laboratory, Bio-Rad, Abcam, CST, BD Biosciences, etc.
  catalog_number: string; // Realistic catalog number format for that supplier
  quantity: string;       // e.g. "40 animals", "1 kit", "500 mL"
  estimated_price: number; // USD as a number (no dollar sign)
  notes: string;          // Usage tip, storage condition, or preparation note
  url: string | null;     // Real purchase URL when available, otherwise null
}

interface TimelinePhase {
  phase: number;            // Sequential integer starting at 1
  name: string;             // Phase name, e.g. "IACUC Approval and Reagent Procurement"
  duration_weeks: number;   // Integer number of weeks
  week_range: string;       // e.g. "Weeks 1–2" or "Week 3"
  description: string;      // 2–4 sentences describing what happens in this phase
  dependencies: string[];   // List of preceding phases this phase depends on, e.g. ["Phase 1: Animals received"]
  deliverables: string[];   // 2–5 concrete deliverable strings for this phase
}

interface GenerateOutput {
  protocol: ProtocolStep[];         // 6–8 steps minimum
  materials: Material[];            // 10+ items minimum
  budget_total: number;             // Exact arithmetic sum of all estimated_price values
  timeline_phases: TimelinePhase[]; // 6–10 phases minimum
}

Critical rules:
- budget_total MUST equal the exact mathematical sum of all material estimated_price values.
- All catalog numbers must follow real-world formats for the stated supplier.
- Protocol steps must be operationally sequential and scientifically coherent.
${literatureSection ? "- Base your protocol on the provided reference protocols, adapting them to the hypothesis." : ""}
- Return ONLY the raw JSON object. No markdown, no code fences, no commentary outside the JSON.${learnedKnowledge}${literatureSection}`;

  const userMessage = `Scientific Hypothesis:
"${hypothesis}"

Novelty / Literature Context:
${qc_summary ?? "No prior literature context provided. Treat as potentially novel."}

Generate the complete experiment plan JSON now. Be exhaustive, operationally specific, and scientifically rigorous.`;

  // ── Step 4: Call Groq ─────────────────────────────────────────────────────────
  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_GENERATE_MODEL,
      temperature: 0.3,
      max_tokens: 8192,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content ?? "{}";
    const output = JSON.parse(rawContent) as GenerateOutput;

    // ── Normalise & validate output shape ─────────────────────────────────────
    if (!Array.isArray(output.protocol)) output.protocol = [];
    if (!Array.isArray(output.materials)) output.materials = [];
    if (!Array.isArray(output.timeline_phases)) output.timeline_phases = [];

    // Ensure all protocol steps have editable: true
    output.protocol = output.protocol.map((step, idx) => ({
      ...step,
      step_number: step.step_number ?? idx + 1,
      editable: true,
      key_parameters: step.key_parameters ?? {},
      safety_notes: step.safety_notes ?? null,
    }));

    output.materials = output.materials.map((material) => ({
      ...material,
      url: typeof material.url === "string" ? material.url : null,
    }));

    // Recompute budget_total from materials to guarantee arithmetic correctness
    const computedTotal = output.materials.reduce(
      (sum, m) =>
        sum + (typeof m.estimated_price === "number" ? m.estimated_price : 0),
      0,
    );
    output.budget_total = Math.round(computedTotal * 100) / 100;

    res.json(output);
  } catch (err) {
    console.error("/api/generate Groq error:", err);
    res.status(500).json({
      error: "Failed to generate experiment plan.",
      detail: String(err),
    });
  }
});

// ─── Start server ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🧪 The AI Scientist backend running on http://localhost:${PORT}`);
  console.log(`   GROQ_API_KEY      : ${process.env.GROQ_API_KEY ? "✓ set" : "✗ MISSING"}`);
  console.log(`   TAVILY_API_KEY    : ${process.env.TAVILY_API_KEY ? "✓ set" : "✗ MISSING"}`);
  console.log(`   APPWRITE_ENDPOINT : ${process.env.APPWRITE_ENDPOINT ? "✓ set" : "✗ MISSING"}`);
  console.log(`   APPWRITE_PROJECT  : ${process.env.APPWRITE_PROJECT_ID ? "✓ set" : "✗ MISSING"}`);
  console.log(`   APPWRITE_API_KEY  : ${process.env.APPWRITE_API_KEY ? "✓ set" : "✗ MISSING"}`);
});

module.exports = app;