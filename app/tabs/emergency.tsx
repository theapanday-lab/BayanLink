import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import {
  Alert,
  Animated,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const contacts = [
  {
    category: "Emergency Hotline",
    data: [
      { name: "Police", number: "911", icon: "shield-checkmark" },
      { name: "Fire Station", number: "160", icon: "flame" },
    ],
  },
  {
    category: "Medical",
    data: [{ name: "Hospital", number: "117", icon: "medical" }],
  },
  {
    category: "Local Support",
    data: [{ name: "Barangay Office", number: "1234567", icon: "business" }],
  },
];

export default function EmergencyScreen() {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Continuous subtle pulse for the main button
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const handleCall = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  const handleEmergencyDrill = () => {
    Alert.alert(
      "🚨 Drill Activated",
      "Stay calm and follow safety procedures. This is a practice simulation.",
      [{ text: "Understood", style: "destructive" }]
    );
  };

  const pressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <LinearGradient colors={["#ff4d6d", "#800f2f", "#0f0f1a"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.welcome}>Assistance</Text>
            <Text style={styles.title}>Emergency</Text>
            <View style={styles.titleBar} />
          </View>

          {/* BIG PULSING DRILL BUTTON */}
          <View style={styles.buttonWrapper}>
            <Animated.View style={{ transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }] }}>
              <TouchableOpacity
                style={styles.bellContainer}
                onPress={handleEmergencyDrill}
                onPressIn={pressIn}
                onPressOut={pressOut}
                activeOpacity={0.9}
              >
                <LinearGradient colors={["#ff758f", "#ff4d6d"]} style={styles.bellGradient}>
                  <Ionicons name="notifications" size={50} color="#fff" />
                  <Text style={styles.bellText}>DRILL MODE</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* CONTACT LIST */}
          {contacts.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.category}>{section.category}</Text>

              {section.data.map((item, i) => (
                <View key={i} style={styles.card}>
                  <View style={styles.left}>
                    <View style={styles.iconBox}>
                      <Ionicons name={item.icon as any} size={22} color="#ff4d6d" />
                    </View>
                    <View>
                      <Text style={styles.name}>{item.name}</Text>
                      <Text style={styles.number}>{item.number}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => handleCall(item.number)}
                  >
                    <Ionicons name="call" size={16} color="#fff" />
                    <Text style={styles.callText}>CALL</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 10,
  },
  welcome: {
    color: "#ffb3c1",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
  },
  titleBar: {
    width: 40,
    height: 5,
    backgroundColor: "#ff4d6d",
    marginTop: 6,
    borderRadius: 3,
  },
  buttonWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 40,
  },
  bellContainer: {
    width: 170,
    height: 170,
    borderRadius: 85,
    elevation: 15,
    shadowColor: "#ff4d6d",
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  bellGradient: {
    flex: 1,
    borderRadius: 85,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.2)",
  },
  bellText: {
    color: "#fff",
    fontWeight: "900",
    marginTop: 8,
    fontSize: 12,
    letterSpacing: 1.5,
  },
  section: {
    marginBottom: 20,
  },
  category: {
    fontSize: 13,
    fontWeight: "800",
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 44,
    height: 44,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  name: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
  },
  number: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  callButton: {
    backgroundColor: "#ff4d6d",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  callText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
    marginLeft: 6,
  },
});
