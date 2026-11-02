import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import EventCard from '../components/EventCard';
import Button from '../components/Button';

export default function MyEventsScreen({ navigation }) {
  const { events, goingIds, hostedEvents, pastEvents, reviews } = useApp();
  const [tab, setTab] = useState('Upcoming');
  const going = events.filter((e) => goingIds.includes(e.id) && !e.past);
  const open = (id) => navigation.navigate('EventDetail', { id });

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>My Events</Text>
      <Text style={styles.sub}>Your plans, all in one place.</Text>

      <View style={styles.segment}>
        {['Upcoming', 'Past'].map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.segBtn, tab === t && styles.segOn]} accessibilityRole="button">
            <Text style={[styles.segText, tab === t && { color: '#fff' }]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'Upcoming' ? (
        <>
          <Text style={styles.section}>Going · {going.length}</Text>
          {going.map((e) => <EventCard key={e.id} event={e} onPress={() => open(e.id)} />)}
          {going.length === 0 && <Text style={styles.empty}>Nothing yet. Find an event in Explore.</Text>}

          <Text style={styles.section}>Hosting · {hostedEvents.length}</Text>
          {hostedEvents.map((e) => <EventCard key={e.id} event={e} onPress={() => open(e.id)} />)}
          {hostedEvents.length === 0 && <Text style={styles.empty}>You are not hosting any event.</Text>}
        </>
      ) : (
        <>
          <Text style={styles.section}>Past · {pastEvents.length}</Text>
          {pastEvents.map((e) => {
            const r = reviews[e.id];
            return (
              <EventCard
                key={e.id}
                event={e}
                onPress={() => open(e.id)}
                right={
                  <Pressable onPress={() => navigation.navigate('Review', { id: e.id })} style={[styles.reviewBtn, r && styles.reviewDone]} accessibilityRole="button">
                    <Text style={[styles.reviewText, r && { color: '#fff' }]}>{r ? `★ ${r.rating}` : 'Review'}</Text>
                  </Pressable>
                }
              />
            );
          })}
        </>
      )}

      <Button title="+  Create Event" onPress={() => navigation.navigate('CreateEvent')} style={{ marginTop: 16 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '800', color: colors.green },
  sub: { color: colors.muted, marginBottom: 14 },
  segment: { flexDirection: 'row', backgroundColor: colors.chip, borderRadius: 22, padding: 4, marginBottom: 6 },
  segBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 18 },
  segOn: { backgroundColor: colors.green },
  segText: { fontWeight: '600', color: colors.text },
  section: { fontWeight: '700', color: colors.text, marginTop: 16, marginBottom: 8 },
  empty: { color: colors.muted, marginBottom: 8 },
  reviewBtn: { borderWidth: 1.5, borderColor: colors.orange, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7 },
  reviewDone: { backgroundColor: colors.green, borderColor: colors.green },
  reviewText: { color: colors.orange, fontWeight: '700', fontSize: 13 },
});
