import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { colors, levelColors } from '../theme';
import { useApp, eventHasEnded } from '../context/AppContext';
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
    participants,
    countOf,
    spotsLeft,
    joinEvent,
    leaveEvent,
    getOrCreateConversation,
    deleteEvent,
  } = useApp();

  const event = events.find((e) => e.id === route.params.id);

  // Estado do evento, atualizado automaticamente
  const [eventEnded, setEventEnded] = useState(() =>
    eventHasEnded(event)
  );

  useEffect(() => {
    const updateEventStatus = () => {
      setEventEnded(eventHasEnded(event));
    };

    updateEventStatus();

    const interval = setInterval(updateEventStatus, 1000);

    return () => clearInterval(interval);
  }, [event?.id, event?.when, event?.past]);

  // Janelas de confirmação e resultado
  const [modal, setModal] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);
  const [isUpdatingWaitlist, setIsUpdatingWaitlist] = useState(false);
  const [participantNames, setParticipantNames] = useState({});

  // Nomes dos participantes, para mostrar as iniciais
  const participantIds = (event && participants[event.id]) || [];
  const participantKey = participantIds.join(',');

  // Apagar eventos
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!participantKey) return;

    let mounted = true;

    supabase
      .from('profiles')
      .select('id, name')
      .in('id', participantKey.split(','))
      .then(({ data, error }) => {
        if (error) {
          console.error('Error loading participants:', error.message);
          return;
        }

        if (mounted) {
          setParticipantNames(
            Object.fromEntries((data || []).map((p) => [p.id, p.name]))
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, [participantKey]);

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

  const showError = (error, fallback) =>
    setModal({
      title: 'Something went wrong',
      message: error?.message || fallback,
      variant: 'danger',
    });

  // Entrar no evento
  const join = async () => {
    try {
      setIsJoining(true);
      await joinEvent(event.id);

      const { error } = await supabase
        .from('event_waitlist')
        .delete()
        .eq('event_id', event.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error leaving waitlist:', error.message);
      }

      setIsOnWaitlist(false);
      setModal({
        title: "You're going!",
        message: `You joined ${event.title}. See you there!`,
      });
    } catch (error) {
      console.error('Error joining event:', error);
      showError(error, 'Could not join the event. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

  // Cancelar a participação
  const leave = async () => {
    setConfirmLeave(false);

    try {
      setIsLeaving(true);
      await leaveEvent(event.id);
      setModal({
        title: 'Participation cancelled',
        message: `You are no longer going to ${event.title}.`,
      });
    } catch (error) {
      console.error('Error leaving event:', error);
      showError(error, 'Could not cancel your participation. Please try again.');
    } finally {
      setIsLeaving(false);
    }
  };

  const eventReviews = reviews[event.id] || [];

  const myReview = eventReviews.find(
    (review) => review.userId === user?.id
  );

  // Até 4 avatares
  const MAX_AVATARS = 4;
  const others = participantIds
    .filter((id) => id !== user?.id)
    .map((id) => participantNames[id] || '?');

  const shown = [
    ...(going ? ['ME'] : []),
    ...others.map((name) => initials(name) || '?'),
  ].slice(0, MAX_AVATARS);

  // Entrar ou sair da lista de espera
  const toggleWaitlist = async () => {
    if (!user) {
      showError(null, 'You must be logged in to join the waitlist.');
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
        setModal({
          title: 'Left the waitlist',
          message: "You won't be notified when a spot opens.",
        });
      } else {
        const { error } = await supabase
          .from('event_waitlist')
          .insert({
            event_id: event.id,
            user_id: user.id,
          });

        if (error) throw error;

        setIsOnWaitlist(true);
        setModal({
          title: "You're on the waitlist",
          message: "We'll notify you if a spot opens up.",
        });
      }
    } catch (error) {
      console.error('Waitlist error:', error);
      showError(error, 'Could not update the waitlist.');
    } finally {
      setIsUpdatingWaitlist(false);
    }
  };

  const handleDeleteEvent = async () => {
    try {
      setIsDeleting(true);

      await deleteEvent(event.id);

      setConfirmDelete(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting event:', error);
      Alert.alert('Error', 'Could not delete this event. Please try again.');
    } finally {
      setIsDeleting(false);
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
        <Text style={styles.partTitle}>
          {eventEnded
            ? `${count} ${count === 1 ? 'person' : 'people'} went`
            : `${count} ${count === 1 ? 'participant' : 'participants'}`}
        </Text>

        {!eventEnded && (
          <Text style={styles.partSub}>
            {left > 0 ? `${left} ${left === 1 ? 'spot' : 'spots'} left` : 'Full'} · {event.capacity} max
          </Text>
        )}
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
              title={isLeaving ? 'Cancelling…' : 'Cancel participation'}
              variant="danger"
              disabled={isLeaving}
              onPress={() => setConfirmLeave(true)}
              style={{ marginTop: 20 }}
            />
          ) : full ? (
            <View style={{ marginTop: 20 }}>
              <Text
                style={{
                  color: colors.text,
                  fontWeight: '700',
                  fontSize: 16,
                  marginBottom: 6,
                }}
              >
                Event is full!
              </Text>

              <Text
                style={{
                  color: colors.muted,
                  fontSize: 14,
                  marginBottom: 12,
                }}
              >
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
              title={isJoining ? 'Joining…' : 'Join'}
              disabled={isJoining}
              onPress={join}
              style={{ marginTop: 20 }}
            />
          )}
        </>
      )}

      {/* Evento passado: atalho para o ecrã da review */}
      {eventEnded && going && !myReview && (
        <Button
          title="Leave a review"
          icon="star-outline"
          onPress={() => navigation.navigate('Review', { id: event.id })}
          style={{ marginTop: 20 }}
        />
      )}

      {eventEnded && myReview && (
        <View style={styles.alreadyReviewed}>
          <Ionicons name="checkmark-circle" size={22} color={colors.green} />
          <Text style={styles.alreadyReviewedText}>
            You rated this event {'★'.repeat(myReview.rating)}
          </Text>
        </View>
      )}

      <View style={styles.eventActions}>
        {event.host_id && user && (
          <View style={styles.eventAction}>
            <Button
              title={hosting ? 'Chats' : 'Message'}
              variant="outline"
              icon="chatbubble-outline"
              onPress={async () => {
                try {
                  if (hosting) {
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
            />
          </View>
        )}

        {/* Editar e eliminar apenas antes do início do evento */}
        {hosting && !eventEnded && (
          <>
            <View style={styles.eventAction}>
              <Button
                title="Edit"
                variant="outline"
                icon="create-outline"
                onPress={() =>
                  navigation.navigate('CreateEvent', { event })
                }
              />
            </View>

            <View style={styles.eventAction}>
              <Button
                title="Delete"
                variant="outline"
                icon="trash-outline"
                onPress={() => setConfirmDelete(true)}
                style={styles.deleteButton}
              />
            </View>
          </>
        )}
      </View>

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

              {review.accessibilityAccuracy && (
                <Text style={styles.reviewAccuracy}>
                  Accessibility info:{' '}
                  {{
                    yes: 'accurate',
                    partly: 'partly accurate',
                    no: 'not accurate',
                  }[review.accessibilityAccuracy]}
                </Text>
              )}

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
        visible={confirmLeave}
        variant="danger"
        title="Cancel participation?"
        message={`You will lose your spot in ${event.title}.`}
        confirmText="Yes, cancel"
        cancelText="Keep my spot"
        onConfirm={leave}
        onCancel={() => setConfirmLeave(false)}
      />

      <ConfirmModal
        visible={!!modal}
        title={modal?.title}
        message={modal?.message}
        variant={modal?.variant}
        onConfirm={() => setModal(null)}
      />

      <ConfirmModal
        visible={confirmDelete}
        variant="danger"
        title="Delete event?"
        message="Are you sure you want to delete this event? All participants will be notified and the event will be permanently removed."
        confirmText={isDeleting ? 'Deleting...' : 'Yes, delete'}
        cancelText="Keep event"
        onConfirm={handleDeleteEvent}
        onCancel={() => setConfirmDelete(false)}
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

  reviewAccuracy: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },

  reviewImage: {
    width: '100%',
    height: 190,
    borderRadius: 10,
    marginTop: 12,
  },

  eventActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    alignItems: 'center',
  },

  eventAction: {
    flex: 1,
    minWidth: 0,
  },

  deleteButton: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
});
