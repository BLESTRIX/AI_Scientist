import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { account, databases, ID } from "../lib/appwrite";
import AuroraBackground from "../components/layout/AuroraBackground";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { checkAuth } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    organization: "",
    department: "",
    role: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. Create Appwrite Auth Account
      const userAccount = await account.create(
        ID.unique(),
        formData.email,
        formData.password,
        formData.fullName
      );

      // 2. Log them in immediately
      await account.createEmailPasswordSession(formData.email, formData.password);
      
      // 3. Create the LIMS Profile Document
      await databases.createDocument(
        'ai_scientist_db', 
        'profiles', 
        ID.unique(), 
        {
          user_id: userAccount.$id,
          full_name: formData.fullName,
          organization: formData.organization,
          department: formData.department,
          role: formData.role,
          equipment_access: []
        }
      );

      await checkAuth();
      toast({
        title: "Registration successful!",
        description: "Welcome to your AI Scientist dashboard.",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AuroraBackground />
      <div className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-[0_0_40px_rgba(120,119,198,0.15)] relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">Join the Lab</h1>
          <p className="text-muted-foreground mt-2 text-sm">Create your researcher profile</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" name="fullName" required onChange={handleChange} className="bg-black/50 border-white/10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role / Title</Label>
              <Input id="role" name="role" placeholder="e.g. Lead Engineer" required onChange={handleChange} className="bg-black/50 border-white/10" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization">Organization</Label>
            <Input id="organization" name="organization" required onChange={handleChange} className="bg-black/50 border-white/10" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input id="department" name="department" required onChange={handleChange} className="bg-black/50 border-white/10" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required onChange={handleChange} className="bg-black/50 border-white/10" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={8} onChange={handleChange} className="bg-black/50 border-white/10" />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] mt-6">
            {loading ? "Initializing..." : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account? <Link to="/login" className="text-indigo-400 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}