import { ExternalLink, ShieldAlert, Sparkles, ShieldCheck } from "lucide-react";
import type { NoveltySignal, Reference } from "@/data/mockExperimentPlan";

type Props = {
  signal: NoveltySignal;
  summary: string;
  references: Reference[];
};

const SIGNAL_STYLES: Record<
  NoveltySignal,
  { icon: typeof Sparkles; label: string; pill: string; ring: string }
> = {
  "not found": {
    icon: Sparkles,
    label: "Novel — no prior work found",
    pill: "bg-primary/15 text-primary border-primary/30",
    ring: "from-primary/20 to-transparent",
  },
  "similar work exists": {
    icon: ShieldAlert,
    label: "Similar work exists",
    pill: "bg-warning/15 text-warning border-warning/30",
    ring: "from-warning/20 to-transparent",
  },
  "exact match found": {
    icon: ShieldCheck,
    label: "Exact match found",
    pill: "bg-secondary/15 text-secondary-glow border-secondary/30",
    ring: "from-secondary/20 to-transparent",
  },
};

const NoveltyCard = ({ signal, summary, references }: Props) => {
  const cfg = SIGNAL_STYLES[signal];
  const Icon = cfg.icon;

  return (
    <article className="glass-strong relative overflow-hidden p-6 sm:p-8 animate-fade-up">
      <div
        aria-hidden
        className={`pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl bg-gradient-to-br ${cfg.ring}`}
      />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${cfg.pill}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {cfg.label}
          </span>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Literature Novelty
          </span>
        </div>

        <p className="mt-4 max-w-3xl text-base leading-relaxed text-foreground/90">
          {summary}
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {references.map((r) => (
            <a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-1.5 rounded-lg border border-border/10 bg-card/40 p-3 text-xs text-foreground/80 backdrop-blur transition hover:border-primary/40 hover:text-foreground"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                  {r.title}
                </span>
                <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground transition group-hover:text-primary" />
              </div>
              <div className="text-[11px] text-muted-foreground line-clamp-1">
                {r.authors}
              </div>
              <div className="text-[11px] text-muted-foreground">
                <span className="italic">{r.journal}</span> · {r.year}
              </div>
            </a>
          ))}
        </div>
      </div>
    </article>
  );
};

export default NoveltyCard;