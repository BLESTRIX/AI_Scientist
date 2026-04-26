import { useState, type ComponentType, type PropsWithChildren } from "react";
import { useNavigate, Link } from "react-router-dom";
import { account } from "../lib/appwrite";
import AuroraBackground from "../components/layout/AuroraBackground";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { checkAuth } = useAuth();
  const AuroraBackgroundWrapper = AuroraBackground as ComponentType<PropsWithChildren<{ className?: string }>>;
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await account.createEmailPasswordSession(email, password);
      await checkAuth();
      toast({ title: "Welcome back!" });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Authentication failed",
        description: error.message || "Invalid credentials.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuroraBackgroundWrapper className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-[0_0_40px_rgba(120,119,198,0.15)] relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">Welcome Back</h1>
          <p className="text-muted-foreground mt-2 text-sm">Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-black/50 border-white/10" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="bg-black/50 border-white/10" />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] mt-6">
            {loading ? "Authenticating..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Need access? <Link to="/register" className="text-cyan-400 hover:underline">Create a profile</Link>
        </p>
      </div>
    </AuroraBackgroundWrapper>
  );
}