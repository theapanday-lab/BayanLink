import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Href, useRouter } from "expo-router";
import { ComponentProps, useRef } from "react";
import {
  Animated,
  DimensionValue,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../context/AuthContext";
import AdminDashboardScreen from "./admin";

type CardItem = {
  title: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  route: Href;
  isLarge?: boolean;
};

type MenuCardProps = {
  item: CardItem;
  width: DimensionValue;
  onPress: (route: Href) => void;
};

function MenuCard({ item, width, onPress }: MenuCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width }}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.card, item.isLarge && styles.largeCard]}
        onPress={() => onPress(item.route)}
        onPressIn={() =>
          Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true }).start()
        }
        onPressOut={() =>
          Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()
        }
      >
        {/* Modernized Icon Container */}
        <View style={[styles.iconCircle, item.isLarge && styles.largeIconCircle]}>
          <Ionicons name={item.icon} size={item.isLarge ? 28 : 32} color="#fff" />
        </View>

        <View style={item.isLarge ? styles.largeTextContainer : null}>
          <Text style={[styles.cardText, item.isLarge && styles.largeText]}>
            {item.title}
          </Text>
          {item.isLarge && (
            <Text style={styles.cardDesc}>Stay updated with community news</Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { isAdmin } = useAuth();

  // If Admin, show Admin Dashboard
  if (isAdmin) {
    return <AdminDashboardScreen />;
  }

  const menu: CardItem[] = [
    { title: "Report", icon: "document-text", route: "/tabs/report" },
    { title: "My Reports", icon: "list", route: "/tabs/myreports" },
    { title: "Updates", icon: "megaphone", route: "/tabs/announcements", isLarge: true },
    { title: "Emergency", icon: "alert-circle", route: "/tabs/emergency" },
    { title: "Evacuation", icon: "map", route: "/tabs/evacuation" },
  ];

  return (
    <LinearGradient colors={["#ff4d6d", "#800f2f", "#0f0f1a"]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollPadding}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.welcome}>Laging Handa,</Text>
            <Text style={styles.title}>BayanLink</Text>
            <View style={styles.titleBar} />
            <Text style={styles.subtitle}>
              Report issues, stay safe, and help your community
            </Text>
          </View>

          {/* Functional Menu Grid */}
          <View style={styles.grid}>
            {menu.map((item) => (
              <MenuCard
                key={item.title}
                item={item}
                width={item.isLarge ? "100%" : "48%"}
                onPress={(route) => router.push(route)}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollPadding: {
    padding: 24,
    paddingTop: 40,
  },
  header: {
    marginBottom: 35,
  },
  welcome: {
    color: "#ffb3c1",
    fontSize: 16,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  title: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "900",
    lineHeight: 52,
  },
  titleBar: {
    width: 45,
    height: 6,
    backgroundColor: "#ff4d6d",
    marginTop: 8,
    borderRadius: 3,
  },
  subtitle: {
    color: "#ffccd5",
    fontSize: 15,
    marginTop: 15,
    lineHeight: 22,
    opacity: 0.9,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.12)", // Clean unified card color
    height: 160,
    borderRadius: 30,
    marginBottom: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
  },
  largeCard: {
    height: 110,
    flexDirection: "row",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 22, // Modern squircle
    backgroundColor: "#ff4d6d", // Solid color branding
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    // Shadow for depth
    shadowColor: "#ff4d6d",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  largeIconCircle: {
    marginBottom: 0,
    marginRight: 18,
    width: 58,
    height: 58,
  },
  largeTextContainer: {
    flex: 1,
  },
  cardText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  largeText: {
    fontSize: 19,
    fontWeight: "800",
  },
  cardDesc: {
    color: "#ffccd5",
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
});