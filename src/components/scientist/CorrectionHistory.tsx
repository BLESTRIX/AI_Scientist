import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Trash2, Clock, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

interface Correction {
  id: string;
  user_id: string;
  hypothesis: string;
  correction: string;
  created_at: string;
}

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

export default function CorrectionsHistory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCorrections = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("corrections")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      setCorrections(data || []);
    } catch (err: any) {
      toast({ title: "Failed to load corrections", description: err?.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchCorrections();
  }, [fetchCorrections]);

  const deleteCorrection = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from("corrections").delete().eq("id", id);
      if (error) throw error;
      setCorrections((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Correction removed from feedback loop" });
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
        <p className="text-sm text-muted-foreground">Loading corrections...</p>
      </div>
    );
  }

  if (corrections.length === 0) {
    return (
      <div className="glass p-10 text-center">
        <Zap className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-foreground">No corrections yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Edit protocol steps in an experiment plan. Your feedback will improve future generations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
        <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
        <p className="text-[11px] text-muted-foreground">
          These corrections are injected into future experiment generations as expert feedback, improving AI accuracy.
        </p>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {corrections.length} correction{corrections.length !== 1 ? "s" : ""} in feedback loop
        </p>
      </div>
      {corrections.map((c) => (
        <div
          key={c.id}
          className="glass border border-border/10 p-4 rounded-xl hover:border-border/20 transition"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 border border-secondary/20">
              <MessageSquare className="h-4 w-4 text-secondary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 line-clamp-1">
                Re: {c.hypothesis}
              </p>
              <p className="text-sm text-foreground/90 leading-relaxed">{c.correction}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {timeAgo(c.created_at)}
              </span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => deleteCorrection(c.id)}
              disabled={deletingId === c.id}
              className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              {deletingId === c.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}