import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, levelColors } from '../theme';
import { useApp } from '../context/AppContext';
import Avatar, { initials } from '../components/Avatar';
import Button from '../components/Button';
import ConfirmModal from '../components/ConfirmModal';

export default function EventDetailScreen({ route, navigation }) {
  const { events, goingIds, hostedIds, countOf, spotsLeft, joinEvent, leaveEvent } = useApp();
  const event = events.find((e) => e.id === route.params.id);
  const [modal, setModal] = useState(null);

  if (!event) return <Text style={{ padding: 16 }}>Event not found.</Text>;

  const going = goingIds.includes(event.id);
  const hosting = hostedIds.includes(event.id);
  const count = countOf(event);
  const left = spotsLeft(event);
  const full = left <= 0 && !going;

  const shown = event.people.slice(0, 3);
  if (going) shown.unshift('ME');

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.banner}>
        <Ionicons name="people" size={36} color={colors.green} />
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text style={styles.bannerTitle}>{event.sport}</Text>
          <Text style={styles.bannerSub}>{event.category} · {event.level}</Text>
        </View>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title}>{event.title}</Text>
        <View style={styles.status}><Text style={styles.statusText}>{event.past ? 'Past' : 'Upcoming'}</Text></View>
      </View>

      <View style={styles.hostRow}>
        <Avatar label={initials(event.host)} dark />
        <Text style={styles.host}>Hosted by {event.host}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={18} color={colors.muted} />
        <Text style={styles.infoBold}>{event.when}</Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="location-outline" size={18} color={colors.muted} />
        <View>
          <Text style={styles.infoBold}>{event.place}</Text>
          {event.address ? <Text style={styles.infoSub}>{event.address}</Text> : null}
        </View>
      </View>

      <View style={[styles.levelPill, { backgroundColor: levelColors[event.level] }]}>
        <Text style={styles.levelText}>{event.level}</Text>
      </View>

      {event.description ? <Text style={styles.desc}>{event.description}</Text> : null}

      {event.accessibility.length > 0 && (
        <View style={styles.access}>
          <Ionicons name="accessibility" size={18} color={colors.green} />
          <Text style={styles.accessText}>{event.accessibility.join(' · ')}</Text>
        </View>
      )}

      <View style={styles.partHeader}>
        <Text style={styles.partTitle}>{count} participants</Text>
        <Text style={styles.partSub}>{left > 0 ? `${left} spots left` : 'Full'} · {event.capacity} max</Text>
      </View>
      <View style={styles.avatars}>
        {shown.map((p, i) => <Avatar key={i} label={p} />)}
        {count > shown.length && <Avatar label={`+${count - shown.length}`} />}
      </View>

      {!event.past && !hosting && (
        <>
          {going ? (
            <Button title="Cancel participation" variant="danger" onPress={() => { leaveEvent(event.id); setModal('You are no longer going to this event.'); }} style={{ marginTop: 20 }} />
          ) : (
            <Button title={full ? 'Event is full' : 'Join'} disabled={full} onPress={() => { joinEvent(event.id); setModal(`You're going to ${event.title}!`); }} style={{ marginTop: 20 }} />
          )}
        </>
      )}

      <Button title="Message organizer" variant="outline" icon="chatbubble-outline"
        onPress={() => navigation.navigate('Chat', { id: event.id })} style={{ marginTop: 10 }} />
      {!going && !hosting && !event.past && <Text style={styles.hint}>You can message the organizer before joining.</Text>}

      <ConfirmModal visible={!!modal} message={modal} onConfirm={() => setModal(null)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  banner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCE5DD', borderRadius: 14, padding: 18, marginBottom: 16 },
  bannerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  bannerSub: { color: colors.muted },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, flex: 1 },
  status: { backgroundColor: '#D6E4DB', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { color: colors.green, fontWeight: '700', fontSize: 12 },
  hostRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  host: { color: colors.text, marginLeft: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 },
  infoBold: { fontWeight: '700', color: colors.text, marginLeft: 10 },
  infoSub: { color: colors.muted, marginLeft: 10, fontSize: 13 },
  levelPill: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4, marginTop: 14 },
  levelText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  desc: { color: colors.text, lineHeight: 22, marginTop: 14 },
  access: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  accessText: { color: colors.green, marginLeft: 8, flex: 1 },
  partHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 8 },
  partTitle: { fontWeight: '700', color: colors.text },
  partSub: { color: colors.muted, fontSize: 13 },
  avatars: { flexDirection: 'row' },
  hint: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 8 },
});
