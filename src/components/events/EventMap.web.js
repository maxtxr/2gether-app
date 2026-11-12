import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

/**
 * Web fallback for the map view — react-native-maps needs native code,
 * so browsers get an explanatory placeholder instead.
 */
export default function EventMap({ events = [] }) {
  return (
    <View style={styles.box}>
      <Ionicons name="map-outline" size={44} color={colors.green} />
      <Text style={styles.title}>Map view</Text>
      <Text style={styles.sub}>
        Maps are available in the Expo Go app on your phone.{'\n'}
        {events.length} {events.length === 1 ? 'event matches' : 'events match'} your filters.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontWeight: '800', color: colors.text, fontSize: 17, marginTop: 10 },
  sub: { color: colors.muted, textAlign: 'center', marginTop: 6, fontSize: 13, lineHeight: 19 },
});
