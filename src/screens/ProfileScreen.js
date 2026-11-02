import { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { receivedReviews } from '../data/mock';
import { useApp } from '../context/AppContext';
import Avatar, { initials } from '../components/Avatar';
import Button from '../components/Button';
import Chip from '../components/Chip';
import Stars from '../components/Stars';

export default function ProfileScreen({ navigation }) {
  const { user, updateProfile, joinedCount, hostedEvents, pastEvents, badges } = useApp();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);

  const save = () => { updateProfile({ name: name.trim() || user.name, bio: bio.trim() }); setEditing(false); };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <View style={styles.top}>
        <View style={styles.bigAvatar}><Text style={styles.bigAvatarText}>{initials(user.name)}</Text></View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          {editing ? (
            <>
              <TextInput style={styles.edit} value={name} onChangeText={setName} />
              <TextInput style={styles.edit} value={bio} onChangeText={setBio} />
            </>
          ) : (
            <>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.bio}>{user.bio}</Text>
              <Text style={styles.since}>Member since {user.since}</Text>
            </>
          )}
        </View>
      </View>

      <Button title={editing ? 'Save' : 'Edit profile'} variant={editing ? 'primary' : 'outline'} icon={editing ? undefined : 'pencil-outline'}
        onPress={editing ? save : () => setEditing(true)} style={{ marginTop: 14 }} />

      {user.interests.length > 0 && (
        <>
          <Text style={styles.section}>Interests</Text>
          <View style={styles.wrap}>{user.interests.map((i) => <Chip key={i} label={i} />)}</View>
        </>
      )}

      <View style={styles.stats}>
        <Stat value={joinedCount} label="Joined" />
        <Stat value={hostedEvents.length} label="Hosted" />
        <Stat value="4.9" label="Rating" />
      </View>

      <Text style={styles.section}>Badges</Text>
      <View style={styles.badges}>
        {badges.map((b) => (
          <View key={b.id} style={[styles.badge, !b.earned && { opacity: 0.45 }]}>
            <Text style={{ fontSize: 26 }}>{b.earned ? b.icon : '🔒'}</Text>
            <Text style={styles.badgeName}>{b.name}</Text>
            <Text style={styles.badgeHint}>{b.earned ? 'Unlocked' : b.hint}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.section}>Attended events</Text>
      {pastEvents.map((e) => (
        <Pressable key={e.id} style={styles.attended} onPress={() => navigation.navigate('EventDetail', { id: e.id })}>
          <Ionicons name="checkmark-circle" size={18} color={colors.green} />
          <Text style={styles.attendedText}>{e.title} · {e.area}</Text>
        </Pressable>
      ))}

      <View style={styles.revHeader}>
        <Text style={styles.section}>Reviews</Text>
        <Text style={styles.count}>{receivedReviews.length} reviews</Text>
      </View>
      {receivedReviews.map((r) => (
        <View key={r.id} style={styles.review}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '700', color: colors.text }}>{r.author}</Text>
            <Stars rating={r.rating} size={14} />
          </View>
          <Text style={{ color: colors.text, marginTop: 4 }}>{r.text}</Text>
        </View>
      ))}

      <Pressable style={styles.settings} onPress={() => navigation.navigate('Settings')} accessibilityRole="button">
        <Ionicons name="settings-outline" size={20} color={colors.text} />
        <Text style={styles.settingsText}>Settings</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </Pressable>
    </ScrollView>
  );
}

function Stat({ value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center' },
  bigAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#D6E4DB', alignItems: 'center', justifyContent: 'center' },
  bigAvatarText: { fontSize: 24, fontWeight: '700', color: colors.green },
  name: { fontSize: 20, fontWeight: '800', color: colors.text },
  bio: { color: colors.muted, marginTop: 2 },
  since: { color: colors.muted, fontSize: 12, marginTop: 4 },
  edit: { backgroundColor: '#fff', borderRadius: 10, padding: 8, marginBottom: 6, borderWidth: 1, borderColor: colors.border },
  section: { fontWeight: '700', fontSize: 16, color: colors.text, marginTop: 20, marginBottom: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  stats: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginTop: 14 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.green },
  statLabel: { color: colors.muted, fontSize: 13 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  badge: { width: '31%', margin: '1%', backgroundColor: '#fff', borderRadius: 12, padding: 10, alignItems: 'center' },
  badgeName: { fontWeight: '700', fontSize: 12, color: colors.text, marginTop: 4, textAlign: 'center' },
  badgeHint: { fontSize: 11, color: colors.muted, textAlign: 'center' },
  attended: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8 },
  attendedText: { marginLeft: 8, color: colors.text },
  revHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  count: { color: colors.muted, fontSize: 13 },
  review: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8 },
  settings: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginTop: 20, marginBottom: 20 },
  settingsText: { flex: 1, marginLeft: 10, fontWeight: '600', color: colors.text },
});
