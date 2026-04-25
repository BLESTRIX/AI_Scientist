import { useState } from "react";
import { Edit2, Check, X, Clock, ChevronDown, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { ProtocolStep } from "@/data/mockExperimentPlan";

type Props = {
  steps: ProtocolStep[];
};

const ProtocolStepper = ({ steps: initial }: Props) => {
  const [steps, setSteps] = useState(initial);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(new Set([1]));
  const [modified, setModified] = useState<Set<number>>(new Set());

  const startEdit = (step: ProtocolStep) => {
    setEditingId(step.step_number);
    setDraft(step.description);
  };

  const save = (id: number) => {
    setSteps((prev) =>
      prev.map((s) => (s.step_number === id ? { ...s, description: draft } : s)),
    );
    setModified((prev) => new Set(prev).add(id));
    setEditingId(null);
    toast.success("Step updated", {
      description: "We'll incorporate your feedback in the next regeneration.",
    });
  };

  const cancel = () => setEditingId(null);

  const toggleExpanded = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <article className="glass-strong p-6 sm:p-8 animate-fade-up">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Experimental Protocol
          </h2>
          <p className="text-xs text-muted-foreground">
            {steps.length} steps · Click any step to refine it
          </p>
        </div>
      </header>

      <ol className="relative space-y-4">
        <div
          aria-hidden
          className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-border/20 to-transparent"
        />
        {steps.map((step) => {
          const isEditing = editingId === step.step_number;
          const isModified = modified.has(step.step_number);
          const isOpen = expanded.has(step.step_number);
          const params = Object.entries(step.key_parameters);

          return (
            <li key={step.step_number} className="relative pl-12">
              <span
                className={`absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${
                  isModified
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border/15 bg-card/60 text-foreground"
                } backdrop-blur`}
              >
                {step.step_number}
              </span>

              <div
                className={`rounded-xl border p-4 transition ${
                  isEditing
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/10 bg-card/30 hover:border-border/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        {step.title}
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/10 bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {step.duration}
                      </span>
                      {isModified && (
                        <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                          modified
                        </span>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="mt-3 space-y-2">
                        <Textarea
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          className="min-h-[140px] bg-background/60 border-border/15 text-sm"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancel}
                            className="text-muted-foreground"
                          >
                            <X className="mr-1 h-3.5 w-3.5" />
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => save(step.step_number)}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            <Check className="mr-1 h-3.5 w-3.5" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    )}

                    {!isEditing && (params.length > 0 || step.safety_notes) && (
                      <div className="mt-3">
                        <button
                          onClick={() => toggleExpanded(step.step_number)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary/90 hover:text-primary transition"
                        >
                          <ChevronDown
                            className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                          />
                          {isOpen ? "Hide details" : `Show ${params.length} parameters`}
                        </button>

                        {isOpen && (
                          <div className="mt-3 space-y-3">
                            {params.length > 0 && (
                              <div className="rounded-lg border border-border/10 bg-background/40 p-3">
                                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  Key parameters
                                </p>
                                <dl className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                                  {params.map(([k, v]) => (
                                    <div key={k} className="flex flex-col">
                                      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
                                        {k.replace(/_/g, " ")}
                                      </dt>
                                      <dd className="text-xs font-medium text-foreground">
                                        {v}
                                      </dd>
                                    </div>
                                  ))}
                                </dl>
                              </div>
                            )}

                            {step.safety_notes && (
                              <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
                                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-warning">
                                    Safety
                                  </p>
                                  <p className="mt-0.5 text-xs leading-relaxed text-foreground/80">
                                    {step.safety_notes}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {!isEditing && step.editable && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEdit(step)}
                      aria-label={`Edit step ${step.step_number}`}
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </article>
  );
};

export default ProtocolStepper;