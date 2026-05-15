import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { Navbar } from "./components/layout/Navbar";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { Toaster } from "./components/ui/toast";

import { useThemeStore } from "./store/theme.store";

import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import CreatePollPage from "./pages/polls/CreatePollPage";
import VotePage from "./pages/polls/VotePage";
import AnalyticsPage from "./pages/polls/AnalyticsPage";

import { getSocket } from "./lib/socket";
import { api } from "./lib/axios";

function AppLayout() {
  const location = useLocation();

  const hideNavbar = location.pathname.startsWith("/poll/");

  return (
    <div className="min-h-screen bg-background">
      {!hideNavbar && <Navbar />}

      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/login" element={<LoginPage />} />

          <Route path="/register" element={<RegisterPage />} />

          {/* Public Vote Page */}
          <Route path="/poll/:pollId" element={<VotePage />} />

          {/* Protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/polls/create"
            element={
              <ProtectedRoute>
                <CreatePollPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/polls/:pollId/analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Toaster />
    </div>
  );
}

export default function App() {
  const { theme, set } = useThemeStore();

  useEffect(() => {
    set(theme);
  }, [theme, set]);

  useEffect(() => {
    const socket = getSocket()
    const initializeApp = async () => {
      
      try {
        // verify auth
        await api.get("/auth/me");

        // connect socket only if authenticated
        socket.connect();

        socket.on("connect", () => {
          console.log("Socket Connected:", socket.id);
        });

        socket.on("disconnect", () => {
          console.log("Socket Disconnected");
        });

      } catch (error) {
        console.log("User not authenticated");
      }
    };

    initializeApp();

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}