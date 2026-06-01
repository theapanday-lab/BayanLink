import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

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
  latitude: number;
  longitude: number;
};

type CategoryFilter = "All" | "Waste" | "Road" | "Safety";

export default function AdminDashboardScreen() {
  const { isAdmin } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState<CategoryFilter>("All");
  const [refreshing, setRefreshing] = useState(false);
  
  // State to toggle between Active and Resolved views
  const [viewMode, setViewMode] = useState<"Active" | "Resolved">("Active");

  const fetchReports = useCallback(async () => {
    if (!isAdmin) return;

    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setReports(data || []);
  }, [isAdmin]);

  useFocusEffect(useCallback(() => { fetchReports(); }, [fetchReports]));

  if (!isAdmin) return <Redirect href="/tabs/home" />;

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
  };

  const updateStatus = async (id: number, status: string) => {
    const { error } = await supabase.from("reports").update({ status }).eq("id", id);
    if (!error) fetchReports();
  };

  const confirmDelete = (id: number) => {
    Alert.alert("Confirm Deletion", "This report will be permanently removed.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          await supabase.from("reports").delete().eq("id", id);
          fetchReports();
      }},
    ]);
  };

  // --- FILTER & SEPARATION LOGIC ---
  const categoryFiltered = filter === "All" ? reports : reports.filter(r => r.category === filter);
  
  // Display reports based on whether the Admin is looking at "Active" or "Resolved" tab
  const displayReports = categoryFiltered.filter(r => 
    viewMode === "Active" ? r.status !== "Resolved" : r.status === "Resolved"
  );

  return (
    <LinearGradient colors={["#ff4d6d", "#800f2f", "#0f0f1a"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* HEADER SECTION */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.welcomeText}>ADMIN PANEL</Text>
            <Text style={styles.headerTitle}>
              {viewMode === "Active" ? "Active Reports" : "Resolution History"}
            </Text>
          </View>
          
          {/* THE TOGGLE BUTTON */}
          <TouchableOpacity 
            style={[styles.archiveBtn, viewMode === "Resolved" && styles.archiveBtnActive]} 
            onPress={() => setViewMode(viewMode === "Active" ? "Resolved" : "Active")}
          >
            <Ionicons 
              name={viewMode === "Active" ? "archive-outline" : "list-outline"} 
              size={24} 
              color="#fff" 
            />
            {viewMode === "Active" && reports.filter(r => r.status === "Resolved").length > 0 && (
              <View style={styles.badgeDot} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        >
          {/* CATEGORY CHIPS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
            {(["All", "Waste", "Road", "Safety"] as CategoryFilter[]).map(item => (
              <TouchableOpacity 
                key={item} 
                onPress={() => setFilter(item)}
                style={[styles.chip, filter === item && styles.chipActive]}
              >
                <Text style={[styles.chipText, filter === item && styles.chipTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* LIST OF REPORTS */}
          {displayReports.map((report) => (
            <View key={report.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.idGroup}>
                  <Text style={styles.reportId}>#{report.id}</Text>
                  <View style={[styles.statusTag, { backgroundColor: report.status === "In Progress" ? "rgba(244, 162, 97, 0.25)" : "rgba(255, 77, 109, 0.25)", borderColor: report.status === "In Progress" ? "#f4a261" : "#ff4d6d" }]}>
                    <Text style={[styles.statusTagText, { color: report.status === "In Progress" ? "#f4a261" : "#ff4d6d" }]}>{report.status}</Text>
                  </View>
                </View>
                <Text style={styles.dateText}>{new Date(report.created_at).toLocaleDateString()}</Text>
              </View>

              <Text style={styles.reportTitle}>{report.title}</Text>
              <Text style={styles.reportDesc}>{report.description}</Text>
              
              <View style={styles.locRow}>
                <Ionicons name="location" size={14} color="#ff4d6d" />
                <Text style={styles.locText}>{report.location}</Text>
              </View>

              {/* NEW: VISUAL EVIDENCE ATTACHMENT HOLDER */}
              <Text style={styles.sectionLabel}>Evidence Photo</Text>
              <View style={styles.imageClip}>
                {report.image_url ? (
                  <Image 
                    source={{ uri: report.image_url }} 
                    style={styles.evidenceImage} 
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="images-outline" size={32} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.placeholderText}>No photo attached by user</Text>
                  </View>
                )}
              </View>

              <Text style={styles.sectionLabel}>Mapped Coordinate</Text>
              <View style={styles.mapClip}>
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={styles.miniMap}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  initialRegion={{
                    latitude: report.latitude || 6.7499,
                    longitude: report.longitude || 125.3572,
                    latitudeDelta: 0.002,
                    longitudeDelta: 0.002,
                  }}
                >
                  <Marker coordinate={{ latitude: report.latitude, longitude: report.longitude }} pinColor="#ff4d6d" />
                </MapView>
              </View>

              <View style={styles.divider} />

              <View style={styles.cardFooter}>
                {viewMode === "Active" ? (
                  <TouchableOpacity 
                    style={[styles.actionBtn, report.status === "In Progress" ? styles.btnGreen : styles.btnRed]}
                    onPress={() => updateStatus(report.id, report.status === "Pending" ? "In Progress" : "Resolved")}
                  >
                    <Ionicons name={report.status === "Pending" ? "play" : "checkmark-circle"} size={18} color="#fff" />
                    <Text style={styles.actionLabel}>
                      {report.status === "Pending" ? "START WORK" : "RESOLVE"}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.completedTag}>
                    <Ionicons name="shield-checkmark" size={18} color="#4ade80" />
                    <Text style={styles.completedText}>COMPLETED</Text>
                  </View>
                )}
                
                <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDelete(report.id)}>
                  <Ionicons name="trash-outline" size={20} color="#ff4d6d" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {displayReports.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="file-tray-outline" size={60} color="rgba(255,255,255,0.1)" />
              <Text style={styles.emptyText}>No {viewMode.toLowerCase()} reports found.</Text>
            </View>
          )}
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
    marginTop: Platform.OS === 'android' ? 30 : 0,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  welcomeText: {
    color: '#ffccd5',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  archiveBtn: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  archiveBtnActive: {
    backgroundColor: '#4ade80',
    borderColor: '#4ade80',
  },
  badgeDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff4d6d',
    borderWidth: 2,
    borderColor: '#800f2f',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  filterBar: {
    marginBottom: 20,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipActive: {
    backgroundColor: '#ff4d6d',
    borderColor: '#ff4d6d',
  },
  chipText: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '700',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  idGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportId: {
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '800',
    fontSize: 12,
    marginRight: 10,
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusTagText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
  },
  reportTitle: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 6,
  },
  reportDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locText: {
    color: '#ffccd5',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 5,
  },
  sectionLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  imageClip: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  evidenceImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  mapClip: {
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  miniMap: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 15,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  btnRed: {
    backgroundColor: '#ff4d6d',
  },
  btnGreen: {
    backgroundColor: '#4ade80',
  },
  actionLabel: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 13,
    marginLeft: 8,
  },
  completedTag: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.2)',
  },
  completedText: {
    color: '#4ade80',
    fontWeight: '900',
    fontSize: 13,
    marginLeft: 8,
  },
  deleteBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
  },
});