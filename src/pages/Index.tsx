import { useState, useCallback } from "react";
import { toast } from "sonner";
import { FlaskConical, Microscope, Download, Loader2, BookMarked, Save, MessageSquare } from "lucide-react";
import AuroraBackground from "@/components/layout/AuroraBackground";
import TopNav from "@/components/layout/TopNav";
import HypothesisInput from "@/components/scientist/HypothesisInput";
import LoadingState from "@/components/scientist/LoadingState";
import NoveltyCard from "@/components/scientist/NoveltyCard";
import ProtocolStepper from "@/components/scientist/ProtocolStepper";
import MaterialsTable from "@/components/scientist/MaterialsTable";
import TimelineBar from "@/components/scientist/TimelineBar";
import EquipmentManager from "@/components/scientist/EquipmentManager";
import SavedExperiments from "@/components/scientist/SAvedExperiments";
import CorrectionsHistory from "@/components/scientist/CorrectionHistory";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { ExperimentData, NoveltyCheck } from "@/data/mockExperimentPlan";
import type { SavedExperiment } from "@/components/scientist/SAvedExperiments";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

type LoadingPhase = "idle" | "qc" | "generating" | "done";

const asFriendlyNetworkError = (err: unknown) => {
  if (err instanceof TypeError && /fetch/i.test(err.message)) {
    return `Cannot reach backend at ${API_BASE}. Start the backend server and verify /health is reachable.`;
  }
  return err instanceof Error ? err.message : "An unknown error occurred.";
};

