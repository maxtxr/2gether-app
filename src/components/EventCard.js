import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';

export default function EventCard({ event, onPress, right }) {
  const { goingIds, hostedIds } = useApp();
  const going = goingIds.includes(event.id);
  const hosting = hostedIds.includes(event.id);

  let badge = right;
  if (!badge) {
    badge = going || hosting ? (
      <View style={styles.pill}><Text style={styles.pillText}>{hosting ? 'Hosting' : 'Going'}</Text></View>
    ) : (
      <View style={styles.plus}><Ionicons name="add" size={24} color="#fff" /></View>
    );
  }

  return (
    <Pressable onPress={onPress} style={styles.card} accessibilityRole="button">
      <View style={styles.avatar}><Ionicons name="people-outline" size={24} color={colors.muted} /></View>
      <View style={styles.divider} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{event.title}</Text>
        <View style={styles.row}><Ionicons name="calendar-outline" size={14} color={colors.muted} /><Text style={styles.meta}>{event.short}</Text></View>
        <View style={styles.row}><Ionicons name="location-outline" size={14} color={colors.muted} /><Text style={styles.meta}>{event.area} · {event.level}</Text></View>
      </View>
      {badge}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, padding: 12, marginBottom: 10 },
  avatar: { width: 48, height: 48, borderRadius: 10, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  divider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border, marginHorizontal: 12 },
  title: { fontWeight: '700', color: colors.text, fontSize: 15, marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  meta: { color: colors.muted, fontSize: 13, marginLeft: 6 },
  plus: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center' },
  pill: { backgroundColor: colors.green, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  pillText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
