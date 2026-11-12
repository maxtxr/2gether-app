import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { colors, radii } from '../../theme';

// Central Lisbon — fallback when there is nothing to show.
const FALLBACK = { latitude: 38.71, longitude: -9.13 };

const regionFor = (pins) => {
  if (!pins.length) return { ...FALLBACK, latitudeDelta: 0.5, longitudeDelta: 0.5 };
  const lats = pins.map((p) => p.lat);
  const lngs = pins.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.7, 0.08),
    longitudeDelta: Math.max((maxLng - minLng) * 1.7, 0.08),
  };
};

/**
 * Map of events with a tappable callout per pin.
 * Used by the Search screen's Map view (native only — see EventMap.web.js).
 */
export default function EventMap({ events = [], onEventPress }) {
  const pins = events.filter((e) => typeof e.lat === 'number' && typeof e.lng === 'number');
  const mapRef = useRef(null);
  const signature = pins.map((p) => p.id).join(',');

  // Refit whenever the filtered set of events changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (pins.length > 1) {
      map.fitToCoordinates(
        pins.map((p) => ({ latitude: p.lat, longitude: p.lng })),
        { edgePadding: { top: 48, right: 48, bottom: 48, left: 48 }, animated: true }
      );
    } else {
      map.animateToRegion(regionFor(pins), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return (
    <MapView ref={mapRef} style={StyleSheet.absoluteFill} initialRegion={regionFor(pins)}>
      {pins.map((e) => (
        <Marker
          key={e.id}
          coordinate={{ latitude: e.lat, longitude: e.lng }}
          title={e.title}
          description={`${e.place} · ${e.area}`}
          onCalloutPress={() => onEventPress?.(e.id)}
        >
          <Callout tooltip>
            <View style={styles.callout}>
              <Text style={styles.calloutTitle}>{e.title}</Text>
              <Text style={styles.calloutSub}>{e.place} · {e.area}</Text>
              <Text style={styles.calloutLink}>View details →</Text>
            </View>
          </Callout>
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  callout: {
    backgroundColor: '#fff',
    borderRadius: radii.md,
    padding: 10,
    maxWidth: 220,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calloutTitle: { fontWeight: '700', color: colors.text, fontSize: 14 },
  calloutSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  calloutLink: { color: colors.orange, fontWeight: '700', fontSize: 12, marginTop: 6 },
});
