import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

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

export default function ReportMap({
  coords,
  region,
  style,
  scrollEnabled,
  zoomEnabled,
  draggableMarker,
  onRegionChangeComplete,
  onMarkerDragEnd,
}: ReportMapProps) {
  const interactive = scrollEnabled || zoomEnabled || draggableMarker;

  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={style}
      region={interactive ? undefined : region}
      initialRegion={interactive ? region : undefined}
      scrollEnabled={scrollEnabled}
      zoomEnabled={zoomEnabled}
      onRegionChangeComplete={onRegionChangeComplete}
    >
      <Marker
        coordinate={coords}
        draggable={draggableMarker}
        onDragEnd={(event) => onMarkerDragEnd?.(event.nativeEvent.coordinate)}
        pinColor="#ff4d6d"
      />
    </MapView>
  );
}
