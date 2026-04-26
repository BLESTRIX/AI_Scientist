import { useState, useEffect, useCallback } from "react";
import { FlaskConical, Trash2, Clock, DollarSign, Eye, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export interface SavedExperiment {
  id: string;
  user_id: string;
  hypothesis: string;
  protocol_data: any;
  budget_total: number | null;
  created_at: string;
}

type Props = {
  onLoad: (experiment: SavedExperiment) => void;
};

const fmt = (n: number | null) =>
  n != null
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
    : "—";

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "Just now";
};

export default function SavedExperiments({ onLoad }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [experiments, setExperiments] = useState<SavedExperiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchExperiments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("saved_experiments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setExperiments(data || []);
    } catch (err: any) {
      toast({ title: "Failed to load experiments", description: err?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchExperiments();
  }, [fetchExperiments]);

  const deleteExperiment = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from("saved_experiments").delete().eq("id", id);
      if (error) throw error;
      setExperiments((prev) => prev.filter((e) => e.id !== id));
      toast({ title: "Experiment deleted" });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err?.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="glass p-8 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Loading saved experiments...</p>
      </div>
    );
  }

  if (experiments.length === 0) {
    return (
      <div className="glass p-10 text-center">
        <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-foreground">No saved experiments yet</p>
        <p className="text-xs text-muted-foreground mt-1">Generate an experiment plan and save it here for future reference.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {experiments.length} saved experiment{experiments.length !== 1 ? "s" : ""}
        </p>
      </div>
      {experiments.map((exp) => (
        <div
          key={exp.id}
          className="glass border border-border/10 p-4 rounded-xl hover:border-border/20 transition group"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <FlaskConical className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
                {exp.hypothesis}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {timeAgo(exp.created_at)}
                </span>
                {exp.budget_total != null && (
                  <span className="inline-flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {fmt(exp.budget_total)}
                  </span>
                )}
                {exp.protocol_data?.protocol && (
                  <span>{exp.protocol_data.protocol.length} steps</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onLoad(exp)}
                className="h-8 px-2.5 text-xs text-primary hover:bg-primary/10 hover:text-primary"
              >
                <Eye className="h-3.5 w-3.5 mr-1" />
                Load
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => deleteExperiment(exp.id)}
                disabled={deletingId === exp.id}
                className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                {deletingId === exp.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}