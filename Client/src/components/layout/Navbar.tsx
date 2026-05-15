import { Link, useNavigate } from "react-router-dom";
import { Moon, Sun, BarChart3, Plus, LogOut, User } from "lucide-react";
import { Button } from "../ui/button";
import { useAuthStore } from "../../store/auth.store";
import { useThemeStore } from "../../store/theme.store";

export function Navbar() {
  const { user, logout } = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <span className="font-display font-semibold text-lg tracking-tight">
            Socket<span className="text-primary">Poll</span>
          </span>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggle} className="rounded-lg">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {user ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="hidden sm:flex"
              >
                <User className="h-4 w-4" />
                Dashboard
              </Button>
              <Button size="sm" onClick={() => navigate("/polls/create")}>
                <Plus className="h-4 w-4" />
                New Poll
              </Button>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/login")}>
                Sign in
              </Button>
              <Button size="sm" onClick={() => navigate("/register")}>
                Get started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
