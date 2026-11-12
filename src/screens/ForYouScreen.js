import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../theme';
import { useApp } from '../context/AppContext';
import { Chip, EventCard } from '../components';

/**
 * "For you" tab — a personalized feed of upcoming events.
 * Events matching the user's interests are surfaced first.
 */
export default function ForYouScreen({ navigation }) {
  const { user, events } = useApp();
  const interests = user.interests || [];
  const firstName = (user.name || '').trim().split(/\s+/)[0];

  const upcoming = events.filter((e) => !e.past);
  const matchesInterests = (e) =>
    interests.some(
      (i) => e.sport === i || e.category === i || (e.title || '').toLowerCase().includes(i.toLowerCase())
    );

  const picked = upcoming.filter(matchesInterests);
  const rest = upcoming.filter((e) => !matchesInterests(e));

  const open = (id) => navigation.navigate('EventDetail', { id });

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="sparkles" size={20} color="#fff" />
        </View>
        <Text style={styles.hi}>Hi {firstName} 👋</Text>
        <Text style={styles.sub}>
          {interests.length
            ? 'Events picked for the things you like.'
            : 'Fresh events near you, check them out.'}
        </Text>
        {interests.length > 0 && (
          <View style={styles.chips}>
            {interests.map((i) => <Chip key={i} label={i} />)}
          </View>
        )}
      </View>

      {picked.length > 0 && (
        <>
          <Text style={styles.section}>Picked for you</Text>
          {picked.map((e) => <EventCard key={e.id} event={e} onPress={() => open(e.id)} />)}
        </>
      )}

      {rest.length > 0 && (
        <>
          <Text style={styles.section}>{picked.length ? 'More events near you' : 'Recommended for you'}</Text>
          {rest.map((e) => <EventCard key={e.id} event={e} onPress={() => open(e.id)} />)}
        </>
      )}

      {upcoming.length === 0 && <Text style={styles.empty}>No upcoming events right now.</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  hero: { backgroundColor: colors.green, borderRadius: radii.lg, padding: 18, marginBottom: 4 },
  heroIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.orange, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  hi: { color: '#fff', fontSize: 22, fontWeight: '800' },
  sub: { color: '#B9CFC5', marginTop: 4, fontSize: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  section: { fontWeight: '700', color: colors.text, marginTop: 18, marginBottom: 8 },
  empty: { color: colors.muted, marginTop: 20, textAlign: 'center' },
});
