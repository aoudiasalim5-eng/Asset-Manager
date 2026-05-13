import React, { createContext, useContext, useState, useEffect } from "react";
import { User, useGetMe, getGetMeQueryKey, setAuthTokenGetter } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("salim_token"));
  const queryClient = useQueryClient();

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("salim_token"));
  }, []);

  const { data: user, isLoading: isUserLoading } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      enabled: !!token,
      retry: false,
    }
  });

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("salim_token", newToken);
    setToken(newToken);
    queryClient.setQueryData(["/api/auth/me"], newUser);
  };

  const logout = () => {
    localStorage.removeItem("salim_token");
    setToken(null);
    queryClient.setQueryData(["/api/auth/me"], null);
    queryClient.clear();
  };

  const isLoading = !!token && isUserLoading;

  return (
    <AuthContext.Provider value={{ user: user || null, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
