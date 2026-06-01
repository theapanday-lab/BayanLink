import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type Coordinates = {
  latitude: number;
  longitude: number;
};

type Region = Coordinates & {
  latitudeDelta: number;
  longitudeDelta: number;
};

type ReportMapProps = {
  coords: Coordinates;
  region: Region;
  style: object;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  draggableMarker?: boolean;
  onRegionChangeComplete?: (region: Region) => void;
  onMarkerDragEnd?: (coords: Coordinates) => void;
};

export default function ReportMap({ coords, style }: ReportMapProps) {
  return (
    <View style={[style, styles.placeholder]}>
      <Ionicons name="location" size={28} color="#ff4d6d" />
      <Text style={styles.text}>Map preview unavailable on web</Text>
      <Text style={styles.coords}>
        {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 16,
  },
  text: {
    color: "#fff",
    fontWeight: "700",
    marginTop: 8,
  },
  coords: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    marginTop: 4,
  },
});