const Index = () => {
  const { user, profile } = useAuth();

  const [hypothesis, setHypothesis] = useState("");
  const [preferredDomains, setPreferredDomains] = useState("");
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("idle");
  const [experimentData, setExperimentData] = useState<ExperimentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("experiment");
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const parsedPreferredDomains = preferredDomains
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);

  // ── Submit handler ─────────────────────────────────────────────────────────

  const handleSubmit = useCallback(
    async (h: string) => {
      setHypothesis(h);
      setError(null);
      setExperimentData(null);
      setLoadingPhase("qc");

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
            preferred_domains: parsedPreferredDomains,
            user_id: user?.id,
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

        const fullData: ExperimentData & { application_justification?: string } = {
          hypothesis: h,
          novelty_check: noveltyCheck,
          protocol: generated.protocol ?? [],
          materials: finalMaterials,
          budget_total: finalBudgetTotal,
          timeline_phases: generated.timeline_phases ?? [],
          application_justification: generated.application_justification ?? "",
        };

        setExperimentData(fullData as ExperimentData);
        setLoadingPhase("done");
        toast.success("Experiment plan ready", {
          description: "Novelty assessed · Protocol generated · Smart procurement applied",
        });
      } catch (err) {
        const message = asFriendlyNetworkError(err);
        setError(message);
        setLoadingPhase("idle");
        toast.error("Generation failed", { description: message });
      }
    },
    [parsedPreferredDomains, user?.id]
  );

  // ── Save experiment handler ────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!experimentData || !user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from("saved_experiments").insert({
        user_id: user.id,
        hypothesis: experimentData.hypothesis,
        protocol_data: {
          protocol: experimentData.protocol,
          materials: experimentData.materials,
          timeline_phases: experimentData.timeline_phases,
          novelty_check: experimentData.novelty_check,
          application_justification: (experimentData as any).application_justification,
        },
        budget_total: experimentData.budget_total,
      });
      if (error) throw error;
      toast.success("Experiment saved!", {
        description: "Find it in the History tab for future reference.",
      });
    } catch (err: any) {
      toast.error("Save failed", { description: err?.message || "Could not save experiment." });
    } finally {
      setIsSaving(false);
    }
  }, [experimentData, user]);

  // ── Export handler ─────────────────────────────────────────────────────────

  const handleExport = useCallback(async () => {
    if (!experimentData) return;
    setIsExporting(true);
    try {
      const { exportExperimentToDocx } = await import("@/lib/exportDocx");
      await exportExperimentToDocx(experimentData, profile);
      toast.success("Proposal exported!", {
        description: "Your .docx file has been downloaded.",
      });
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Export failed", {
        description: err instanceof Error ? err.message : "Could not generate the document.",
      });
    } finally {
      setIsExporting(false);
    }
  }, [experimentData, profile]);

  // ── Load saved experiment ─────────────────────────────────────────────────

  const handleLoadSaved = useCallback((saved: SavedExperiment) => {
    if (!saved.protocol_data) return;
    const data: ExperimentData = {
      hypothesis: saved.hypothesis,
      novelty_check: saved.protocol_data.novelty_check ?? { signal: "not found", summary: "", references: [] },
      protocol: saved.protocol_data.protocol ?? [],
      materials: saved.protocol_data.materials ?? [],
      budget_total: saved.budget_total ?? 0,
      timeline_phases: saved.protocol_data.timeline_phases ?? [],
    };
    setHypothesis(saved.hypothesis);
    setExperimentData(data as any);
    setLoadingPhase("done");
    setActiveTab("experiment");
    toast.success("Experiment loaded", { description: "Protocol restored from saved history." });
  }, []);

  // ── Correction callback ────────────────────────────────────────────────────

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
    [hypothesis]
  );

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
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-none gap-2"
              >
                <BookMarked className="h-3.5 w-3.5" />
                History
              </TabsTrigger>
              <TabsTrigger
                value="corrections"
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-none gap-2"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Corrections
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
                <LoadingState
                  isLoadingQC={isLoadingQC}
                  isLoadingGeneration={isLoadingGeneration}
                />
              )}

              {/* Results view */}
              {showResults && experimentData && (
                <div className="space-y-6 pt-2">
                  {/* Hypothesis + action buttons row */}
                  <div className="animate-fade-up flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Hypothesis</p>
                      <h1 className="mt-1 max-w-4xl text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                        {hypothesis}
                      </h1>
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0">
                      {/* ── SAVE BUTTON ── */}
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        variant="outline"
                        className="border-border/20 bg-card/40 hover:bg-card/70 gap-2"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving…
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save
                          </>
                        )}
                      </Button>

                      {/* ── EXPORT BUTTON ── */}
                      <Button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 neon-glow gap-2"
                      >
                        {isExporting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Exporting…
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            Export Proposal (.docx)
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <NoveltyCard
                    signal={experimentData.novelty_check.signal}
                    summary={experimentData.novelty_check.summary}
                    references={experimentData.novelty_check.references}
                  />

                  {(experimentData as any).application_justification && (
                    <div className="glass-strong p-6 animate-fade-up">
                      <p className="text-xs font-semibold uppercase tracking-wider text-secondary mb-2">
                        Application & Real-World Impact
                      </p>
                      <p className="text-sm leading-relaxed text-foreground/90">
                        {(experimentData as any).application_justification}
                      </p>
                    </div>
                  )}

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

                  {/* Bottom export CTA */}
                  <div className="flex justify-center gap-3 pt-4 animate-fade-up">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      variant="outline"
                      size="lg"
                      className="border-border/20 bg-card/40 hover:bg-card/70 gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save to History
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleExport}
                      disabled={isExporting}
                      size="lg"
                      className="bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 neon-glow gap-2"
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating document…
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          Export Formal Grant Proposal (.docx)
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ── Tab 2: Lab Profile ── */}
            <TabsContent value="profile">
              <div className="max-w-2xl mx-auto py-6 space-y-6">
                {profile && (
                  <div className="glass-strong p-6 space-y-4 animate-fade-up">
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">
                      Researcher Profile
                    </h2>
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

                <div className="glass-strong p-6 animate-fade-up">
                  {profile ? (
                    <EquipmentManager profileId={profile.id} />
                  ) : (
                    <div className="glass p-8 text-center">
                      <p className="text-muted-foreground text-sm">Loading profile…</p>
                    </div>
                  )}
                </div>

                {!profile && (
                  <div className="glass p-8 text-center">
                    <p className="text-muted-foreground text-sm">
                      No profile found. Please register to create one.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── Tab 3: History ── */}
            <TabsContent value="history">
              <div className="max-w-3xl mx-auto py-6 space-y-4 animate-fade-up">
                <div className="flex items-center gap-3 mb-2">
                  <BookMarked className="h-5 w-5 text-primary" />
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">Saved Experiments</h2>
                    <p className="text-xs text-muted-foreground">Click "Load" to restore any previous experiment plan.</p>
                  </div>
                </div>
                <SavedExperiments onLoad={handleLoadSaved} />
              </div>
            </TabsContent>

            {/* ── Tab 4: Corrections ── */}
            <TabsContent value="corrections">
              <div className="max-w-3xl mx-auto py-6 space-y-4 animate-fade-up">
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">Expert Corrections</h2>
                    <p className="text-xs text-muted-foreground">
                      Protocol edits you've submitted. These are fed back into the AI to improve future plans.
                    </p>
                  </div>
                </div>
                <CorrectionsHistory />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Index;