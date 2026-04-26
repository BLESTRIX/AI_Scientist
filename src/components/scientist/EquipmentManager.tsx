import { useState, useEffect } from "react";
import { Plus, X, FlaskConical, Loader2, Microscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EquipmentItem {
  id: string;
  item_name: string;
}

interface EquipmentManagerProps {
  /**
   * The user's profile ID (which matches auth.users.id)
   */
  profileId: string;
}

// ─── Equipment colour palette (cycles) ───────────────────────────────────────

const TAG_COLORS = [
  "border-primary/30 bg-primary/10 text-primary",
  "border-secondary/30 bg-secondary/10 text-secondary-foreground",
  "border-accent/30 bg-accent/10 text-accent-foreground",
  "border-warning/30 bg-warning/10 text-warning",
  "border-success/30 bg-success/10 text-success",
];

const EQUIPMENT_SUGGESTIONS = [
  "PCR Thermocycler",
  "Centrifuge",
  "Flow Cytometer",
  "ELISA Plate Reader",
  "Fluorescence Microscope",
  "Western Blot System",
  "Spectrophotometer",
  "Biosafety Cabinet",
  "Liquid Nitrogen Dewar",
  "Autoclave",
];

// ─── Component ────────────────────────────────────────────────────────────────

const EquipmentManager = ({ profileId }: EquipmentManagerProps) => {
  const { toast } = useToast();
  const { refreshProfile } = useAuth();

  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Fetch equipment on mount ──────────────────────────────────────────────
  useEffect(() => {
    fetchEquipment();
  }, [profileId]);

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_equipment')
        .select('id, item_name')
        .eq('user_id', profileId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setEquipment(data || []);
    } catch (err: any) {
      toast({
        title: "Failed to load equipment",
        description: err?.message || "Could not fetch your lab inventory.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Add equipment item ────────────────────────────────────────────────────
  const addItem = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    // Check for duplicates (case-insensitive)
    if (equipment.some((e) => e.item_name.toLowerCase() === trimmed.toLowerCase())) {
      toast({ 
        title: "Already in inventory", 
        description: `${trimmed} is already in your lab inventory.` 
      });
      return;
    }

    setAdding(true);
    try {
      const { data, error } = await supabase
        .from('user_equipment')
        .insert({
          user_id: profileId,
          item_name: trimmed,
        })
        .select('id, item_name')
        .single();

      if (error) throw error;

      if (data) {
        setEquipment((prev) => [...prev, data]);
        setInputValue("");
        toast({ 
          title: "Equipment added", 
          description: `${trimmed} has been added to your inventory.` 
        });
        
        // Refresh the profile to update equipment count in TopNav
        await refreshProfile();
      }
    } catch (err: any) {
      toast({
        title: "Failed to add equipment",
        description: err?.message || "Could not add the item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  // ── Remove equipment item ─────────────────────────────────────────────────
  const removeItem = async (id: string, itemName: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('user_equipment')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEquipment((prev) => prev.filter((item) => item.id !== id));
      toast({ 
        title: "Equipment removed", 
        description: `${itemName} has been removed from your inventory.` 
      });
      
      // Refresh the profile to update equipment count in TopNav
      await refreshProfile();
    } catch (err: any) {
      toast({
        title: "Failed to remove equipment",
        description: err?.message || "Could not remove the item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // ── Handle keyboard input ─────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addItem(inputValue);
    }
  };

  // ── Filter suggestions ────────────────────────────────────────────────────
  const suggestions = EQUIPMENT_SUGGESTIONS.filter(
    (s) => !equipment.some((e) => e.item_name.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Microscope className="h-5 w-5 text-primary" />
            Lab Equipment Inventory
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Track the equipment available in your lab. This helps the AI generate more realistic protocols.
          </p>
        </div>
      </div>

      {/* Add input */}
      <div className="glass p-4 space-y-3">
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Add Equipment
        </label>
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Confocal Microscope, PCR Machine…"
            className="bg-card/40 border-border/15 focus-visible:ring-primary/40 flex-1"
            disabled={adding}
          />
          <Button
            onClick={() => addItem(inputValue)}
            disabled={!inputValue.trim() || adding}
            size="icon"
            className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Quick-add suggestions */}
        {suggestions.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Quick add</p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.slice(0, 6).map((s) => (
                <button
                  key={s}
                  onClick={() => addItem(s)}
                  disabled={adding}
                  className="rounded-full border border-border/15 bg-card/30 px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary/30 hover:text-foreground transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Equipment tags */}
      {loading ? (
        <div className="glass p-8 text-center">
          <Loader2 className="mx-auto h-8 w-8 text-primary animate-spin mb-2" />
          <p className="text-sm text-muted-foreground">Loading inventory...</p>
        </div>
      ) : equipment.length > 0 ? (
        <div className="glass p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Current Inventory
            </label>
            <span className="text-[11px] text-muted-foreground">
              {equipment.length} item{equipment.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {equipment.map((item, i) => (
              <span
                key={item.id}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${TAG_COLORS[i % TAG_COLORS.length]}`}
              >
                <FlaskConical className="h-3 w-3 shrink-0" />
                {item.item_name}
                <button
                  onClick={() => removeItem(item.id, item.item_name)}
                  disabled={deletingId === item.id}
                  className="ml-0.5 rounded-full hover:bg-black/10 p-0.5 transition disabled:opacity-50"
                  aria-label={`Remove ${item.item_name}`}
                >
                  {deletingId === item.id ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  ) : (
                    <X className="h-2.5 w-2.5" />
                  )}
                </button>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass p-8 text-center">
          <FlaskConical className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">No equipment added yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Add your lab's equipment above to get more accurate protocols.
          </p>
        </div>
      )}
    </div>
  );
};

export default EquipmentManager;