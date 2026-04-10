import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

type User = {
  userId: string;
  role: string;
  email: string;
};

type AuthState = {
  accessToken: string | null;
  user: User | null;
  isHydrated: boolean;
  setAccessToken: (token: string | null) => Promise<void>;
  setUser: (user: User | null) => void;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
};

const ACCESS_TOKEN_KEY = "access_token";

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isHydrated: false,

  setAccessToken: async (token) => {
    if (token) {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    }

    set({ accessToken: token });
  },

  setUser: (user) => set({ user }),

  hydrate: async () => {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    set({
      accessToken: token,
      isHydrated: true,
    });
  },

  logout: async () => {
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    set({
      accessToken: null,
      user: null,
    });
  },
}));
