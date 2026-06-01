import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function ProfileScreen() {
  const router = useRouter();
  const { isAdmin, logout, user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Profile</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#fff" />
        </View>
        <Text style={styles.name}>{user?.full_name ?? "Guest"}</Text>
        <Text style={styles.subText}>
          {isAdmin ? "BayanLink Admin" : "BayanLink User"}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="mail-outline" size={20} color="#555" />
          <Text style={styles.cardText}>{user?.email ?? "No email"}</Text>
        </View>

        <View style={styles.row}>
          <Ionicons name="location-outline" size={20} color="#555" />
          <Text style={styles.cardText}>Davao del Sur</Text>
        </View>
      </View>

     <TouchableOpacity
      style={styles.logoutButton}
      onPress={async () => {
        await logout();
        router.replace("/");
      }}
    >
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f7fb",
  },

  header: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
  },

  profileCard: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 20,
    elevation: 3,
  },

  avatar: {
    backgroundColor: "#ff4d6d",
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  name: {
    fontSize: 20,
    fontWeight: "bold",
  },

  subText: {
    fontSize: 14,
    color: "#777",
  },

  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    elevation: 2,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 10,
  },

  cardText: {
    fontSize: 16,
    color: "#333",
  },

  logoutButton: {
    flexDirection: "row",
    backgroundColor: "#ff4d6d",
    padding: 15,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
