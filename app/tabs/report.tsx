import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { ReportState } from "../../lib/ReportState";
import { supabase } from "../../lib/supabase";

type CategoryType = "Waste" | "Road" | "Safety";
const REPORT_DRAFT_KEY = "report_draft";

export default function ReportScreen() {
  const router = useRouter();

  // =========================
  // FORM STATES
  // =========================
  const [title, setTitle] = useState("");
  const [locationName, setLocationName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CategoryType>("Waste");
  const [image, setImage] = useState<string | undefined>(undefined);

  // =========================
  // UI STATES
  // =========================
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  // =========================
  // MAP STATES
  // =========================
  const [coords, setCoords] = useState({ latitude: 6.7499, longitude: 125.3572 });
  const [region, setRegion] = useState({
    latitude: 6.7499,
    longitude: 125.3572,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });
  const [isMapFull, setIsMapFull] = useState(false);

  const isHydrated = useRef(false);
  const hasLoadedLocationOnce = useRef(false);
  const isNavigatingToCamera = useRef(false);
  const isSubmitting = useRef(false); // Prevents auto-save interference during cleanup

  // =========================
  // DRAFT RESTORATION ON MOUNT
  // =========================
  useEffect(() => {
    const restoreDraftAndLocation = async () => {
      try {
        const saved = await AsyncStorage.getItem(REPORT_DRAFT_KEY);
        let draftCoords = null;

        if (saved) {
          const draft = JSON.parse(saved);
          setTitle(draft.title || "");
          setLocationName(draft.locationName || "");
          setDescription(draft.description || "");
          setCategory(draft.category || "Waste");
          setImage(draft.image || undefined);
          
          if (draft.coords) {
            setCoords(draft.coords);
            draftCoords = draft.coords;
          }
          if (draft.region) {
            setRegion(draft.region);
          }
        }

        if (!draftCoords && !hasLoadedLocationOnce.current) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const loc = await Location.getCurrentPositionAsync({});
            const current = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
            setCoords(current);
            setRegion({
              latitude: current.latitude,
              longitude: current.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            });
            hasLoadedLocationOnce.current = true;
          }
        }
      } catch (err) {
        console.log("restore error:", err);
      } finally {
        isHydrated.current = true;
      }
    };

    restoreDraftAndLocation();
  }, []);

  // =========================
  // OPTIMIZED AUTO-SAVE ENGINE
  // =========================
  useEffect(() => {
    if (!isHydrated.current || isSubmitting.current) return;

    const timeout = setTimeout(() => {
      AsyncStorage.setItem(
        REPORT_DRAFT_KEY,
        JSON.stringify({ title, locationName, description, category, image, coords, region })
      ).catch((err) => console.log("save draft error:", err));
    }, 1000); // Higher bounce delay stops UI frame-drops while typing

    return () => clearTimeout(timeout);
  }, [title, locationName, description, category, image, coords, region]);

  // =========================
  // FOCUS & EXIT ENGINE
  // =========================
  useFocusEffect(
    useCallback(() => {
      setLoading(false);
      setError("");
      isNavigatingToCamera.current = false;
      isSubmitting.current = false;

      if (ReportState.capturedImageUri) {
        setImage(ReportState.capturedImageUri);
        ReportState.capturedImageUri = undefined;
      }

      return () => {
        // If changing views inside the report pipeline, do not dump data
        if (isNavigatingToCamera.current || isSubmitting.current) return;

        setTitle("");
        setLocationName("");
        setDescription("");
        setCategory("Waste");
        setImage(undefined);
        setError("");
        isHydrated.current = false;
        hasLoadedLocationOnce.current = false;
        ReportState.capturedImageUri = undefined;

        AsyncStorage.removeItem(REPORT_DRAFT_KEY).catch((err) =>
          console.log("Error clearing draft on exit:", err)
        );
      };
    }, [])
  );

  // =========================
  // RESET METHOD
  // =========================
  const resetForm = async () => {
    setTitle("");
    setLocationName("");
    setDescription("");
    setCategory("Waste");
    setImage(undefined);
    setError("");
    isHydrated.current = false;
    hasLoadedLocationOnce.current = false;
    ReportState.capturedImageUri = undefined;

    await AsyncStorage.removeItem(REPORT_DRAFT_KEY);
  };

  // =========================
  // ACTIONS
  // =========================
  const takePhoto = async () => {
    setModalVisible(false);
    isNavigatingToCamera.current = true;

    try {
      await AsyncStorage.setItem(
        REPORT_DRAFT_KEY,
        JSON.stringify({ title, locationName, description, category, image, coords, region })
      );
    } catch (err) {
      console.log("pre-camera save error:", err);
    }
    
    router.push("/camera");
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Gallery access is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title || !locationName || !description) {
      setError("⚠️ Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (!user) {
        Alert.alert("Session Expired", "Please login again.");
        router.replace("/");
        return;
      }

      // 1. Send the database payload
      const { error: insertError } = await supabase.from("reports").insert([
        {
          user_id: user.id,
          title,
          description,
          category,
          location: locationName,
          image_url: image ?? null,
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      ]);

      if (insertError) {
        setError(insertError.message);
        setLoading(false);
        return;
      }

      // 2. Safely flag that we are submitting, to freeze background writing loops
      isSubmitting.current = true;

      // 3. Clear storage data and transition instantly
      await resetForm();
      router.push("/tabs/myreports");
    } catch (err) {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#ff4d6d", "#800f2f", "#0f0f1a"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Report Issue</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.glassCard}>
            <Text style={styles.label}>What's the issue?</Text>
            <TextInput
              placeholder="e.g. Pothole on Main Road"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />

            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryRow}>
              {(["Waste", "Road", "Safety"] as CategoryType[]).map((item) => {
                const isActive = category === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.categoryBtn, isActive && styles.categoryActive]}
                    onPress={() => setCategory(item)}
                  >
                    <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput
              placeholder="Provide more details..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={description}
              onChangeText={setDescription}
              style={[styles.input, styles.textArea]}
              multiline
            />

            <Text style={styles.label}>Pin Location</Text>
            <TouchableOpacity style={styles.mapContainer} onPress={() => setIsMapFull(true)}>
              <MapView provider={PROVIDER_GOOGLE} style={styles.map} region={region} scrollEnabled={false} zoomEnabled={false}>
                <Marker coordinate={coords} />
              </MapView>
            </TouchableOpacity>

            <Text style={styles.label}>Street / Landmark</Text>
            <TextInput
              placeholder="Enter location"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={locationName}
              onChangeText={setLocationName}
              style={styles.input}
            />

            <Text style={styles.label}>Evidence Photo</Text>
            <TouchableOpacity style={styles.uploadArea} onPress={() => setModalVisible(true)}>
              {image ? (
                <Image source={{ uri: image }} style={styles.previewImage} />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Ionicons name="camera-outline" size={40} color="#ff4d6d" />
                  <Text style={styles.uploadText}>Tap to upload photo</Text>
                </View>
              )}
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={[styles.submitBtn, loading && styles.disabledBtn]} disabled={loading} onPress={handleSubmit}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Report</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      <Modal visible={isMapFull}>
        <MapView provider={PROVIDER_GOOGLE} style={{ flex: 1 }} region={region} onRegionChangeComplete={setRegion}>
          <Marker coordinate={coords} draggable onDragEnd={(e) => setCoords(e.nativeEvent.coordinate)} />
        </MapView>
        <TouchableOpacity style={styles.closeMapBtn} onPress={() => setIsMapFull(false)}>
          <Text style={styles.closeMapText}>Confirm Location</Text>
        </TouchableOpacity>
      </Modal>

      <Modal transparent visible={modalVisible} animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Image Source</Text>
            <View style={styles.modalOptions}>
              <TouchableOpacity style={styles.modalOption} onPress={takePhoto}>
                <Ionicons name="camera" size={28} color="#ff4d6d" />
                <Text style={styles.modalOptionText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOption} onPress={pickImage}>
                <Ionicons name="images" size={28} color="#4dabf7" />
                <Text style={styles.modalOptionText}>Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, marginTop: Platform.OS === "android" ? 30 : 0 },
  scrollPadding: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  backBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.12)", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#fff" },
  headerSpacer: { width: 44 },
  glassCard: { backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 28, padding: 20 },
  label: { color: "#ffd6dd", fontSize: 12, fontWeight: "700", marginBottom: 8, textTransform: "uppercase" },
  input: { backgroundColor: "rgba(0,0,0,0.25)", color: "#fff", paddingHorizontal: 16, paddingVertical: 14, borderRadius: 14, fontSize: 15, marginBottom: 20 },
  textArea: { height: 100, textAlignVertical: "top" },
  categoryRow: { flexDirection: "row", gap: 6, marginBottom: 20 },
  categoryBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center", backgroundColor: "rgba(0,0,0,0.15)" },
  categoryActive: { backgroundColor: "#ff4d6d" },
  categoryText: { color: "rgba(255,255,255,0.6)", fontWeight: "600" },
  categoryTextActive: { color: "#fff" },
  mapContainer: { height: 140, borderRadius: 16, overflow: "hidden", marginBottom: 20 },
  map: { flex: 1 },
  uploadArea: { width: "100%", height: 180, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.2)", justifyContent: "center", alignItems: "center", overflow: "hidden", marginBottom: 24 },
  uploadPlaceholder: { justifyContent: "center", alignItems: "center" },
  uploadText: { color: "#fff", marginTop: 10, fontWeight: "700" },
  previewImage: { width: "100%", height: "100%" },
  submitBtn: { backgroundColor: "#ff4d6d", padding: 16, borderRadius: 16, alignItems: "center" },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  disabledBtn: { opacity: 0.5 },
  errorText: { color: "#ff758f", marginBottom: 16, textAlign: "center" },
  closeMapBtn: { position: "absolute", bottom: 40, left: 20, right: 20, backgroundColor: "#ff4d6d", padding: 16, borderRadius: 16, alignItems: "center" },
  closeMapText: { color: "#fff", fontWeight: "700" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#141423", padding: 20, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 36 },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 20 },
  modalOptions: { flexDirection: "row", justifyContent: "space-around" },
  modalOption: { alignItems: "center" },
  modalOptionText: { color: "#fff", marginTop: 8 },
});