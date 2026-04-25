import { CalendarRange, ArrowRight, CheckCircle2 } from "lucide-react";
import type { TimelinePhase } from "@/data/mockExperimentPlan";

type Props = {
  phases: TimelinePhase[];
};

const PHASE_COLORS = [
  "from-primary/70 to-primary/40 border-primary/40 text-primary-foreground",
  "from-secondary/70 to-secondary/40 border-secondary/40 text-secondary-foreground",
  "from-accent/70 to-accent/40 border-accent/40 text-accent-foreground",
  "from-warning/70 to-warning/40 border-warning/40 text-warning-foreground",
];

const TimelineBar = ({ phases }: Props) => {
  const total = phases.reduce((sum, p) => sum + p.duration_weeks, 0);

  return (
    <article className="glass-strong p-6 sm:p-8 animate-fade-up">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Project Timeline
          </h2>
          <p className="text-xs text-muted-foreground">
            {total} weeks total · {phases.length} phases
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarRange className="h-3.5 w-3.5" />
          ~{total} weeks
        </div>
      </header>

      {/* Bar */}
      <div className="flex h-14 w-full overflow-hidden rounded-xl border border-border/10 bg-card/40">
        {phases.map((p, i) => (
          <div
            key={p.phase}
            style={{ flexBasis: `${(p.duration_weeks / total) * 100}%` }}
            className={`group relative flex items-center justify-center bg-gradient-to-br ${
              PHASE_COLORS[i % PHASE_COLORS.length]
            } border-r border-background/30 last:border-r-0 transition hover:brightness-110`}
            title={`Phase ${p.phase}: ${p.name} — ${p.week_range}`}
          >
            <span className="px-2 text-[11px] font-semibold uppercase tracking-wider truncate">
              P{p.phase}
            </span>
          </div>
        ))}
      </div>

      {/* Phase cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {phases.map((p, i) => (
          <div
            key={p.phase}
            className="rounded-xl border border-border/10 bg-card/30 p-4"
          >
            <div className="flex items-start gap-2">
              <span
                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br ${
                  PHASE_COLORS[i % PHASE_COLORS.length]
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Phase {p.phase}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {p.week_range} · {p.duration_weeks}w
                  </span>
                </div>
                <h3 className="mt-0.5 text-sm font-semibold text-foreground">
                  {p.name}
                </h3>
                <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                  {p.description}
                </p>

                {p.dependencies.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <ArrowRight className="h-3 w-3 text-muted-foreground/60" />
                    {p.dependencies.map((d) => (
                      <span
                        key={d}
                        className="rounded-md border border-border/10 bg-muted/30 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                )}

                {p.deliverables.length > 0 && (
                  <ul className="mt-2.5 space-y-1">
                    {p.deliverables.slice(0, 3).map((d) => (
                      <li
                        key={d}
                        className="flex items-start gap-1.5 text-[11px] text-foreground/75"
                      >
                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-primary/70" />
                        <span className="leading-snug">{d}</span>
                      </li>
                    ))}
                    {p.deliverables.length > 3 && (
                      <li className="pl-4.5 text-[10px] text-muted-foreground">
                        +{p.deliverables.length - 3} more deliverable
                        {p.deliverables.length - 3 > 1 ? "s" : ""}
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
};

export default TimelineBar;