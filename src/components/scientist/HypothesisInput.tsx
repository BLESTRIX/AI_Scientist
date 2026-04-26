import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const EXAMPLES = [
  "Does intermittent fasting alter gut microbiome diversity in mice?",
  "Can CRISPR-edited Bt toxin reduce pesticide use in maize?",
  "Do MOFs outperform zeolites for direct air capture below 1 ppm CO₂?",
];

type Props = {
  onSubmit: (
    hypothesis: string,
    options?: { deepLiterature: boolean },
  ) => void;
  preferredDomains: string;
  onPreferredDomainsChange: (value: string) => void;
};

const HypothesisInput = ({
  onSubmit,
  preferredDomains,
  onPreferredDomainsChange,
}: Props) => {
  const [value, setValue] = useState("");
  const [deepLiterature, setDeepLiterature] = useState(false);

  const handleSubmit = () => {
    const v = value.trim();
    if (!v) return;

    onSubmit(v, { deepLiterature });
  };

  return (
    <section className="mx-auto flex min-h-[calc(100vh-160px)] max-w-3xl flex-col items-center justify-center px-4 py-12">
      <div className="w-full animate-fade-up text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          Operationally realistic. Citation-aware.
        </div>

        <h1 className="mb-4 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          From hypothesis to{" "}
          <span className="text-gradient-neon">bench-ready protocol</span>.
        </h1>
        <p className="mb-10 text-balance text-base text-muted-foreground sm:text-lg">
          Enter a scientific question. Get a complete experiment plan: novelty
          assessment, methodology, materials, and timeline.
        </p>

        <div className="glass-strong p-3 text-left">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g., Does intermittent fasting alter gut microbiome diversity in mice?"
            className="min-h-[140px] resize-none border-0 bg-transparent text-base placeholder:text-muted-foreground/60 focus-visible:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            }}
          />
          <div className="space-y-3 px-2 pb-1 pt-3">
            <div className="space-y-2 text-left">
              <label
                htmlFor="preferred-domains"
                className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
              >
                Preferred Domains (Optional, comma-separated)
              </label>
              <Input
                id="preferred-domains"
                value={preferredDomains}
                onChange={(e) => onPreferredDomainsChange(e.target.value)}
                placeholder="arxiv.org, nature.com"
                className="h-11 border-border/20 bg-white/5 text-sm text-foreground placeholder:text-muted-foreground/55 backdrop-blur-md focus-visible:border-primary/40 focus-visible:ring-1 focus-visible:ring-primary/30"
              />
            </div>
            <div className="rounded-xl border border-border/15 bg-card/20 px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <label
                    htmlFor="deep-literature"
                    className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    Deep Literature Mode
                  </label>
                  <p className="text-xs text-muted-foreground/80">
                    Fetch full-text methods from top papers and use them while generating protocol steps.
                  </p>
                </div>
                <Switch
                  id="deep-literature"
                  checked={deepLiterature}
                  onCheckedChange={setDeepLiterature}
                  aria-label="Toggle deep literature mode"
                />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-muted-foreground">
                ⌘ + Enter to generate
              </span>
              <Button
                onClick={handleSubmit}
                disabled={!value.trim()}
                className="group bg-primary text-primary-foreground hover:bg-primary/90 neon-glow animate-pulse-glow"
              >
                Generate Experiment Plan
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground">Try:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setValue(ex)}
              className="rounded-full border border-border/10 bg-card/40 px-3 py-1 text-xs text-muted-foreground backdrop-blur hover:border-primary/30 hover:text-foreground transition"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HypothesisInput;