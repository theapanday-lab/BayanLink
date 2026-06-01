import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { supabase } from "../../lib/supabase";

type User = {
  id: string;
  email: string;
  full_name?: string;
  role: "admin" | "user";
};

type AuthContextType = {
  user: User | null;
  isAdmin: boolean;
  initializing: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User | null>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appState = useRef(AppState.currentState);

  // -----------------------------
  // SAFE SET USER
  // -----------------------------
  const safeSetUser = (value: User | null) => {
    if (mountedRef.current) setUser(value);
  };

  // -----------------------------
  // LOAD PROFILE
  // -----------------------------
  const loadProfile = useCallback(async (id: string, email: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    const profile: User = {
      id,
      email,
      full_name: data?.full_name,
      role: data?.role || "user",
    };

    safeSetUser(profile);
    return profile;
  }, []);

  // -----------------------------
  // CHECK SESSION (SAFE)
  // -----------------------------
  const checkUser = useCallback(async () => {
    const { data } = await supabase.auth.getSession();

    if (data.session?.user) {
      await loadProfile(
        data.session.user.id,
        data.session.user.email || ""
      );
    }

    setTimeout(() => setInitializing(false), 300);
  }, [loadProfile]);

  // -----------------------------
  // AUTH LISTENER (FIXED)
  // -----------------------------
  useEffect(() => {
    mountedRef.current = true;
    checkUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mountedRef.current) return;

        // 🚨 IMPORTANT: ignore temporary null during app resume/camera return
        if (appState.current !== "active") return;

        // cancel logout timer if user comes back
        if (logoutTimer.current) {
          clearTimeout(logoutTimer.current);
          logoutTimer.current = null;
        }

        if (session?.user) {
          loadProfile(session.user.id, session.user.email || "");
        } else {
          // 🟢 IMPORTANT FIX: DO NOT LOG OUT IMMEDIATELY
          logoutTimer.current = setTimeout(async () => {
            const { data } = await supabase.auth.getSession();

            if (!data.session?.user) {
              safeSetUser(null);
            }
          }, 1500); // grace period prevents camera logout bug
        }
      }
    );

    // track app state (VERY IMPORTANT for camera bug)
    const sub = AppState.addEventListener("change", (state) => {
      appState.current = state;
    });

    return () => {
      mountedRef.current = false;
      listener.subscription.unsubscribe();
      sub.remove();

      if (logoutTimer.current) clearTimeout(logoutTimer.current);
    };
  }, [checkUser, loadProfile]);

  // -----------------------------
  // LOGIN
  // -----------------------------
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        return await loadProfile(
          data.user.id,
          data.user.email || ""
        );
      }

      return null;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // SIGNUP
  // -----------------------------
  const signUp = async (
    email: string,
    password: string,
    fullName: string
  ) => {
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await supabase.from("profiles").insert({
          id: data.user.id,
          email,
          full_name: fullName,
          role: "user",
        });
      }

      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // LOGOUT (SAFE)
  // -----------------------------
  const logout = async () => {
    setLoading(true);

    try {
      if (logoutTimer.current) clearTimeout(logoutTimer.current);

      await supabase.auth.signOut();
      safeSetUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: user?.role === "admin",
        initializing,
        loading,
        error,
        login,
        signUp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};

export default function AuthContextRoute() {
  return null;
}