import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, user, fetchMe, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (token && !user) fetchMe();
    else if (!token) navigate("/login");
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!token) return null;
  return <>{children}</>;
}
