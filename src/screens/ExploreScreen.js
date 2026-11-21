import { useState, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../theme';
import { CATEGORIES, LEVELS, ACCESSIBILITY } from '../data/options';
import { useApp, eventHasEnded } from '../context/AppContext';
import { Chip, EventCard } from '../components';
import EventMap from '../components/events/EventMap';

const toggle = (cur, v) => (cur === v ? null : v);

export default function ExploreScreen({ navigation }) {
  const { events } = useApp();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [level, setLevel] = useState(null);
  const [access, setAccess] = useState(null);
  const [view, setView] = useState('list');

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return events.filter(
      (e) =>
        !eventHasEnded(e) &&
        (cat === 'All' || e.category === cat) &&
        (!level || e.level === level || e.level === 'All levels') &&
        (!access || (e.accessibility || []).includes(access)) &&
        (!term || `${e.title} ${e.area} ${e.place} ${e.sport}`.toLowerCase().includes(term))
    );
  }, [events, q, cat, level, access]);

  const activeFilters = (level ? 1 : 0) + (access ? 1 : 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput style={styles.searchInput} value={q} onChangeText={setQ} placeholder="Search events or places" placeholderTextColor={colors.muted} />
      </View>

      <View style={styles.chips}>
        {['All', ...CATEGORIES].map((c) => <Chip key={c} label={c} selected={cat === c} onPress={() => setCat(c)} />)}
        <Chip label={activeFilters ? `Filters (${activeFilters})` : 'Filters'} selected={showFilters} onPress={() => setShowFilters(!showFilters)} />
      </View>

      {showFilters && (
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>Level</Text>
          <View style={styles.chips}>
            {LEVELS.filter((l) => l !== 'All levels').map((l) => <Chip key={l} label={l} selected={level === l} onPress={() => setLevel(toggle(level, l))} />)}
          </View>
          <Text style={styles.panelLabel}>Accessibility</Text>
          <View style={styles.chips}>
            {ACCESSIBILITY.map((a) => <Chip key={a} label={a} selected={access === a} onPress={() => setAccess(toggle(access, a))} />)}
          </View>
        </View>
      )}

      <View style={styles.segment}>
        {[['list', 'List'], ['map', 'Map']].map(([v, label]) => (
          <Pressable
            key={v}
            onPress={() => setView(v)}
            style={[styles.segBtn, view === v && styles.segOn]}
            accessibilityRole="button"
          >
            <Text style={[styles.segText, view === v && styles.segTextOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.headerRow}>
        <Text style={styles.heading}>Events near you</Text>
        <Text style={styles.count}>{list.length} {list.length === 1 ? 'event' : 'events'}</Text>
      </View>

      {view === 'map' ? (
        <View style={styles.mapWrap}>
          <EventMap events={list} onEventPress={(id) => navigation.navigate('EventDetail', { id })} />
          {list.length === 0 && (
            <View style={styles.mapEmpty}>
              <Text style={styles.empty}>No events match. Try clearing a filter.</Text>
            </View>
          )}
        </View>
      ) : (
        <>
          {list.map((e) => <EventCard key={e.id} event={e} onPress={() => navigation.navigate('EventDetail', { id: e.id })} />)}
          {list.length === 0 && <Text style={styles.empty}>No events match. Try clearing a filter.</Text>}
        </>
      )}

      <Pressable style={styles.area} onPress={() => Alert.alert('Change area', 'Coming soon.')}>
        <Ionicons name="location-outline" size={14} color={colors.muted} />
        <Text style={styles.areaText}> Within 5 km · Change area</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  search: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: radii.pill, paddingHorizontal: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, paddingVertical: 12, marginLeft: 8, fontSize: 15, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  panel: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 8 },
  panelLabel: { fontWeight: '700', color: colors.text, marginBottom: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8, marginBottom: 10 },
  heading: { fontSize: 17, fontWeight: '700', color: colors.text },
  count: { color: colors.muted, fontSize: 13 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 16 },
  area: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginTop: 6, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill },
  segment: { flexDirection: 'row', backgroundColor: colors.chip, borderRadius: radii.pill, padding: 4, marginBottom: 4 },
  segBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: radii.pill },
  segOn: { backgroundColor: colors.green },
  segText: { fontWeight: '600', color: colors.text, fontSize: 13 },
  segTextOn: { color: '#fff' },
  mapWrap: { height: 460, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.chip, marginBottom: 12 },
  mapEmpty: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(248, 249, 250, 0.88)' },
  areaText: { color: colors.muted, fontSize: 13 },
});
