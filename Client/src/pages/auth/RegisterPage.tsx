import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, ArrowRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Input,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/index";
import { useAuthStore } from "../../store/auth.store";
import { toast } from "../../components/ui/toast";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-fade-in relative">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <span className="font-display font-semibold text-2xl">
            Socket<span className="text-primary">poll</span>
          </span>
        </div>

        <Card className="shadow-xl border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl">Create an account</CardTitle>
            <CardDescription>Start collecting insights in minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  placeholder="Rajarshi Chakraborty"
                  value={name}
                  onChange={(e: any) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e: any) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Create account <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
