import { useState, useCallback } from "react";
import { toast } from "sonner";
import { FlaskConical, Microscope } from "lucide-react";
import AuroraBackground from "@/components/layout/AuroraBackground";
import TopNav from "@/components/layout/TopNav";
import HypothesisInput from "@/components/scientist/HypothesisInput";
import LoadingState from "@/components/scientist/LoadingState";
import NoveltyCard from "@/components/scientist/NoveltyCard";
import ProtocolStepper from "@/components/scientist/ProtocolStepper";
import MaterialsTable from "@/components/scientist/MaterialsTable";
import TimelineBar from "@/components/scientist/TimelineBar";
import EquipmentManager from "@/components/scientist/EquipmentManager";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import type { ExperimentData, NoveltyCheck } from "@/data/mockExperimentPlan";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

type LoadingPhase = "idle" | "qc" | "generating" | "done";

type LiteratureOptions = {
  deepLiterature: boolean;
};

const asFriendlyNetworkError = (err: unknown) => {
  if (err instanceof TypeError && /fetch/i.test(err.message)) {
    return `Cannot reach backend at ${API_BASE}. Start backend server and verify /health is reachable.`;
  }

  return err instanceof Error ? err.message : "An unknown error occurred.";
};

const Index = () => {
  const { profile } = useAuth();

  const [hypothesis, setHypothesis] = useState("");
  const [preferredDomains, setPreferredDomains] = useState("");
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("idle");
  const [experimentData, setExperimentData] = useState<ExperimentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("experiment");

  const parsedPreferredDomains = preferredDomains
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);

  // ── Submit handler ─────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async (h: string, options?: LiteratureOptions) => {
    setHypothesis(h);
    setError(null);
    setExperimentData(null);
    setLoadingPhase("qc");

    const deepLiterature = options?.deepLiterature ?? false;

    try {
      const healthRes = await fetch(`${API_BASE}/health`, { method: "GET" });
      if (!healthRes.ok) {
        throw new Error(`Backend health check failed (${healthRes.status}).`);
      }

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
          deep_literature: deepLiterature,
          preferred_domains: parsedPreferredDomains,
        }),
      });

      if (!generateRes.ok) {
        const errBody = await generateRes.json().catch(() => ({}));
        throw new Error(errBody.error ?? `Generation request failed (${generateRes.status})`);
      }

      const generated = await generateRes.json();

      const generatedMaterials = Array.isArray(generated.materials) ? generated.materials : [];
      let finalMaterials = generatedMaterials;
      let finalBudgetTotal = generated.budget_total ?? 0;

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
            description: errBody.error ?? `Could not enrich materials (${procurementRes.status}).`,
          });
        }
      }

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
      toast.success("Experiment plan ready", { description: "Novelty assessed · Protocol generated" });
    } catch (err) {
      const message = asFriendlyNetworkError(err);
      setError(message);
      setLoadingPhase("idle");
      toast.error("Generation failed", { description: message });
    }
  }, [parsedPreferredDomains]);

  // ── Correction callback ────────────────────────────────────────────────────

  const handleCorrectionSubmit = useCallback(async (correction: string) => {
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
      toast.success("Correction saved", { description: "Your feedback has been added to the intelligence loop." });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save correction.";
      toast.error("Correction failed", { description: message });
    }
  }, [hypothesis]);

  // ── Reset ──────────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    setLoadingPhase("idle");
    setHypothesis("");
    setPreferredDomains("");
    setExperimentData(null);
    setError(null);
  }, []);

  const isLoadingQC = loadingPhase === "qc";
  const isLoadingGeneration = loadingPhase === "generating";
  const isLoading = isLoadingQC || isLoadingGeneration;
  const showResults = loadingPhase === "done" && experimentData !== null;

  return (
    <div className="relative min-h-screen text-foreground">
      <AuroraBackground />
      <TopNav onReset={handleReset} showReset={showResults} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        {/* ── Tabs ── */}
        <div className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="glass border-border/15 bg-card/40 backdrop-blur-xl mb-6">
              <TabsTrigger
                value="experiment"
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-none gap-2"
              >
                <FlaskConical className="h-3.5 w-3.5" />
                New Experiment
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-none gap-2"
              >
                <Microscope className="h-3.5 w-3.5" />
                Lab Profile
              </TabsTrigger>
            </TabsList>

            {/* ── Tab 1: Experiment ── */}
            <TabsContent value="experiment">
              {/* Input view */}
              {loadingPhase === "idle" && (
                <HypothesisInput
                  onSubmit={handleSubmit}
                  preferredDomains={preferredDomains}
                  onPreferredDomainsChange={setPreferredDomains}
                />
              )}

              {/* Error state */}
              {loadingPhase === "idle" && error && (
                <div className="mx-auto mt-4 max-w-2xl animate-fade-up rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
                  <p className="font-semibold">Something went wrong</p>
                  <p className="mt-1 text-destructive/80">{error}</p>
                </div>
              )}

              {/* Loading view */}
              {isLoading && (
                <LoadingState isLoadingQC={isLoadingQC} isLoadingGeneration={isLoadingGeneration} />
              )}

              {/* Results view */}
              {showResults && experimentData && (
                <div className="space-y-6 pt-2">
                  <div className="animate-fade-up">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Hypothesis</p>
                    <h1 className="mt-1 max-w-4xl text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                      {hypothesis}
                    </h1>
                  </div>

                  <NoveltyCard
                    signal={experimentData.novelty_check.signal}
                    summary={experimentData.novelty_check.summary}
                    references={experimentData.novelty_check.references}
                  />

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

                  <TimelineBar phases={experimentData.timeline_phases} />
                </div>
              )}
            </TabsContent>

            {/* ── Tab 2: Lab Profile ── */}
            <TabsContent value="profile">
              <div className="max-w-2xl mx-auto py-6 space-y-6">
                {/* Profile summary card */}
                {profile && (
                  <div className="glass-strong p-6 space-y-4 animate-fade-up">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">Researcher Profile</h2>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {[
                        { label: "Full Name", value: profile.full_name },
                        { label: "Role", value: profile.role },
                        { label: "Organization", value: profile.organization },
                        { label: "Department", value: profile.department },
                      ].map(({ label, value }) => (
                        <div key={label} className="space-y-1">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
                          <p className="font-medium text-foreground">{value || "—"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Equipment manager */}
                <div className="glass-strong p-6 animate-fade-up">
                  {profile ? (
                    <EquipmentManager profileId={profile.id} />
                  ) : (
                    <div className="glass p-8 text-center animate-fade-up">
                      <p className="text-muted-foreground text-sm">Loading profile...</p>
                    </div>
                  )}
                </div>

                {!profile && (
                  <div className="glass p-8 text-center animate-fade-up">
                    <p className="text-muted-foreground text-sm">No profile found. Please register to create one.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Index;