import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { useAuth } from "../context/AuthContext";

// Updated TabIcon with a smoother active state
function TabIcon({ name, color, focused }: any) {
  return (
    <View style={styles.iconWrapper}>
      {/* SMOOTH ACTIVE BACKGROUND
        We use a very soft, subtle pill shape that appears 
        behind the icon instead of a sharp line or a hard glow.
      */}
      {focused && <View style={styles.smoothActiveBg} />}
      
      <Ionicons 
        name={focused ? name.replace("-outline", "") : name} 
        size={28} 
        color={color} 
      />
    </View>
  );
}

export default function Layout() {
  const { isAdmin } = useAuth();

  return (
    <Tabs
      key={isAdmin ? "admin" : "user"}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#FF4D6D", 
        tabBarInactiveTintColor: "rgba(255, 255, 255, 0.25)",
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="grid-outline" color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="announcements"
        options={{
          href: isAdmin ? "/tabs/announcements" : null,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="notifications-outline" color={color} focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person-outline" color={color} focused={focused} />
          ),
        }}
      />

      {/* HIDDEN SCREENS */}
      <Tabs.Screen name="admin" options={{ href: null }} />
      <Tabs.Screen name="report" options={{ href: null }} />
      <Tabs.Screen name="emergency" options={{ href: null }} />
      <Tabs.Screen name="evacuation" options={{ href: null }} />
      <Tabs.Screen name="myreports" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    
    height: Platform.OS === 'ios' ? 95 : 80,
    backgroundColor: "#0f0f1a", 
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 77, 109, 0.15)", 
    elevation: 10,
    shadowColor: "#FF4D6D",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    paddingTop: Platform.OS === 'ios' ? 15 : 10, 
    paddingBottom: Platform.OS === 'ios' ? 25 : 10, 
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: 70, 
  },
  smoothActiveBg: {
    position: "absolute",
    width: 60, // Pill shape size
    height: 60,
    borderRadius: 30, // Perfectly round pill
    backgroundColor: "rgba(255, 77, 109, 0.08)", 
  },
});