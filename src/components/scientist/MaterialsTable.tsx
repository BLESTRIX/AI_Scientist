import { Copy, DollarSign, ExternalLink, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Material } from "@/data/mockExperimentPlan";

type Props = {
  materials: Material[];
  totalCost: number;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const getSafeExternalUrl = (value: string | null | undefined) => {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.toString()
      : null;
  } catch {
    return null;
  }
};

const buildSupplierSearchUrl = (material: Material) => {
  const terms = [material.supplier, material.item, material.catalog_number]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");

  if (!terms) return null;

  return `https://www.google.com/search?q=${encodeURIComponent(terms)}`;
};

const MaterialsTable = ({ materials, totalCost }: Props) => {
  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied", { description: text });
  };

  return (
    <article className="glass-strong p-6 animate-fade-up">
      <header className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Materials & Budget
        </h2>
        <p className="text-xs text-muted-foreground">
          {materials.length} reagents · sourced from major suppliers
        </p>
      </header>

      <ul className="divide-y divide-border/10">
        {materials.map((m) => {
          const safeUrl = getSafeExternalUrl(m.url);
          const fallbackSearchUrl = safeUrl ? null : buildSupplierSearchUrl(m);

          return (
          <li key={m.catalog_number} className="py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug text-foreground">
                  {m.item}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                  <span>{m.supplier}</span>
                  <span>·</span>
                  <span className="font-mono">{m.catalog_number}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => copy(m.catalog_number)}
                    aria-label={`Copy catalog number ${m.catalog_number}`}
                    className="h-5 w-5 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <span>·</span>
                  <span>{m.quantity}</span>
                </div>
                {m.notes && (
                  <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-muted-foreground/80">
                    <Info className="mt-0.5 h-3 w-3 shrink-0" />
                    <span className="leading-relaxed">{m.notes}</span>
                  </div>
                )}
                {safeUrl && (
                  <a
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Visit site
                  </a>
                )}
                {fallbackSearchUrl && (
                  <a
                    href={fallbackSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Find online
                  </a>
                )}
              </div>
              <div className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {fmt(m.estimated_price)}
              </div>
            </div>
          </li>
          );
        })}
      </ul>

      <div className="mt-5 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/15 via-primary/10 to-secondary/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary">
            <DollarSign className="h-3.5 w-3.5" />
            Total Estimated Cost
          </div>
          <div className="text-2xl font-semibold tabular-nums text-gradient-neon">
            {fmt(totalCost)}
          </div>
        </div>
      </div>
    </article>
  );
};

export default MaterialsTable;