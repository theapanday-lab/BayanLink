import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../context/AuthContext";

type Report = {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  image_url?: string;
  status: string;
  created_at: string;
};

export default function MyReportsScreen() {
  const { isAdmin } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    if (isAdmin) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.log("FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [fetchReports])
  );

  if (isAdmin) {
    return <Redirect href="/tabs/home" />;
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Pending":
        return { color: "#ff4d6d", bg: "rgba(255, 77, 109, 0.2)" };
      case "In Progress":
        return { color: "#ffb703", bg: "rgba(255, 183, 3, 0.2)" };
      case "Resolved":
        return { color: "#38b000", bg: "rgba(56, 176, 0, 0.2)" };
      default:
        return { color: "#fff", bg: "rgba(255, 255, 255, 0.1)" };
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "No date";
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <LinearGradient colors={["#ff4d6d", "#800f2f", "#0f0f1a"]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>Community History</Text>
          <Text style={styles.headerTitle}>My Reports</Text>
          <View style={styles.titleBar} />
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollPadding}
        >
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#ff4d6d" />
              <Text style={styles.loadingText}>Fetching your reports...</Text>
            </View>
          ) : reports.length === 0 ? (
            <View style={styles.centerBox}>
              <Ionicons name="document-text-outline" size={80} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>{"You haven't submitted any reports yet."}</Text>
            </View>
          ) : (
            reports.map((report) => {
              const statusTheme = getStatusStyle(report.status);
              return (
                <View key={report.id} style={styles.glassCard}>
                  {report.image_url && (
                    <Image source={{ uri: report.image_url }} style={styles.cardImage} />
                  )}

                  <View style={styles.cardContent}>
                    <View style={styles.row}>
                      <Text style={styles.reportTitle} numberOfLines={1}>
                        {report.title}
                      </Text>
                      <View style={[styles.badge, { backgroundColor: statusTheme.bg }]}>
                        <Text style={[styles.badgeText, { color: statusTheme.color }]}>
                          {report.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.categoryPill}>
                      <Ionicons name="pricetag-outline" size={12} color="#ffb3c1" />
                      <Text style={styles.categoryText}>{report.category}</Text>
                    </View>

                    <Text style={styles.description} numberOfLines={2}>
                      {report.description}
                    </Text>

                    <View style={styles.divider} />

                    <View style={styles.footer}>
                      <View style={styles.footerItem}>
                        <Ionicons name="location-sharp" size={14} color="#ff4d6d" />
                        <Text style={styles.footerText} numberOfLines={1}>{report.location}</Text>
                      </View>
                      <Text style={styles.dateText}>{formatDate(report.created_at)}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollPadding: { padding: 20, paddingBottom: 40 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    marginBottom: 20,
  },
  headerSubtitle: {
    color: "#ffb3c1",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "900",
  },
  titleBar: {
    width: 40,
    height: 5,
    backgroundColor: "#ff4d6d",
    marginTop: 6,
    borderRadius: 3,
  },
  centerBox: {
    flex: 1,
    marginTop: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: { color: "#ffccd5", marginTop: 15, fontWeight: "600" },
  emptyText: {
    color: "rgba(255,255,255,0.4)",
    marginTop: 15,
    textAlign: "center",
    fontSize: 16,
    width: "70%",
  },
  glassCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 28,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 180,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  cardContent: {
    padding: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    flex: 1,
    paddingRight: 10,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    color: "#ffb3c1",
    marginLeft: 5,
    fontWeight: "700",
  },
  description: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    lineHeight: 20,
    marginBottom: 15,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 15,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  footerText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 13,
    marginLeft: 6,
    fontWeight: "500",
  },
  dateText: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 12,
    fontWeight: "600",
  },
});
