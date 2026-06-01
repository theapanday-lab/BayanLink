import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "./context/AuthContext";

function RootLayoutNav() {
  const { user, initializing } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  const hasMounted = useRef(false);

  useEffect(() => {
    if (initializing) return;
    if (!rootNavigationState?.key) return;

    const currentRoute = segments?.[0];

    // public routes only
    const isPublicRoute =
      !currentRoute ||
      currentRoute === "register";

    // mark first mount complete
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    // 🟡 IMPORTANT FIX: delay prevents camera return flicker logout redirect
    const timer = setTimeout(() => {
      // NOT LOGGED IN → GO TO LOGIN
      if (!user && !isPublicRoute) {
        router.replace("/");
        return;
      }

      // LOGGED IN → BLOCK ACCESS TO LOGIN PAGE
      if (user && isPublicRoute) {
        router.replace(
          user.role === "admin" ? "/tabs/admin" : "/tabs/home"
        );
      }
    }, 250); // 🔥 CRITICAL CAMERA FIX DELAY

    return () => clearTimeout(timer);
  }, [user, initializing, segments, rootNavigationState?.key, router]);

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      />

      {initializing && (
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#0f0f1a",
          }}
        >
          <ActivityIndicator size="large" color="#ff4d6d" />
        </View>
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
