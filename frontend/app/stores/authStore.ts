"use client";

import { create } from "zustand";
import { getMe } from "../services/api";

export type AuthUser = {
  userId: string;
  role: string;
  email: string;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  isLoggedIn: boolean;
  setAuth: (accessToken: string, user: AuthUser) => void;
  clearAuth: () => void;
  initAuth: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  isLoggedIn: false,

  setAuth: (token, userInfo) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("access_token", token);
    }
    set({ user: userInfo, isLoggedIn: true });
  },

  clearAuth: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("access_token");
    }
    set({ user: null, isLoggedIn: false });
  },

  initAuth: async () => {
    if (typeof window === "undefined") return;

    const storedToken = window.localStorage.getItem("access_token");
    if (!storedToken) {
      set({ loading: false });
      return;
    }

    try {
      const me = await getMe();
      set({ user: me, isLoggedIn: true });
    } catch {
      window.localStorage.removeItem("access_token");
      set({ user: null, isLoggedIn: false });
    } finally {
      set({ loading: false });
    }
  },
}));
