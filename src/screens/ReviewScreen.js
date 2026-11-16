import { useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import { EventCard, Stars, Button, ConfirmModal } from '../components';

export default function ReviewScreen({ route, navigation }) {
  const { events, reviews, addReview, user } = useApp();
  const event = events.find((e) => e.id === route.params.id);

  const existing = useMemo(() => {
    const list = reviews?.[event?.id] || [];
    return list.find((review) => review.userId === user?.id) || null;
  }, [reviews, event?.id, user?.id]);

  const [rating, setRating] = useState(existing?.rating || 0);
  const [text, setText] = useState(existing?.content || '');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!event) {
    return (
      <View style={[styles.container, { padding: 16 }]}>
        <Text style={{ color: colors.muted }}>Event not found.</Text>
      </View>
    );
  }

  const submit = async () => {
    try {
      setSubmitting(true);
      await addReview(event.id, {
        rating,
        content: text.trim(),
        imageUri: null,
      });
      setDone(true);
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not publish review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <EventCard event={event} right={<View />} onPress={() => {}} />

      <Text style={styles.label}>How was it?</Text>
      <Stars rating={rating} onChange={setRating} />

      <Text style={styles.label}>Your review</Text>
      <TextInput
        style={styles.input}
        multiline
        value={text}
        onChangeText={setText}
        placeholder="Tell others about the experience and the organization"
        placeholderTextColor={colors.muted}
      />

      <Button
        title={submitting ? 'Submitting…' : 'Review'}
        disabled={rating === 0 || submitting || !!existing}
        onPress={submit}
        style={{ marginTop: 20 }}
      />
      {existing && (
        <Text style={styles.hint}>You already reviewed this event.</Text>
      )}
      {rating === 0 && !existing && (
        <Text style={styles.hint}>Pick a star rating to submit.</Text>
      )}

      <ConfirmModal
        visible={done}
        message="Thanks for your review!"
        onConfirm={() => {
          setDone(false);
          navigation.goBack();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  label: { fontWeight: '700', color: colors.text, marginTop: 18, marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 12,
    minHeight: 130,
    textAlignVertical: 'top',
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hint: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 8 },
});
