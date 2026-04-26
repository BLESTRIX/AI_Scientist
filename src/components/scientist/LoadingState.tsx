import { useEffect, useState } from "react";
import { BookOpen, FlaskConical, Check } from "lucide-react";

type Phase = {
  icon: typeof BookOpen;
  label: string;
  sublabel: string;
};

const ALL_PHASES: Phase[] = [
  {
    icon: BookOpen,
    label: "Scanning Literature for Novelty…",
    sublabel: "Querying scientific databases and evaluating prior work",
  },
  {
    icon: FlaskConical,
    label: "Generating Operational Protocol…",
    sublabel: "Building bench-ready steps, materials list, and timeline",
  },
];

type Props = {
  isLoadingQC: boolean;
  isLoadingGeneration: boolean;
};

const LoadingState = ({ isLoadingQC, isLoadingGeneration }: Props) => {
  // Determine which phase index is currently active
  // Phase 0 = QC, Phase 1 = Generation
  const activePhase = isLoadingGeneration ? 1 : 0;

  // Track which phases have been completed so we can show checkmarks
  const [completedPhases, setCompletedPhases] = useState<Set<number>>(new Set());

  useEffect(() => {
    // When generation starts, mark QC (phase 0) as complete
    if (isLoadingGeneration) {
      setCompletedPhases(new Set([0]));
    }
  }, [isLoadingGeneration]);

  // Animated dots — cycle every 500ms
  const [dotCount, setDotCount] = useState(1);
  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const dots = ".".repeat(dotCount);

  return (
    <section className="mx-auto flex min-h-[calc(100vh-160px)] max-w-2xl flex-col items-center justify-center px-4 py-12">
      <div className="glass-strong w-full p-10 text-center animate-fade-up">
        {/* Animated orb */}
        <div className="relative mx-auto mb-8 h-24 w-24">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-secondary opacity-80 blur-2xl animate-pulse-glow" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary/40 to-secondary/40 backdrop-blur-xl border border-primary/40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-primary-foreground/90 animate-ping" />
          </div>
        </div>

        {/* Active phase headline */}
        <p className="mb-2 text-base font-semibold text-foreground">
          {ALL_PHASES[activePhase].label.replace("…", dots)}
        </p>
        <p className="mb-8 text-xs text-muted-foreground">
          {ALL_PHASES[activePhase].sublabel}
        </p>

        {/* Phase rows */}
        <div className="space-y-3 text-left">
          {ALL_PHASES.map((phase, i) => {
            const Icon = phase.icon;
            const isDone = completedPhases.has(i);
            const isActive = i === activePhase && !isDone;
            const isPending = i > activePhase && !isDone;

            return (
              <div
                key={phase.label}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-500 ${
                  isActive
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : isDone
                      ? "border-success/30 bg-success/5 text-muted-foreground"
                      : "border-border/10 bg-card/30 text-muted-foreground/60"
                }`}
              >
                {/* Icon pill */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors duration-300 ${
                    isActive
                      ? "bg-primary/20 text-primary"
                      : isDone
                        ? "bg-success/20 text-success"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>

                {/* Label */}
                <span className="flex-1 text-sm font-medium">
                  {isDone
                    ? phase.label.replace("…", " — done")
                    : isPending
                      ? phase.label.replace("…", "")
                      : phase.label}
                </span>

                {/* Bouncing dots for active phase */}
                {isActive && (
                  <span className="ml-auto flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Step counter hint */}
        <p className="mt-6 text-[11px] text-muted-foreground/60">
          Step {activePhase + 1} of {ALL_PHASES.length} · This usually takes 15–30 seconds
        </p>
      </div>
    </section>
  );
};

export default LoadingState;