import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

import { colors, radii } from '../theme';
import { useApp } from '../context/AppContext';
import { EventCard, Stars, Button, ConfirmModal, AccessibilityBadge } from '../components';

const MAX_TEXT = 1000;

// Respostas à pergunta "as tags de acessibilidade estavam certas?"
const ACCURACY_OPTIONS = [
  { value: 'yes', label: 'Yes', icon: 'checkmark-circle-outline' },
  { value: 'partly', label: 'Partly', icon: 'remove-circle-outline' },
  { value: 'no', label: 'No', icon: 'close-circle-outline' },
];

// Escolhe uma foto e comprime-a até ficar com menos de 1 MB
async function pickPhoto() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert('Permission required', 'Please allow access to your photo library.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [16, 9],
    quality: 1,
  });

  if (result.canceled) return null;

  const asset = result.assets[0];

  for (const quality of [0.7, 0.55, 0.4]) {
    const manipulated = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 1100 } }],
      { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
    );

    const info = await FileSystem.getInfoAsync(manipulated.uri);

    // Na web o getInfoAsync não sabe o tamanho; aceita a primeira compressão
    if (!info.exists || info.size === undefined || info.size <= 1024 * 1024) {
      return manipulated;
    }
  }

  Alert.alert('Image too large', 'Could not compress this image below 1 MB. Please choose another one.');
  return null;
}

export default function ReviewScreen({ route, navigation }) {
  const { events, reviews, addReview, user } = useApp();
  const event = events.find((e) => e.id === route.params.id);

  const existing = useMemo(() => {
    const list = reviews?.[event?.id] || [];
    return list.find((review) => review.userId === user?.id) || null;
  }, [reviews, event?.id, user?.id]);

  // As estrelas começam vazias, para não influenciar a nota
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [accuracy, setAccuracy] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!event) {
    return (
      <View style={[styles.container, { padding: 16 }]}>
        <Text style={{ color: colors.muted }}>Event not found.</Text>
      </View>
    );
  }

  const accessibilityTags = event.accessibility || [];
  const askAccuracy = accessibilityTags.length > 0;

  const missing = [
    rating === 0 && 'a star rating',
    !text.trim() && 'a few words about the event',
    askAccuracy && !accuracy && 'whether the accessibility info was accurate',
  ].filter(Boolean);

  const canSubmit = missing.length === 0 && !submitting && !processingPhoto && !existing;

  const choosePhoto = async () => {
    try {
      setProcessingPhoto(true);
      const picked = await pickPhoto();
      if (picked) setPhoto(picked);
    } catch (error) {
      console.error('Error selecting review image:', error);
      Alert.alert('Error', 'Could not prepare the selected image.');
    } finally {
      setProcessingPhoto(false);
    }
  };

  const submit = async () => {
    try {
      setSubmitting(true);
      await addReview(event.id, {
        rating,
        content: text.trim(),
        imageUri: photo?.uri || null,
        accessibilityAccuracy: askAccuracy ? accuracy : null,
      });
      setDone(true);
    } catch (error) {
      Alert.alert('Could not publish your review', error.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <EventCard event={event} right={<View />} onPress={() => {}} />

      {existing ? (
        <View style={styles.notice}>
          <Ionicons name="checkmark-circle" size={20} color={colors.green} />
          <Text style={styles.noticeText}>
            You already reviewed this event (★ {existing.rating}).
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.label}>How was it?</Text>
          <Stars rating={rating} onChange={setRating} size={36} />
          <Text style={styles.hint}>
            {rating === 0 ? 'Tap a star to rate' : `${rating} out of 5`}
          </Text>

          <Text style={styles.label}>Your review</Text>
          <TextInput
            style={styles.input}
            multiline
            maxLength={MAX_TEXT}
            value={text}
            onChangeText={setText}
            placeholder="Tell others about the experience and the organization"
            placeholderTextColor={colors.muted}
          />
          <Text style={styles.counter}>{text.length}/{MAX_TEXT}</Text>

          {askAccuracy && (
            <>
              <Text style={styles.label}>Was the accessibility info accurate?</Text>
              <Text style={styles.sub}>The host said this event is:</Text>
              <View style={styles.tags}>
                {accessibilityTags.map((tag) => (
                  <AccessibilityBadge key={tag} label={tag} />
                ))}
              </View>

              <View style={styles.options}>
                {ACCURACY_OPTIONS.map((option) => {
                  const selected = accuracy === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setAccuracy(option.value)}
                      style={[styles.option, selected && styles.optionOn]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                    >
                      <Ionicons
                        name={option.icon}
                        size={18}
                        color={selected ? '#fff' : colors.green}
                      />
                      <Text style={[styles.optionText, selected && { color: '#fff' }]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          <Text style={styles.label}>Add a photo (optional)</Text>
          <Pressable
            style={styles.photoBox}
            onPress={choosePhoto}
            disabled={processingPhoto || submitting}
            accessibilityRole="button"
          >
            {photo ? (
              <Image source={{ uri: photo.uri }} style={styles.photo} resizeMode="cover" />
            ) : (
              <>
                <Ionicons name="camera-outline" size={26} color={colors.green} />
                <Text style={styles.photoText}>
                  {processingPhoto ? 'Preparing photo…' : 'Add a photo'}
                </Text>
                <Text style={styles.counter}>JPEG · Maximum 1 MB</Text>
              </>
            )}
          </Pressable>
          {photo && (
            <Pressable onPress={() => setPhoto(null)} style={styles.removePhoto}>
              <Text style={styles.removePhotoText}>Remove photo</Text>
            </Pressable>
          )}

          <Button
            title={submitting ? 'Publishing…' : 'Publish review'}
            disabled={!canSubmit}
            onPress={submit}
            style={{ marginTop: 24 }}
          />
          {missing.length > 0 && (
            <Text style={styles.hint}>Still missing: {missing.join(', ')}.</Text>
          )}
        </>
      )}

      <ConfirmModal
        visible={done}
        title="Thanks for your review!"
        message="It helps others find events that suit them."
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
  label: { fontWeight: '700', color: colors.text, fontSize: 16, marginTop: 20, marginBottom: 8 },
  sub: { color: colors.muted, fontSize: 13, marginBottom: 6 },
  hint: { color: colors.muted, fontSize: 12, marginTop: 6 },
  counter: { color: colors.muted, fontSize: 11, marginTop: 4, textAlign: 'right' },
  input: {
    backgroundColor: '#fff',
    borderRadius: radii.md,
    padding: 12,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  options: { flexDirection: 'row', gap: 8 },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.green,
    backgroundColor: '#fff',
  },
  optionOn: { backgroundColor: colors.green },
  optionText: { fontWeight: '700', color: colors.green },
  photoBox: {
    height: 140,
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photo: { width: '100%', height: '100%' },
  photoText: { fontWeight: '700', color: colors.green, marginTop: 4 },
  removePhoto: { alignSelf: 'flex-end', marginTop: 6 },
  removePhotoText: { color: colors.danger, fontWeight: '600', fontSize: 13 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F3EE',
    borderRadius: radii.md,
    padding: 14,
    marginTop: 12,
  },
  noticeText: { color: colors.green, fontWeight: '600', flex: 1 },
});
