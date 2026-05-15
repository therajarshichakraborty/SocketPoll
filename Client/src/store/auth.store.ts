import { create } from "zustand";
import { api } from "../lib/api";

interface User {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem("token"),
  isLoading: false,

  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", data.data.token);
    set({ user: data.data.user, token: data.data.token });
  },

  register: async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    localStorage.setItem("token", data.data.token);
    set({ user: data.data.user, token: data.data.token });
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null });
    window.location.href = "/login";
  },

  fetchMe: async () => {
    try {
      set({ isLoading: true });
      const { data } = await api.get("/auth/me");
      set({ user: data.data });
    } catch {
      localStorage.removeItem("token");
      set({ user: null, token: null });
    } finally {
      set({ isLoading: false });
    }
  },
}));
