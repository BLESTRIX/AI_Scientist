import { Atom, SlidersHorizontal, RotateCcw, LogOut, User, Building2, Briefcase } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type TopNavProps = {
  onReset?: () => void;
  showReset?: boolean;
};

// ─── Helper: get initials from a name string ──────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

// ─── Component ────────────────────────────────────────────────────────────────

const TopNav = ({ onReset, showReset }: TopNavProps) => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Signed out", description: "See you next time." });
      navigate("/login");
    } catch {
      toast({ title: "Sign out failed", variant: "destructive" });
    }
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || "Researcher";
  const initials = getInitials(displayName);

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
        <nav className="glass-strong flex items-center justify-between px-4 sm:px-6 py-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 border border-primary/30">
              <Atom className="h-5 w-5 text-primary" />
              <span className="absolute inset-0 rounded-lg blur-md bg-primary/20" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight text-foreground">The AI Scientist</span>
              <span className="text-[11px] text-muted-foreground">Hypothesis → Bench-ready protocol</span>
            </div>
          </div>

          {/* Actions */}
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

            {/* Filters dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-card/40 border-border/15 hover:bg-card/70">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 bg-popover/90 backdrop-blur-xl border-border/15">
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
                <DropdownMenuItem className="text-muted-foreground">Reset filters</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User avatar dropdown (only when logged in) */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative h-8 w-8 rounded-full border border-primary/30 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-xs font-semibold text-primary hover:border-primary/60 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
                    {initials || <User className="h-4 w-4" />}
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-background" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-64 bg-popover/95 backdrop-blur-xl border-border/15"
                >
                  {/* Profile header */}
                  <div className="px-3 py-3 border-b border-border/10">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-primary/30 bg-gradient-to-br from-primary/20 to-secondary/20">
                        <AvatarFallback className="bg-transparent text-primary text-sm font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Profile details */}
                  {profile && (
                    <div className="px-3 py-2 border-b border-border/10 space-y-1.5">
                      {profile.role && (
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <Briefcase className="h-3 w-3 shrink-0" />
                          <span className="truncate">{profile.role}</span>
                        </div>
                      )}
                      {profile.organization && (
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <Building2 className="h-3 w-3 shrink-0" />
                          <span className="truncate">{profile.organization}</span>
                        </div>
                      )}
                      {profile.department && (
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <User className="h-3 w-3 shrink-0" />
                          <span className="truncate">{profile.department}</span>
                        </div>
                      )}
                      {profile.equipment_items && profile.equipment_items.length > 0 && (
                        <div className="text-[10px] text-muted-foreground/70 pt-1">
                          {profile.equipment_items.length} equipment item{profile.equipment_items.length !== 1 ? 's' : ''} in inventory
                        </div>
                      )}
                    </div>
                  )}

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer mx-1 my-1 rounded-md"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default TopNav;