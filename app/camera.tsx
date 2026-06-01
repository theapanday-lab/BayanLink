import { Feather } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ReportState } from "../lib/ReportState";

export default function CameraScreen() {
  const router = useRouter();  
  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"back" | "front">("back");

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const capturePhoto = async () => {
    if (cameraRef.current) {
      try {
        const options = { quality: 0.5, skipProcessing: false };
        const photo = await cameraRef.current.takePictureAsync(options);
        
        if (photo?.uri) {
          // ✅ COMMIT TO GLOBAL STORAGE HOLDER
          ReportState.capturedImageUri = photo.uri;
          
          // Pop camera view off stack smoothly
          router.back();
        }
      } catch (error) {
        console.log("Error taking picture: ", error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Feather name="x" size={28} color="white" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton} onPress={capturePhoto}>
            <View style={styles.innerCaptureCircle} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
            <Feather name="refresh-cw" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  buttonContainer: {
    flex: 1,
    backgroundColor: "transparent",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    margin: 30,
    marginBottom: 40,
  },
  text: { fontSize: 16, color: "#fff", textAlign: "center", marginBottom: 20 },
  closeButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", bottom: 20 },
 captureButton: { 
    width: 84, 
    height: 84, 
    borderRadius: 42, 
    borderWidth: 4, 
    borderColor: "#fff", 
    justifyContent: "center", 
    alignItems: "center", 
    bottom: 20 // ⚡ Changed from -20 to 20 to lift it up gracefully
  },
  innerCaptureCircle: { 
    width: 68, 
    height: 68, 
    borderRadius: 34, 
    backgroundColor: "#ff4d6d" 
  },
  flipButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", bottom: 20 },
});