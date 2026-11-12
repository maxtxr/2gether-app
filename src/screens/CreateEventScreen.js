import { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { colors, radii } from '../theme';
import { CATEGORIES, LEVELS, ACCESSIBILITY } from '../data/options';
import { useApp } from '../context/AppContext';
import { Chip, Button, ConfirmModal } from '../components';

export default function CreateEventScreen({ navigation }) {
  const { createEvent } = useApp();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Outdoors');
  const [level, setLevel] = useState('Beginner');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');
  const [capacity, setCapacity] = useState('10');
  const [access, setAccess] = useState([]);
  const [done, setDone] = useState(false);

  const toggleAccess = (a) => setAccess((p) => (p.includes(a) ? p.filter((x) => x !== a) : [...p, a]));
  const ready = title.trim() && place.trim() && date.trim() && time.trim();

  const submit = () => {
    createEvent({
      title: title.trim(), category, sport: category, level, description: description.trim(),
      when: `${date.trim()}, ${time.trim()}`, place: place.trim(),
      capacity: parseInt(capacity, 10) || 10, accessibility: access,
    });
    setDone(true);
  };

  const field = (label, value, set, props = {}) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={set} placeholderTextColor={colors.muted} {...props} />
    </>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      {field('Event name', title, setTitle, { placeholder: 'Walk at the park' })}

      <Text style={styles.label}>Category</Text>
      <View style={styles.wrap}>{CATEGORIES.map((c) => <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />)}</View>

      <Text style={styles.label}>Level</Text>
      <View style={styles.wrap}>{LEVELS.map((l) => <Chip key={l} label={l} selected={level === l} onPress={() => setLevel(l)} />)}</View>

      <Text style={styles.label}>Accessibility</Text>
      <View style={styles.wrap}>{ACCESSIBILITY.map((a) => <Chip key={a} label={a} selected={access.includes(a)} onPress={() => toggleAccess(a)} />)}</View>

      {field('Description', description, setDescription, { placeholder: 'Pace, what to bring, who it is for', multiline: true, style: [styles.input, { height: 90, textAlignVertical: 'top', borderRadius: 30 }] })}

      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1, marginRight: 8 }}>{field('Date', date, setDate, { placeholder: 'Tue 8 Nov' })}</View>
        <View style={{ flex: 1, marginLeft: 8 }}>{field('Time', time, setTime, { placeholder: '09:00' })}</View>
      </View>

      {field('Location', place, setPlace, { placeholder: 'Add a place or address' })}
      {field('Participant capacity', capacity, setCapacity, { keyboardType: 'number-pad', placeholder: '50' })}

      <Button title="Create Event" disabled={!ready} onPress={submit} style={{ marginTop: 24 }} />
      {!ready && <Text style={styles.hint}>Add a name, date, time and location before publishing.</Text>}

      <ConfirmModal
        visible={done}
        message="Your event is now listed under Hosting in My events."
        onConfirm={() => { setDone(false); navigation.goBack(); }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  label: { fontWeight: '700', color: colors.text, marginTop: 14, marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: radii.pill, padding: 12, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: colors.border },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  hint: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 8 },
});
