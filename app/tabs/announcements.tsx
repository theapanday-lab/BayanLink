import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { supabase } from "../../lib/supabase";
import { useAuth } from "../context/AuthContext";

type AnnouncementType = "Notice" | "Event" | "Emergency";

type Announcement = {
  id: number;
  title: string;
  content: string;
  type: AnnouncementType;
  created_at: string;
  event_date?: string;
};

const announcementTypes: AnnouncementType[] = [
  "Notice",
  "Event",
  "Emergency",
];

export default function AnnouncementScreen() {
  const { isAdmin } = useAuth();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<AnnouncementType>("Notice");
  
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      // Optimized query running alongside database index
      const { data, error } = await supabase
        .from("announcements")
        .select("id, title, content, type, created_at, event_date")
        .order("created_at", { ascending: false });

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }
      setAnnouncements(data || []);
    } catch (err: any) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const postAnnouncement = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert("Validation Error", "Title and Message details cannot be empty.");
      return;
    }

    // 1. Prepare Data Formats immediately
    const targetTitle = title.trim();
    const targetMessage = message.trim();
    const targetType = type;
    const formattedEventDate = eventDate 
      ? eventDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : null;

    // 2. Generate a temporary Optimistic Local Object
    const temporaryId = Date.now();
    const optimisticAnnouncement: Announcement = {
      id: temporaryId,
      title: targetTitle,
      content: targetMessage,
      type: targetType,
      created_at: new Date().toISOString(),
      event_date: formattedEventDate || undefined,
    };

    // ⚡ INSTANT UI UPDATE: Inject item immediately before network call begins
    setAnnouncements((prev) => [optimisticAnnouncement, ...prev]);

    // Clear administrative input forms instantly for rapid workflows
    setTitle("");
    setMessage("");
    setEventDate(null);
    setType("Notice");

    try {
      setPosting(true);
      
      const { data, error } = await supabase
        .from("announcements")
        .insert([
          {
            title: targetTitle,
            content: targetMessage,
            type: targetType,
            event_date: formattedEventDate,
          },
        ])
        .select();

      if (error) {
        throw new Error(error.message);
      }

      // Sync the temporary ID placeholder with the real permanent database ID quietly
      if (data && data.length > 0) {
        setAnnouncements((prev) =>
          prev.map((item) => (item.id === temporaryId ? data[0] : item))
        );
      }
    } catch (err: any) {
      // Rollback UI State completely if the network database server failed or timed out
      setAnnouncements((prev) => prev.filter((item) => item.id !== temporaryId));
      
      // Restore input values so user doesn't lose data
      setTitle(targetTitle);
      setMessage(targetMessage);
      setType(targetType);
      Alert.alert("Post Failed", err.message || "Network issue encountered.");
    } finally {
      setPosting(false);
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (event.type === "set" && selectedDate) {
      setEventDate(selectedDate);
    }
  };

  const confirmDelete = (id: number) => {
    Alert.alert(
      "Delete Announcement",
      "Are you sure you want to permanently delete this announcement?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteAnnouncement(id) }
      ]
    );
  };

  const deleteAnnouncement = async (id: number) => {
    // ⚡ Instant UI Update on Delete (Optimistic Delete)
    const backupAnnouncements = [...announcements];
    setAnnouncements((prev) => prev.filter((item) => item.id !== id));

    try {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) {
        throw new Error(error.message);
      }
    } catch (err: any) {
      // Revert if database delete fails
      setAnnouncements(backupAnnouncements);
      Alert.alert("Delete Error", err.message);
    }
  };

  const formatPublishedDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const pinned = announcements.find((a) => a.type === "Emergency");

  return (
    <LinearGradient
      colors={["#ff4d6d", "#4a0e17", "#0f0f1a"]}
      locations={[0, 0.4, 0.85]}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollPadding} showsVerticalScrollIndicator={false}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.welcome}>UPDATES & NEWS</Text>
            <Text style={styles.title}>Announcements</Text>
            <View style={styles.titleBar} />
          </View>

          {/* STATS */}
          <View style={styles.statsRow}>
            <StatCard icon="megaphone" label="Total Feed" count={announcements.length} color="#ff4d6d" />
            <StatCard icon="alert-circle" label="Urgent" count={announcements.filter((a) => a.type === "Emergency").length} color="#ff3b30" />
            <StatCard icon="calendar" label="Events" count={announcements.filter((a) => a.type === "Event").length} color="#ffb703" />
          </View>

          {/* PINNED EMERGENCY */}
          {pinned && (
            <View style={styles.pinnedCard}>
              <View style={styles.pinnedBadgeIcon}>
                <Ionicons name="warning" size={16} color="#ff3b30" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={styles.timestampRow}>
                  <Text style={styles.pinnedLabel}>URGENT CRITICAL ALERT</Text>
                  <Text style={styles.pinnedTime}>{formatPublishedDate(pinned.created_at)}</Text>
                </View>
                <Text style={styles.pinnedText} numberOfLines={2}>{pinned.title}</Text>
                {pinned.event_date && (
                  <View style={styles.pinnedScheduleRow}>
                    <Ionicons name="time-outline" size={12} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={styles.pinnedScheduleText}>Schedule: {pinned.event_date}</Text>
                  </View>
                )}
              </View>
              {isAdmin && (
                <TouchableOpacity onPress={() => confirmDelete(pinned.id)} style={styles.pinnedDeleteBtn}>
                  <Ionicons name="trash-outline" size={16} color="#ff3b30" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ADMIN PANEL */}
          {isAdmin && (
            <View style={styles.adminGlassCard}>
              <Text style={styles.sectionTitle}>Create Announcement</Text>

              <TextInput
                placeholder="Title (e.g., Water Interruption)"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
              />

              <TouchableOpacity 
                style={styles.datePickerToggle} 
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="rgba(255,255,255,0.6)" style={{ marginRight: 10 }} />
                <Text style={[styles.datePickerText, eventDate && { color: "#fff" }]}>
                  {eventDate 
                    ? `Event Scheduled: ${eventDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                    : "Select Event Date (Optional)"
                  }
                </Text>
                {eventDate && (
                  <TouchableOpacity onPress={() => setEventDate(null)} style={styles.clearDateBtn}>
                    <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              {(showDatePicker || Platform.OS === "ios") && (
                <View style={Platform.OS === "ios" ? styles.iosPickerContainer : null}>
                  <DateTimePicker
                    value={eventDate || new Date()}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    onChange={onDateChange}
                    minimumDate={new Date()}
                    themeVariant="dark"
                  />
                  {Platform.OS === "ios" && (
                    <TouchableOpacity 
                      style={styles.iosCloseBtn} 
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.iosCloseBtnText}>Done</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <TextInput
                placeholder="Compose message details..."
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={message}
                onChangeText={setMessage}
                multiline
                style={[styles.input, styles.textArea]}
              />

              <View style={styles.typeRow}>
                {announcementTypes.map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setType(t)}
                    style={[styles.typeBtn, type === t && styles.typeActive]}
                  >
                    <Text style={[styles.typeText, type === t && styles.typeTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={postAnnouncement}
                disabled={posting}
                style={[styles.postBtn, posting && { opacity: 0.6 }]}
              >
                <Ionicons name="paper-plane" size={16} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.postText}>
                  {posting ? "Publishing..." : "Publish Announcement"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* FEED */}
          <Text style={styles.feedTitle}>Latest Feed</Text>

          {loading ? (
            <Text style={styles.statusText}>Loading announcements...</Text>
          ) : announcements.length === 0 ? (
            <Text style={styles.empty}>No announcements published yet</Text>
          ) : (
            announcements.map((item) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, paddingRight: isAdmin ? 32 : 0 }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDate}>Posted {formatPublishedDate(item.created_at)}</Text>
                  </View>
                  <View style={[styles.badge, item.type === "Emergency" ? styles.badgeEmergency : item.type === "Event" ? styles.badgeEvent : styles.badgeNotice]}>
                    <Text style={styles.badgeText}>{item.type}</Text>
                  </View>
                </View>

                {item.event_date && (
                  <View style={styles.scheduleBadgeContainer}>
                    <Ionicons name="calendar-outline" size={14} color="#ff4d6d" />
                    <Text style={styles.scheduleBadgeText}>
                      Happening: <Text style={styles.scheduleDateHighlight}>{item.event_date}</Text>
                    </Text>
                  </View>
                )}

                <Text style={styles.message}>{item.content}</Text>

                {isAdmin && (
                  <TouchableOpacity onPress={() => confirmDelete(item.id)} style={styles.cardDeleteBtn}>
                    <Ionicons name="trash-outline" size={16} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function StatCard({ icon, label, count, color }: any) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.statNumber}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollPadding: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },
  header: { marginBottom: 24, marginTop: 10 },
  welcome: { color: "#ff4d6d", fontSize: 12, fontWeight: "700", letterSpacing: 1.5, marginBottom: 4 },
  title: { color: "#fff", fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
  titleBar: { width: 32, height: 4, borderRadius: 2, backgroundColor: "#ff4d6d", marginTop: 8 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginBottom: 24 },
  statCard: { flex: 1, alignItems: "center", backgroundColor: "rgba(255, 255, 255, 0.06)", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.08)", paddingVertical: 14, borderRadius: 16 },
  statIconContainer: { padding: 8, borderRadius: 12, marginBottom: 6 },
  statNumber: { color: "#fff", fontSize: 20, fontWeight: "700" },
  statLabel: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "500", marginTop: 2 },
  pinnedCard: { position: "relative", flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255, 59, 48, 0.15)", borderWidth: 1, borderColor: "rgba(255, 59, 48, 0.3)", padding: 14, borderRadius: 16, marginBottom: 24 },
  timestampRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pinnedBadgeIcon: { backgroundColor: "rgba(255, 59, 48, 0.2)", padding: 8, borderRadius: 10 },
  pinnedLabel: { color: "#ff3b30", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  pinnedTime: { color: "rgba(255, 255, 255, 0.4)", fontSize: 10, fontWeight: "500", marginRight: 24 },
  pinnedText: { color: "#fff", fontWeight: "600", fontSize: 14, marginTop: 2 },
  pinnedScheduleRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  pinnedScheduleText: { color: "rgba(255, 255, 255, 0.8)", fontSize: 12, fontWeight: "500" },
  pinnedDeleteBtn: { position: "absolute", right: 12, top: 12, padding: 6, borderRadius: 8, backgroundColor: "rgba(255, 59, 48, 0.1)" },
  adminGlassCard: { backgroundColor: "rgba(255, 255, 255, 0.07)", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.12)", padding: 18, borderRadius: 20, marginBottom: 28 },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 14 },
  input: { backgroundColor: "rgba(0, 0, 0, 0.3)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", color: "#fff", paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, marginBottom: 12, fontSize: 14 },
  textArea: { height: 90, textAlignVertical: "top" },
  datePickerToggle: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.3)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", paddingHorizontal: 14, paddingVertical: 14, borderRadius: 12, marginBottom: 12, position: "relative" },
  datePickerText: { color: "rgba(255,255,255,0.35)", fontSize: 14, fontWeight: "500" },
  clearDateBtn: { position: "absolute", right: 14, height: "100%", justifyContent: "center" },
  iosPickerContainer: { backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 14, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  iosCloseBtn: { paddingVertical: 8, alignItems: "center", borderTopWidth: 1, borderColor: "rgba(255,255,255,0.1)", marginTop: 4 },
  iosCloseBtnText: { color: "#ff4d6d", fontWeight: "700", fontSize: 15 },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  typeBtn: { flex: 1, paddingVertical: 10, alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", borderRadius: 10 },
  typeActive: { backgroundColor: "#ff4d6d", borderColor: "#ff758f" },
  typeText: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "600" },
  typeTextActive: { color: "#fff", fontWeight: "700" },
  postBtn: { flexDirection: "row", backgroundColor: "#ff4d6d", paddingVertical: 14, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  postText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  feedTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 14 },
  card: { position: "relative", backgroundColor: "rgba(255, 255, 255, 0.05)", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.06)", padding: 16, marginBottom: 12, borderRadius: 16 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 12 },
  cardTitle: { color: "#fff", fontWeight: "700", fontSize: 16 },
  cardDate: { color: "rgba(255, 255, 255, 0.35)", fontSize: 11, fontWeight: "500", marginTop: 2 },
  cardDeleteBtn: { position: "absolute", right: 14, bottom: 14, padding: 6, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.05)" },
  scheduleBadgeContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255, 77, 109, 0.1)", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: "rgba(255, 77, 109, 0.15)" },
  scheduleBadgeText: { color: "rgba(255, 255, 255, 0.6)", fontSize: 12, marginLeft: 6, fontWeight: "500" },
  scheduleDateHighlight: { color: "#ff4d6d", fontWeight: "700" },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeNotice: { backgroundColor: "rgba(255,255,255,0.12)" },
  badgeEvent: { backgroundColor: "rgba(255, 183, 3, 0.2)" },
  badgeEmergency: { backgroundColor: "rgba(255, 59, 48, 0.2)" },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  message: { color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 20, paddingRight: 30 },
  statusText: { color: "rgba(255,255,255,0.5)", textAlign: "center", marginTop: 20 },
  empty: { color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: 30, fontSize: 14 },
});