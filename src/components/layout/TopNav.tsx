import { Atom, SlidersHorizontal, RotateCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type TopNavProps = {
  onReset?: () => void;
  showReset?: boolean;
};

const TopNav = ({ onReset, showReset }: TopNavProps) => {
  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
        <nav className="glass-strong flex items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 border border-primary/30">
              <Atom className="h-5 w-5 text-primary" />
              <span className="absolute inset-0 rounded-lg blur-md bg-primary/20" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight text-foreground">
                The AI Scientist
              </span>
              <span className="text-[11px] text-muted-foreground">
                Hypothesis → Bench-ready protocol
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showReset && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                New Hypothesis
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-card/40 border-border/15 hover:bg-card/70"
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-60 bg-popover/90 backdrop-blur-xl border-border/15"
              >
                <DropdownMenuLabel>Domain</DropdownMenuLabel>
                <DropdownMenuRadioGroup defaultValue="biology">
                  <DropdownMenuRadioItem value="biology">Biology</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="chemistry">Chemistry</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="materials">Materials science</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Budget cap</DropdownMenuLabel>
                <DropdownMenuRadioGroup defaultValue="10k">
                  <DropdownMenuRadioItem value="5k">Under $5k</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="10k">Under $10k</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="50k">Under $50k</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Risk tolerance</DropdownMenuLabel>
                <DropdownMenuRadioGroup defaultValue="balanced">
                  <DropdownMenuRadioItem value="conservative">Conservative</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="balanced">Balanced</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="exploratory">Exploratory</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-muted-foreground">
                  Reset filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default TopNav;