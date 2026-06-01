import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type EvacuationLocation = {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
};

type NearestLocation = EvacuationLocation & {
  distance: string;
};

const evacuationData: EvacuationLocation[] = [
  {
    id: "1",
    name: "Digos City Hall Grounds",
    type: "Government Evacuation Site",
    lat: 6.7499,
    lng: 125.3572,
  },
  {
    id: "2",
    name: "Digos City National High School Gym",
    type: "Covered Gym Shelter",
    lat: 6.7521,
    lng: 125.3559,
  },
  {
    id: "3",
    name: "Public Plaza Evacuation Area",
    type: "Open Safe Zone",
    lat: 6.7485,
    lng: 125.3588,
  },
];

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export default function EvacuationScreen() {
  const [nearest, setNearest] = useState<NearestLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission denied", "Location access is required.");
          setLoading(false);
          return;
        }
        const currentPosition = await Location.getCurrentPositionAsync({});
        findNearest(currentPosition.coords);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };
    void loadLocation();
  }, []);

  const findNearest = (coords: { latitude: number; longitude: number }) => {
    let closest: NearestLocation | null = null;
    let minDistance = Infinity;

    evacuationData.forEach((item) => {
      const distance = getDistance(coords.latitude, coords.longitude, item.lat, item.lng);
      if (distance < minDistance) {
        minDistance = distance;
        closest = { ...item, distance: distance.toFixed(2) };
      }
    });
    setNearest(closest);
  };

  const openMap = (item: EvacuationLocation | NearestLocation) => {
    const url = Platform.select({
      ios: `maps:0,0?q=${item.name}@${item.lat},${item.lng}`,
      android: `geo:0,0?q=${item.lat},${item.lng}(${item.name})`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <LinearGradient colors={["#ff4d6d", "#800f2f", "#0f0f1a"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          
          <View style={styles.header}>
            <Text style={styles.welcome}>Safe Zones</Text>
            <Text style={styles.title}>Evacuation</Text>
            <View style={styles.titleBar} />
          </View>

          <View style={styles.statusBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.statusText}>Live location tracking enabled</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#fff" style={styles.loader} />
          ) : (
            <FlatList
              data={evacuationData}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListHeaderComponent={
                nearest && (
                  <LinearGradient colors={["#ff4d6d", "#c9184a"]} style={styles.nearestCard}>
                    <View style={styles.row}>
                      <View style={styles.flexOne}>
                        <Text style={styles.nearestTag}>RECOMMENDED SAFE ROUTE</Text>
                        <Text style={styles.nearestName}>{nearest.name}</Text>
                        <View style={styles.distancePill}>
                          <Ionicons name="flash" size={14} color="#fff" />
                          <Text style={styles.nearestDistance}>{nearest.distance} km away</Text>
                        </View>
                      </View>
                      <TouchableOpacity style={styles.fabBtn} onPress={() => openMap(nearest)}>
                        <Ionicons name="navigate" size={24} color="#ff4d6d" />
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                )
              }
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.card} onPress={() => openMap(item)}>
                  <View style={styles.cardLeft}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="business" size={20} color="#ff4d6d" />
                    </View>
                    <View style={styles.flexOne}>
                      <Text style={styles.cardTitle}>{item.name}</Text>
                      <Text style={styles.cardSubtitle}>{item.type}</Text>
                    </View>
                  </View>
                  <Text style={styles.mapText}>OPEN →</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
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
  content: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginBottom: 20,
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
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ade80",
    marginRight: 8,
  },
  statusText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
  },
  loader: {
    marginTop: 50,
  },
  listContent: {
    paddingBottom: 30,
  },
  flexOne: {
    flex: 1,
  },
  nearestCard: {
    padding: 24,
    borderRadius: 28,
    marginBottom: 25,
    elevation: 10,
    shadowColor: "#ff4d6d",
    shadowOpacity: 0.4,
    shadowRadius: 15,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  nearestTag: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 4,
  },
  nearestName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 8,
  },
  distancePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  nearestDistance: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 4,
  },
  fabBtn: {
    width: 56,
    height: 56,
    backgroundColor: "#fff",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    padding: 16,
    borderRadius: 24,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  cardTitle: {
    fontWeight: "800",
    fontSize: 15,
    color: "#fff",
  },
  cardSubtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },
  mapText: {
    color: "#c9184a",
    fontWeight: "800",
    fontSize: 12,
  },
});