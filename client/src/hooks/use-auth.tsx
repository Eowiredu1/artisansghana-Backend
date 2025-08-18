// src/hooks/use-auth.ts
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { UseMutationResult, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

// Your app used these types before; we'll keep a minimal shape compatible with your UI.
type SelectUser = {
  id: string;
  email: string | null;
  username?: string | null;
  role?: "buyer" | "seller" | "client";
  businessName?: string | null;
};

type LoginData = { username: string; password: string };
type RegisterData = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: "buyer" | "seller" | "client";
  businessName?: string;
};

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, RegisterData>;
  switchRoleMutation: UseMutationResult<SelectUser, Error, { role: string }>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<SelectUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hookError, setHookError] = useState<Error | null>(null);

  // Load current session on mount
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const u = data.user;
        if (u) {
          setUser({
            id: u.id,
            email: u.email,
            username: (u.user_metadata as any)?.username ?? null,
            role: (u.user_metadata as any)?.role ?? "buyer",
            businessName: (u.user_metadata as any)?.businessName ?? null,
          });
        } else {
          setUser(null);
        }
      } catch (e: any) {
        setHookError(e);
      } finally {
        setIsLoading(false);
      }
    })();

    // Listen for auth changes (login/logout)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      if (u) {
        setUser({
          id: u.id,
          email: u.email,
          username: (u.user_metadata as any)?.username ?? null,
          role: (u.user_metadata as any)?.role ?? "buyer",
          businessName: (u.user_metadata as any)?.businessName ?? null,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const loginMutation = useMutation<SelectUser, Error, LoginData>({
    mutationFn: async ({ username, password }) => {
      // We sign in with email, but your UI collects "username".
      // For a simple start, treat "username" as email.
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password,
      });
      if (error) throw new Error(error.message);
      const u = data.user!;
      return {
        id: u.id,
        email: u.email,
        username: (u.user_metadata as any)?.username ?? null,
        role: (u.user_metadata as any)?.role ?? "buyer",
        businessName: (u.user_metadata as any)?.businessName ?? null,
      };
    },
    onSuccess: (u) => {
      setUser(u);
      toast({ title: "Welcome back!", description: "You have been successfully logged in." });
    },
    onError: (error) => {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    },
  });

  const registerMutation = useMutation<SelectUser, Error, RegisterData>({
    mutationFn: async ({ email, password, username, role, businessName }) => {
      // Sign up and store extra fields in user_metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, role, businessName: businessName ?? null },
        },
      });
      if (error) throw new Error(error.message);
      const u = data.user!;
      return {
        id: u.id,
        email: u.email,
        username: (u.user_metadata as any)?.username ?? username ?? null,
        role: (u.user_metadata as any)?.role ?? role ?? "buyer",
        businessName:
          (u.user_metadata as any)?.businessName ?? businessName ?? null,
      };
    },
    onSuccess: (u) => {
      setUser(u);
      toast({
        title: "Welcome to Artisans Market!",
        description: "Your account has been created successfully.",
      });
    },
    onError: (error) => {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    },
  });

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setUser(null);
      toast({ title: "Goodbye!", description: "You have been successfully logged out." });
    },
    onError: (error) => {
      toast({ title: "Logout failed", description: error.message, variant: "destructive" });
    },
  });

  const switchRoleMutation = useMutation<SelectUser, Error, { role: string }>({
    mutationFn: async ({ role }) => {
      const { data, error } = await supabase.auth.updateUser({
        data: { role },
      });
      if (error) throw new Error(error.message);
      const u = data.user!;
      return {
        id: u.id,
        email: u.email,
        username: (u.user_metadata as any)?.username ?? null,
        role: (u.user_metadata as any)?.role ?? "buyer",
        businessName: (u.user_metadata as any)?.businessName ?? null,
      };
    },
    onSuccess: (u) => {
      setUser(u);
      toast({ title: "Role switched!", description: `You are now acting as a ${u.role}.` });
    },
    onError: (error) => {
      toast({ title: "Role switch failed", description: error.message, variant: "destructive" });
    },
  });

  const value = useMemo<AuthContextType>(() => ({
    user,
    isLoading,
    error: hookError,
    loginMutation,
    logoutMutation,
    registerMutation,
    switchRoleMutation,
  }), [user, isLoading, hookError, loginMutation, logoutMutation, registerMutation, switchRoleMutation]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
