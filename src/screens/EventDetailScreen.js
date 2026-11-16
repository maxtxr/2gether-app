
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

import { colors, levelColors } from '../theme';
import { useApp } from '../context/AppContext';
import {
  Avatar,
  initials,
  Button,
  ConfirmModal,
  AccessibilityBadge,
} from '../components';

import { supabase } from '../../lib/supabase';

export default function EventDetailScreen({ route, navigation }) {
  const {
    events,
    goingIds,
    hostedIds,
    user,
    reviews,
    countOf,
    spotsLeft,
    joinEvent,
    leaveEvent,
    addReview,
    getOrCreateConversation,
  } = useApp();

  const event = events.find((e) => e.id === route.params.id);

  const [modal, setModal] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);
  const [isUpdatingWaitlist, setIsUpdatingWaitlist] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadWaitlistStatus = async () => {
      if (!user || !event) {
        setIsOnWaitlist(false);
        return;
      }

      const { data, error } = await supabase
        .from('event_waitlist')
        .select('id')
        .eq('event_id', event.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading waitlist:', error.message);
        return;
      }

      if (mounted) {
        setIsOnWaitlist(!!data);
      }
    };

    loadWaitlistStatus();

    return () => {
      mounted = false;
    };
  }, [event?.id, user?.id]);

  if (!event) {
    return <Text style={{ padding: 16 }}>Event not found.</Text>;
  }

  const going = goingIds.includes(event.id);
  const hosting = event.host_id === user?.id;
  const count = countOf(event);
  const left = spotsLeft(event);
  const full = left <= 0 && !going;

  // Verificar se o evento já terminou
  const dateMatch = (event.when || '').match(
    /^(\d{2})\/(\d{2})\/(\d{4}),\s*(\d{2}):(\d{2})$/
  );

  const eventDate = dateMatch
    ? new Date(
        Number(dateMatch[3]),
        Number(dateMatch[2]) - 1,
        Number(dateMatch[1]),
        Number(dateMatch[4]),
        Number(dateMatch[5])
      )
    : null;

  const eventEnded = eventDate
    ? eventDate < new Date()
    : !!event.past;

  console.log('EVENT WHEN:', event.when);
  console.log('EVENT DATE:', eventDate);
  console.log('EVENT ENDED:', eventEnded);
  console.log('HOSTING:', hosting);
  console.log('GOING:', going);
  console.log('CURRENT USER ID:', user?.id);
  console.log('EVENT HOST ID:', event.host_id);
  console.log('HOSTED IDS:', hostedIds);

  const eventReviews = reviews[event.id] || [];

  const myReview = eventReviews.find(
    (review) => review.userId === user?.id
  );

  const shown = (event.people || []).slice(0, 3);

  if (going) shown.unshift('ME');

  // Entrar ou sair da lista de espera
  const toggleWaitlist = async () => {
    if (!user) {
      setModal('You must be logged in to join the waitlist.');
      return;
    }

    try {
      setIsUpdatingWaitlist(true);

      if (isOnWaitlist) {
        const { error } = await supabase
          .from('event_waitlist')
          .delete()
          .eq('event_id', event.id)
          .eq('user_id', user.id);

        if (error) throw error;

        setIsOnWaitlist(false);
        setModal('You have left the waitlist.');
      } else {
        const { error } = await supabase
          .from('event_waitlist')
          .insert({
            event_id: event.id,
            user_id: user.id,
          });

        if (error) throw error;

        setIsOnWaitlist(true);
        setModal('You have joined the waitlist!');
      }
    } catch (error) {
      console.error('Waitlist error:', error);
      setModal(error.message || 'Could not update the waitlist.');
    } finally {
      setIsUpdatingWaitlist(false);
    }
  };

  // Escolher e preparar fotografia
  const pickReviewImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permission required',
          'Please allow access to your photo library.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 1,
      });

      if (result.canceled) return;

      setIsProcessingImage(true);

      const asset = result.assets[0];

      const qualities = [0.7, 0.55, 0.4];

      for (const quality of qualities) {
        const manipulated = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1100 } }],
          {
            compress: quality,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );

        const info = await FileSystem.getInfoAsync(manipulated.uri);

        if (info.exists && info.size <= 1024 * 1024) {
          setSelectedImage(manipulated);
          setIsProcessingImage(false);
          return;
        }
      }

      Alert.alert(
        'Image too large',
        'Could not compress this image below 1 MB. Please choose another one.'
      );

    } catch (error) {
      console.error('Error selecting review image:', error);
      Alert.alert('Error', 'Could not prepare the selected image.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Publicar review
  const submitReview = async () => {
    if (!reviewText.trim()) {
      Alert.alert('Missing review', 'Please write something about the event.');
      return;
    }

    try {
      setIsSubmittingReview(true);

      await addReview(event.id, {
        content: reviewText,
        rating,
        imageUri: selectedImage?.uri || null,
      });

      setReviewText('');
      setRating(5);
      setSelectedImage(null);

      Alert.alert('Review published', 'Your review has been published!');

    } catch (error) {
      console.error('Error publishing review:', error);

      Alert.alert(
        'Could not publish review',
        error.message || 'Something went wrong.'
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
    >
      <View style={styles.banner}>
        <Ionicons name="people" size={36} color={colors.green} />

        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text style={styles.bannerTitle}>{event.sport}</Text>
          <Text style={styles.bannerSub}>
            {event.category} · {event.level}
          </Text>
        </View>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title}>{event.title}</Text>

        <View style={styles.status}>
          <Text style={styles.statusText}>
            {eventEnded ? 'Past' : 'Upcoming'}
          </Text>
        </View>
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
          {event.address ? (
            <Text style={styles.infoSub}>{event.address}</Text>
          ) : null}
        </View>
      </View>

      <View
        style={[
          styles.levelPill,
          { backgroundColor: levelColors[event.level] },
        ]}
      >
        <Text style={styles.levelText}>{event.level}</Text>
      </View>

      {event.description ? (
        <Text style={styles.desc}>{event.description}</Text>
      ) : null}

      {event.accessibility?.length > 0 && (
        <View style={styles.access}>
          {event.accessibility.map((a) => (
            <AccessibilityBadge key={a} label={a} />
          ))}
        </View>
      )}

      <View style={styles.partHeader}>
        <Text style={styles.partTitle}>{count} participants</Text>
        <Text style={styles.partSub}>
          {left > 0 ? `${left} spots left` : 'Full'} · {event.capacity} max
        </Text>
      </View>

      <View style={styles.avatars}>
        {shown.map((p, i) => (
          <Avatar key={i} label={p} />
        ))}

        {count > shown.length && (
          <Avatar label={`+${count - shown.length}`} />
        )}
      </View>

      {!eventEnded && !hosting && (
        <>
          {going ? (
            <Button
              title="Cancel participation"
              variant="danger"
              onPress={() => {
                leaveEvent(event.id);
                setModal('You are no longer going to this event.');
              }}
              style={{ marginTop: 20 }}
            />
          ) : full ? (
            <View style={{ marginTop: 20 }}>
              <Text style={{
                color: colors.text,
                fontWeight: '700',
                fontSize: 16,
                marginBottom: 6,
              }}>
                Event is full!
              </Text>

              <Text style={{
                color: colors.muted,
                fontSize: 14,
                marginBottom: 12,
              }}>
                Want to receive a notification if a spot becomes available?
              </Text>

              <Button
                title={
                  isUpdatingWaitlist
                    ? 'Please wait...'
                    : isOnWaitlist
                      ? 'Leave waitlist'
                      : 'Notify me when a spot opens'
                }
                variant={isOnWaitlist ? 'outline' : undefined}
                disabled={isUpdatingWaitlist}
                onPress={toggleWaitlist}
              />
            </View>
          ) : (
            <Button
              title="Join"
              onPress={async () => {
                try {
                  await joinEvent(event.id);

                  // Remover da lista de espera depois de entrar
                  const { error } = await supabase
                    .from('event_waitlist')
                    .delete()
                    .eq('event_id', event.id)
                    .eq('user_id', user.id);

                  if (error) {
                    console.error('Error leaving waitlist:', error.message);
                  }

                  setIsOnWaitlist(false);
                  setModal(`You're going to ${event.title}!`);
                } catch (error) {
                  console.error('Error joining event:', error);
                  setModal(error.message);
                }
              }}
              style={{ marginTop: 20 }}
            />
          )}
        </>
      )}

      {event.host_id && user && (
        <Button
          title={event.host_id === user.id ? 'View chats' : 'Message organizer'}
          variant="outline"
          icon="chatbubble-outline"
          onPress={async () => {
            try {
              if (event.host_id === user.id) {
                navigation.navigate('EventChats', {
                  eventId: event.id,
                });
              } else {
                const conversation = await getOrCreateConversation(event.id);

                navigation.navigate('Chat', {
                  conversationId: conversation.id,
                  eventId: event.id,
                  otherName: event.host,
                });
              }
            } catch (error) {
              Alert.alert('Chat error', error.message);
            }
          }}
          style={{ marginTop: 10 }}
        />
      )}

      {/* REVIEW FORM */}
      {eventEnded && going && !myReview && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewTitle}>Share your experience</Text>

          <Text style={styles.reviewSubtitle}>
            How was this event? Let others know!
          </Text>

          <Text style={styles.ratingLabel}>Your rating</Text>

          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => setRating(star)}
                disabled={isSubmittingReview}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={34}
                  color={colors.orange}
                />
              </Pressable>
            ))}
          </View>

          <Text style={styles.ratingText}>{rating} out of 5</Text>

          <TextInput
            style={styles.reviewInput}
            placeholder="Tell us about your experience..."
            placeholderTextColor={colors.muted}
            value={reviewText}
            onChangeText={setReviewText}
            multiline
            textAlignVertical="top"
            maxLength={1000}
            editable={!isSubmittingReview}
          />

          <Text style={styles.charCount}>
            {reviewText.length}/1000
          </Text>

          <Text style={styles.ratingLabel}>Add a photo (optional)</Text>

          <Pressable
            style={styles.photoButton}
            onPress={pickReviewImage}
            disabled={isProcessingImage || isSubmittingReview}
          >
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage.uri }}
                style={styles.photoPreview}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons
                  name="camera-outline"
                  size={28}
                  color={colors.green}
                />
                <Text style={styles.photoText}>
                  {isProcessingImage ? 'Preparing photo...' : 'Add a photo'}
                </Text>
                <Text style={styles.photoHint}>JPEG · Maximum 1 MB</Text>
              </View>
            )}
          </Pressable>

          {selectedImage && (
            <Pressable
              onPress={() => setSelectedImage(null)}
              disabled={isSubmittingReview}
              style={styles.removePhoto}
            >
              <Text style={styles.removePhotoText}>Remove photo</Text>
            </Pressable>
          )}

          <Pressable
            style={[
              styles.publishButton,
              (isSubmittingReview || isProcessingImage) &&
                styles.disabledButton,
            ]}
            onPress={submitReview}
            disabled={isSubmittingReview || isProcessingImage}
          >
            {isSubmittingReview ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.publishText}>Publish review</Text>
            )}
          </Pressable>
        </View>
      )}

      {myReview && (
        <View style={styles.alreadyReviewed}>
          <Ionicons name="checkmark-circle" size={22} color={colors.green} />
          <Text style={styles.alreadyReviewedText}>
            You have already reviewed this event.
          </Text>
        </View>
      )}

      {eventEnded && !going && !hosting && (
        <View style={styles.alreadyReviewed}>
          <Text style={styles.reviewSubtitle}>
            Only event participants can publish a review.
          </Text>
        </View>
      )}

      {/* EXISTING REVIEWS */}
      {eventReviews.length > 0 && (
        <View style={styles.existingReviews}>
          <Text style={styles.reviewTitle}>Event reviews</Text>

          {eventReviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewAuthorRow}>
                <Avatar label={initials(review.author)} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewAuthor}>{review.author}</Text>
                  <View style={styles.reviewStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= review.rating ? 'star' : 'star-outline'}
                        size={13}
                        color={colors.orange}
                      />
                    ))}
                  </View>
                </View>
              </View>

              <Text style={styles.reviewContent}>{review.content}</Text>

              {review.imageUrl && (
                <Image
                  source={{ uri: review.imageUrl }}
                  style={styles.reviewImage}
                  resizeMode="cover"
                />
              )}
            </View>
          ))}
        </View>
      )}

      <ConfirmModal
        visible={!!modal}
        message={modal}
        onConfirm={() => setModal(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCE5DD',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  },

  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },

  bannerSub: {
    color: colors.muted,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    flex: 1,
  },

  status: {
    backgroundColor: '#D6E4DB',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  statusText: {
    color: colors.green,
    fontWeight: '700',
    fontSize: 12,
  },

  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },

  host: {
    color: colors.text,
    marginLeft: 6,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },

  infoBold: {
    fontWeight: '700',
    color: colors.text,
    marginLeft: 10,
  },

  infoSub: {
    color: colors.muted,
    marginLeft: 10,
    fontSize: 13,
  },

  levelPill: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 14,
  },

  levelText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },

  desc: {
    color: colors.text,
    lineHeight: 22,
    marginTop: 14,
  },

  access: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },

  partHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 8,
  },

  partTitle: {
    fontWeight: '700',
    color: colors.text,
  },

  partSub: {
    color: colors.muted,
    fontSize: 13,
  },

  avatars: {
    flexDirection: 'row',
  },

  reviewSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
  },

  reviewTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
  },

  reviewSubtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 5,
    lineHeight: 19,
  },

  ratingLabel: {
    color: colors.text,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
  },

  stars: {
    flexDirection: 'row',
    gap: 8,
  },

  ratingText: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 5,
  },

  reviewInput: {
    backgroundColor: colors.bg,
    borderRadius: 12,
    padding: 12,
    minHeight: 110,
    color: colors.text,
    fontSize: 14,
    marginTop: 18,
  },

  charCount: {
    textAlign: 'right',
    color: colors.muted,
    fontSize: 11,
    marginTop: 5,
  },

  photoButton: {
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.bg,
  },

  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  photoPreview: {
    width: '100%',
    height: '100%',
  },

  photoText: {
    color: colors.green,
    fontWeight: '700',
  },

  photoHint: {
    color: colors.muted,
    fontSize: 11,
  },

  removePhoto: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },

  removePhotoText: {
    color: '#C34B4B',
    fontSize: 13,
    fontWeight: '600',
  },

  publishButton: {
    backgroundColor: colors.green,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 22,
  },

  disabledButton: {
    opacity: 0.6,
  },

  publishText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },

  alreadyReviewed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCE5DD',
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
  },

  alreadyReviewedText: {
    color: colors.green,
    fontWeight: '600',
    flex: 1,
  },

  existingReviews: {
    marginTop: 26,
    gap: 12,
  },

  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
  },

  reviewAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  reviewAuthor: {
    color: colors.text,
    fontWeight: '700',
  },

  reviewStars: {
    flexDirection: 'row',
    marginTop: 3,
  },

  reviewContent: {
    color: colors.text,
    lineHeight: 21,
    marginTop: 12,
  },

  reviewImage: {
    width: '100%',
    height: 190,
    borderRadius: 10,
    marginTop: 12,
  },
});
