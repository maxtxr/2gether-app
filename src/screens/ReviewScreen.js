import { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import { EventCard, Stars, Button, ConfirmModal } from '../components';

export default function ReviewScreen({ route, navigation }) {
  const { events, reviews, addReview } = useApp();
  const event = events.find((e) => e.id === route.params.id);
  const existing = reviews[event.id];
  const [rating, setRating] = useState(existing?.rating || 0);
  const [text, setText] = useState(existing?.text || '');
  const [done, setDone] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <EventCard event={event} right={<View />} onPress={() => {}} />

      <Text style={styles.label}>How was it?</Text>
      <Stars rating={rating} onChange={setRating} />

      <Text style={styles.label}>Your review</Text>
      <TextInput
        style={styles.input} multiline value={text} onChangeText={setText}
        placeholder="Tell others about the experience and the organization" placeholderTextColor={colors.muted}
      />

      <Button title="Review" disabled={rating === 0} onPress={() => { addReview(event.id, rating, text.trim()); setDone(true); }} style={{ marginTop: 20 }} />
      {rating === 0 && <Text style={styles.hint}>Pick a star rating to submit.</Text>}

      <ConfirmModal visible={done} message="Thanks for your review!" onConfirm={() => { setDone(false); navigation.goBack(); }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  label: { fontWeight: '700', color: colors.text, marginTop: 18, marginBottom: 8 },
  input: { backgroundColor: '#fff', borderRadius: 30, padding: 12, minHeight: 130, textAlignVertical: 'top', fontSize: 15, borderWidth: 1, borderColor: colors.border },
  hint: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 8 },
});
