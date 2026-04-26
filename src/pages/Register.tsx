import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Atom, Eye, EyeOff, Loader2 } from "lucide-react";
import AuroraBackground from "../components/layout/AuroraBackground";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register } = useAuth();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    organization: "",
    department: "",
    role: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password.length < 8) {
      toast({ title: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        organization: formData.organization,
        department: formData.department,
        role: formData.role,
      });
      toast({ title: "Welcome to the lab!", description: "Your researcher profile has been created." });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <AuroraBackground />

      <div className="relative z-10 w-full max-w-lg animate-fade-up">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 border border-primary/30">
            <Atom className="h-6 w-6 text-primary" />
            <span className="absolute inset-0 rounded-xl blur-md bg-primary/20" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Join the Lab</h1>
            <p className="text-sm text-muted-foreground mt-1">Create your researcher profile to get started</p>
          </div>
        </div>

        {/* Card */}
        <div className="glass-strong p-8 space-y-6">
          <form onSubmit={handleRegister} className="space-y-5">

            {/* Row: Full name + Role */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="Dr. Ada Lovelace"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="bg-card/40 border-border/15 focus-visible:ring-primary/40"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-xs uppercase tracking-wider text-muted-foreground">
                  Role / Title
                </Label>
                <Input
                  id="role"
                  name="role"
                  placeholder="Lead Researcher"
                  required
                  value={formData.role}
                  onChange={handleChange}
                  className="bg-card/40 border-border/15 focus-visible:ring-primary/40"
                />
              </div>
            </div>

            {/* Organization */}
            <div className="space-y-1.5">
              <Label htmlFor="organization" className="text-xs uppercase tracking-wider text-muted-foreground">
                Organization
              </Label>
              <Input
                id="organization"
                name="organization"
                placeholder="MIT Media Lab"
                required
                value={formData.organization}
                onChange={handleChange}
                className="bg-card/40 border-border/15 focus-visible:ring-primary/40"
              />
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <Label htmlFor="department" className="text-xs uppercase tracking-wider text-muted-foreground">
                Department
              </Label>
              <Input
                id="department"
                name="department"
                placeholder="Computational Biology"
                required
                value={formData.department}
                onChange={handleChange}
                className="bg-card/40 border-border/15 focus-visible:ring-primary/40"
              />
            </div>

            {/* Divider */}
            <div className="h-px bg-border/10" />

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ada@mit.edu"
                required
                value={formData.email}
                onChange={handleChange}
                className="bg-card/40 border-border/15 focus-visible:ring-primary/40"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-card/40 border-border/15 focus-visible:ring-primary/40 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 neon-glow h-11 text-sm font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing profile…
                </>
              ) : (
                "Create Researcher Account"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}