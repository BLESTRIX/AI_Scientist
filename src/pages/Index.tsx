import { useState } from "react";
import { toast } from "sonner";
import AuroraBackground from "@/components/layout/AuroraBackground";
import TopNav from "@/components/layout/TopNav";
import HypothesisInput from "@/components/scientist/HypothesisInput";
import LoadingState from "@/components/scientist/LoadingState";
import NoveltyCard from "@/components/scientist/NoveltyCard";
import ProtocolStepper from "@/components/scientist/ProtocolStepper";
import MaterialsTable from "@/components/scientist/MaterialsTable";
import TimelineBar from "@/components/scientist/TimelineBar";
import { mockExperimentData } from "@/data/mockExperimentPlan";

type View = "input" | "loading" | "results";

const Index = () => {
  const [view, setView] = useState<View>("input");
  const [hypothesis, setHypothesis] = useState("");

  const handleSubmit = (h: string) => {
    setHypothesis(h);
    setView("loading");
  };

  const handleComplete = () => {
    setView("results");
    toast.success("Experiment plan ready", {
      description: "Novelty assessed · 6-step protocol generated",
    });
  };

  const handleReset = () => {
    setView("input");
    setHypothesis("");
  };

  const plan = mockExperimentData;

  return (
    <div className="relative min-h-screen text-foreground">
      <AuroraBackground />
      <TopNav onReset={handleReset} showReset={view === "results"} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        {view === "input" && <HypothesisInput onSubmit={handleSubmit} />}
        {view === "loading" && <LoadingState onComplete={handleComplete} />}
        {view === "results" && (
          <div className="space-y-6 pt-8">
            {/* Hypothesis recap */}
            <div className="animate-fade-up">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Hypothesis
              </p>
              <h1 className="mt-1 max-w-4xl text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {hypothesis || plan.hypothesis}
              </h1>
            </div>

            {/* Novelty */}
            <NoveltyCard
              signal={plan.novelty_check.signal}
              summary={plan.novelty_check.summary}
              references={plan.novelty_check.references}
            />

            {/* Protocol + Materials */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ProtocolStepper steps={plan.protocol} />
              </div>
              <div className="lg:col-span-1">
                <MaterialsTable
                  materials={plan.materials}
                  totalCost={plan.budget_total}
                />
              </div>
            </div>

            {/* Timeline */}
            <TimelineBar phases={plan.timeline_phases} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
