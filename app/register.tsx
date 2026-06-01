import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { supabase } from "../lib/supabase";

export default function RegisterScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [role, setRole] = useState<"user" | "admin">("user");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      // 1. CREATE AUTH USER
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        Alert.alert("Signup Failed", error.message);
        return;
      }

      const user = data.user;

      if (!user) {
        Alert.alert("Error", "User not created");
        return;
      }

      // 2. INSERT PROFILE
      const { error: profileError } = await supabase
        .from("profiles")
        .insert([
          {
            id: user.id,
            full_name: fullName,
            email: email,
            role: role,
          },
        ]);

      if (profileError) {
        Alert.alert("Profile Error", profileError.message);
        return;
      }

      Alert.alert(
        "Success",
        "Account created successfully!"
      );

      router.replace("/");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Ionicons
          name="person-add"
          size={40}
          color="#ff4d6d"
        />
        <Text style={styles.title}>
          Create Account
        </Text>
        <Text style={styles.subtitle}>
          Join BayanLink
        </Text>
      </View>

      {/* FORM */}
      <View style={styles.form}>
        <TextInput
          placeholder="Full Name"
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
        />

        <TextInput
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />

        <TextInput
          placeholder="Password"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        {/* ROLE */}
        <Text style={styles.roleLabel}>
          Select Role
        </Text>

        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[
              styles.roleBtn,
              role === "user" &&
                styles.roleActive,
            ]}
            onPress={() => setRole("user")}
          >
            <Text
              style={[
                styles.roleText,
                role === "user" &&
                  styles.roleTextActive,
              ]}
            >
              User
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleBtn,
              role === "admin" &&
                styles.roleActive,
            ]}
            onPress={() => setRole("admin")}
          >
            <Text
              style={[
                styles.roleText,
                role === "admin" &&
                  styles.roleTextActive,
              ]}
            >
              Admin
            </Text>
          </TouchableOpacity>
        </View>

        {/* BUTTON */}
        <TouchableOpacity
          style={[
            styles.button,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading
              ? "Creating..."
              : "Register"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Already have an account? Login instead
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fb",
    justifyContent: "center",
    padding: 20,
  },

  header: {
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 10,
  },

  subtitle: {
    fontSize: 14,
    color: "#777",
  },

  form: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 20,
    elevation: 5,
  },

  input: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },

  roleLabel: {
    marginTop: 5,
    marginBottom: 8,
    fontWeight: "bold",
  },

  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  roleBtn: {
    flex: 1,
    padding: 12,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    alignItems: "center",
  },

  roleActive: {
    backgroundColor: "#ff4d6d",
    borderColor: "#ff4d6d",
  },

  roleText: {
    color: "#333",
    fontWeight: "bold",
  },

  roleTextActive: {
    color: "#fff",
  },

  button: {
    backgroundColor: "#ff4d6d",
    padding: 15,
    borderRadius: 12,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },

  hint: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 12,
    color: "#888",
  },
});