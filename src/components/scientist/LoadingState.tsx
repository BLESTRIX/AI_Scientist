import { useEffect, useState } from "react";
import { BookOpen, FlaskConical, Check } from "lucide-react";

const PHASES = [
  { icon: BookOpen, label: "Scanning Literature for Novelty…" },
  { icon: FlaskConical, label: "Generating Operational Protocol…" },
];

type Props = {
  onComplete: () => void;
};

const LoadingState = ({ onComplete }: Props) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 1800);
    const t2 = setTimeout(() => onComplete(), 3600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onComplete]);

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

        <div className="space-y-3">
          {PHASES.map((p, i) => {
            const Icon = p.icon;
            const done = i < phase;
            const active = i === phase;
            return (
              <div
                key={p.label}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-all ${
                  active
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : done
                      ? "border-success/30 bg-success/5 text-muted-foreground"
                      : "border-border/10 bg-card/30 text-muted-foreground/60"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-md ${
                    active
                      ? "bg-primary/20 text-primary"
                      : done
                        ? "bg-success/20 text-success"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className="text-sm font-medium">{p.label}</span>
                {active && (
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
      </div>
    </section>
  );
};

export default LoadingState;