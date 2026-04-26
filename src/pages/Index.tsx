import { useState, useCallback } from "react";
import { toast } from "sonner";
import AuroraBackground from "@/components/layout/AuroraBackground";
import TopNav from "@/components/layout/TopNav";
import HypothesisInput from "@/components/scientist/HypothesisInput";
import LoadingState from "@/components/scientist/LoadingState";
import NoveltyCard from "@/components/scientist/NoveltyCard";
import ProtocolStepper from "@/components/scientist/ProtocolStepper";
import MaterialsTable from "@/components/scientist/MaterialsTable";
import TimelineBar from "@/components/scientist/TimelineBar";
import type { ExperimentData, NoveltyCheck } from "@/data/mockExperimentPlan";

const API_BASE = "http://localhost:3001";

type LoadingPhase = "idle" | "qc" | "generating" | "done";

const Index = () => {
  const [hypothesis, setHypothesis] = useState("");
  const [preferredDomains, setPreferredDomains] = useState("");
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("idle");
  const [experimentData, setExperimentData] = useState<ExperimentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parsedPreferredDomains = preferredDomains
    .split(",")
    .map((domain) => domain.trim())
    .filter(Boolean);

  // ── Submit handler: QC → Generate ──────────────────────────────────────────
  const handleSubmit = useCallback(async (h: string) => {
    setHypothesis(h);
    setError(null);
    setExperimentData(null);
    setLoadingPhase("qc");

    try {
      // Step 1: Literature QC
      const qcRes = await fetch(`${API_BASE}/api/qc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hypothesis: h,
          preferred_domains: parsedPreferredDomains,
        }),
      });

      if (!qcRes.ok) {
        const errBody = await qcRes.json().catch(() => ({}));
        throw new Error(errBody.error ?? `QC request failed (${qcRes.status})`);
      }

      const noveltyCheck: NoveltyCheck = await qcRes.json();

      // Step 2: Generation
      setLoadingPhase("generating");

      const generateRes = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hypothesis: h,
          qc_summary: noveltyCheck.summary,
          preferred_domains: parsedPreferredDomains,
        }),
      });

      if (!generateRes.ok) {
        const errBody = await generateRes.json().catch(() => ({}));
        throw new Error(errBody.error ?? `Generation request failed (${generateRes.status})`);
      }

      const generated = await generateRes.json();

      const generatedMaterials = Array.isArray(generated.materials)
        ? generated.materials
        : [];

      let finalMaterials = generatedMaterials;
      let finalBudgetTotal = generated.budget_total ?? 0;

      // Enrich materials with supplier URLs and fresher pricing from procurement.
      if (generatedMaterials.length > 0) {
        const procurementRes = await fetch(`${API_BASE}/api/procurement`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ materials: generatedMaterials }),
        });

        if (procurementRes.ok) {
          const procurementData = await procurementRes.json();
          finalMaterials = Array.isArray(procurementData.materials)
            ? procurementData.materials
            : generatedMaterials;
          finalBudgetTotal =
            typeof procurementData.budget_total === "number"
              ? procurementData.budget_total
              : finalBudgetTotal;
        } else {
          const errBody = await procurementRes.json().catch(() => ({}));
          toast.warning("Procurement enrichment skipped", {
            description:
              errBody.error ??
              `Could not enrich materials with live supplier links (${procurementRes.status}).`,
          });
        }
      }

      // Merge novelty check with generated plan into ExperimentData shape
      const fullData: ExperimentData = {
        hypothesis: h,
        novelty_check: noveltyCheck,
        protocol: generated.protocol ?? [],
        materials: finalMaterials,
        budget_total: finalBudgetTotal,
        timeline_phases: generated.timeline_phases ?? [],
      };

      setExperimentData(fullData);
      setLoadingPhase("done");

      toast.success("Experiment plan ready", {
        description: "Novelty assessed · Protocol generated",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(message);
      setLoadingPhase("idle");
      toast.error("Generation failed", { description: message });
    }
  }, [parsedPreferredDomains]);

  // ── Correction submission callback ─────────────────────────────────────────
  const handleCorrectionSubmit = useCallback(
    async (correction: string) => {
      try {
        const res = await fetch(`${API_BASE}/api/corrections`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hypothesis, correction }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error ?? `Failed to save correction (${res.status})`);
        }

        toast.success("Correction saved", {
          description: "Your feedback has been added to the intelligence loop.",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not save correction.";
        toast.error("Correction failed", { description: message });
      }
    },
    [hypothesis],
  );

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setLoadingPhase("idle");
    setHypothesis("");
    setPreferredDomains("");
    setExperimentData(null);
    setError(null);
  }, []);

  // ── Derived booleans for LoadingState ──────────────────────────────────────
  const isLoadingQC = loadingPhase === "qc";
  const isLoadingGeneration = loadingPhase === "generating";
  const isLoading = isLoadingQC || isLoadingGeneration;
  const showResults = loadingPhase === "done" && experimentData !== null;

  return (
    <div className="relative min-h-screen text-foreground">
      <AuroraBackground />
      <TopNav onReset={handleReset} showReset={showResults} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        {/* ── Input view ── */}
        {loadingPhase === "idle" && (
          <HypothesisInput
            onSubmit={handleSubmit}
            preferredDomains={preferredDomains}
            onPreferredDomainsChange={setPreferredDomains}
          />
        )}

        {/* ── Error state ── */}
        {loadingPhase === "idle" && error && (
          <div className="mx-auto mt-4 max-w-2xl animate-fade-up rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
            <p className="font-semibold">Something went wrong</p>
            <p className="mt-1 text-destructive/80">{error}</p>
          </div>
        )}

        {/* ── Loading view ── */}
        {isLoading && (
          <LoadingState
            isLoadingQC={isLoadingQC}
            isLoadingGeneration={isLoadingGeneration}
          />
        )}

        {/* ── Results view ── */}
        {showResults && experimentData && (
          <div className="space-y-6 pt-8">
            {/* Hypothesis recap */}
            <div className="animate-fade-up">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Hypothesis
              </p>
              <h1 className="mt-1 max-w-4xl text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {hypothesis}
              </h1>
            </div>

            {/* Novelty */}
            <NoveltyCard
              signal={experimentData.novelty_check.signal}
              summary={experimentData.novelty_check.summary}
              references={experimentData.novelty_check.references}
            />

            {/* Protocol + Materials */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ProtocolStepper
                  steps={experimentData.protocol}
                  onCorrectionSubmit={handleCorrectionSubmit}
                />
              </div>
              <div className="lg:col-span-1">
                <MaterialsTable
                  materials={experimentData.materials}
                  totalCost={experimentData.budget_total}
                />
              </div>
            </div>

            {/* Timeline */}
            <TimelineBar phases={experimentData.timeline_phases} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;