import { create } from "zustand";

const TOKEN_KEY = "bbq_admin_token";

export const useAuthStore = create((set) => ({
  token: localStorage.getItem(TOKEN_KEY),
  username: null,

  login: async (username, password) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    localStorage.setItem(TOKEN_KEY, data.token);
    set({ token: data.token, username: data.username });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ token: null, username: null });
  },

  setUsername: (username) => set({ username }),
}));
