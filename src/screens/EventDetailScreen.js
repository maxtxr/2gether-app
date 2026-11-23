
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { colors, levelColors } from '../theme';
import { useApp, eventHasEnded } from '../context/AppContext';
import {
  Avatar,
  initials,
  Button,
  ConfirmModal,
} from '../components';

import { EVENT_CATEGORIES, ACCESSIBILITY } from '../data/options';

import { supabase } from '../../lib/supabase';

export default function EventDetailScreen({ route, navigation }) {
  const {
    events,
    goingIds,
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

  const [modal, setModal] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);
  const [isUpdatingWaitlist, setIsUpdatingWaitlist] = useState(false);
  const [participantNames, setParticipantNames] = useState({});

  const participantIds = (event && participants[event.id]) || [];
  const participantKey = participantIds.join(',');

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!participantKey) {
      setParticipantNames({});
      return;
    }

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
    return <Text style={styles.notFound}>Event not found.</Text>;
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

  const MAX_AVATARS = 4;
  const others = participantIds
    .filter((id) => id !== user?.id)
    .map((id) => participantNames[id] || '?');

  const shown = [
    ...(going ? ['ME'] : []),
    ...others.map((name) => initials(name) || '?'),
  ].slice(0, MAX_AVATARS);

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
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* EVENT HEADER */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.sportIcon}>
            <MaterialCommunityIcons
              name={
                event.icon ||
                EVENT_CATEGORIES.find(
                  (category) => category.name === event.category
                )?.icon ||
                'apps'
              }
              size={28}
              color={colors.green}
            />
          </View>

          <View style={styles.headerTags}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>
                {event.category}
              </Text>
            </View>

            <View
              style={[
                styles.statusTag,
                eventEnded && styles.pastStatusTag,
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  eventEnded && styles.pastStatusDot,
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  eventEnded && styles.pastStatusText,
                ]}
              >
                {eventEnded ? 'Past event' : 'Upcoming'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.title}>{event.title}</Text>

        <View style={styles.hostRow}>
          <Avatar label={initials(event.host)} dark />
          <View style={styles.hostInfo}>
            <Text style={styles.hostLabel}>Organised by</Text>
            <Text style={styles.hostName}>{event.host}</Text>
          </View>
        </View>

        <View style={styles.headerBottom}>
          <View
            style={[
              styles.levelTag,
              { backgroundColor: levelColors[event.level] },
            ]}
          >
            <Text style={styles.levelText}>{event.level}</Text>
          </View>

          <Text style={styles.sportName}>{event.sport}</Text>
        </View>
      </View>

      {/* EVENT INFORMATION */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Event information</Text>

        <View style={styles.compactInfoRow}>
          <Ionicons name="calendar-outline" size={18} color={colors.green} />
          <Text style={styles.compactInfoText}>{event.when}</Text>
        </View>

        <View style={styles.compactInfoRow}>
          <Ionicons name="location-outline" size={18} color={colors.green} />
          <View style={{ flex: 1 }}>
            <Text style={styles.compactInfoText}>{event.place}</Text>
            {event.address ? (
              <Text style={styles.infoSub}>{event.address}</Text>
            ) : null}
          </View>
        </View>

        {event.accessibility?.length > 0 && (
          <View style={styles.access}>
            {event.accessibility.map((a) => {
              const option = ACCESSIBILITY.find((item) => item.name === a);

              return (
                <View key={a} style={styles.accessChip}>
                  <MaterialCommunityIcons
                    name={option?.icon || 'check-circle-outline'}
                    size={14}
                    color={colors.green}
                  />
                  <Text style={styles.accessChipText}>{a}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* DESCRIPTION */}
      {event.description ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>About this event</Text>
          <Text style={styles.description}>{event.description}</Text>
        </View>
      ) : null}

      {/* PARTICIPANTS */}
      <View style={styles.card}>
        <View style={styles.partHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              {eventEnded ? 'Participants' : "Who's going?"}
            </Text>
            <Text style={styles.partSubtitle}>
              {eventEnded
                ? `${count} ${count === 1 ? 'person attended' : 'people attended'}`
                : `${count} ${count === 1 ? 'person is going' : 'people are going'}`}
            </Text>
          </View>

          <View
            style={[
              styles.partCount,
              full && styles.partCountFull,
            ]}
          >
            <Ionicons
              name="people"
              size={15}
              color={full ? colors.orange : colors.green}
            />
            <Text
              style={[
                styles.partCountText,
                full && styles.partCountTextFull,
              ]}
            >
              {count}/{event.capacity}
            </Text>
          </View>
        </View>

        <View style={styles.participantProgress}>
          <View
            style={[
              styles.participantProgressFill,
              {
                width: `${Math.min(
                  100,
                  (count / Math.max(event.capacity, 1)) * 100
                )}%`,
              },
            ]}
          />
        </View>

        <View style={styles.avatars}>
          {shown.map((p, i) => (
            <Avatar key={i} label={p} />
          ))}

          {count > shown.length && (
            <Avatar label={`+${count - shown.length}`} />
          )}

          {count === 0 && (
            <Text style={styles.noParticipants}>
              No participants yet. Be the first!
            </Text>
          )}
        </View>
      </View>

      {/* MAIN ACTIONS */}
      {!eventEnded && !hosting && (
        <View style={styles.mainAction}>
          {going ? (
            <Button
              title={isLeaving ? 'Cancelling…' : 'Cancel participation'}
              variant="danger"
              disabled={isLeaving}
              onPress={() => setConfirmLeave(true)}
            />
          ) : full ? (
            <View style={styles.waitlistBox}>
              <View style={styles.waitlistHeading}>
                <Ionicons
                  name="people-outline"
                  size={22}
                  color={colors.orange}
                />
                <Text style={styles.waitlistTitle}>Event is full</Text>
              </View>

              <Text style={styles.waitlistDescription}>
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
              title={isJoining ? 'Joining…' : 'Join event'}
              disabled={isJoining}
              onPress={join}
            />
          )}
        </View>
      )}

      {/* REVIEW ACTION */}
      {eventEnded && going && !myReview && (
        <View style={styles.mainAction}>
          <Button
            title="Leave a review"
            icon="star-outline"
            onPress={() => navigation.navigate('Review', { id: event.id })}
          />
        </View>
      )}

      {eventEnded && myReview && (
        <View style={styles.alreadyReviewed}>
          <Ionicons name="checkmark-circle" size={22} color={colors.green} />
          <View style={{ flex: 1 }}>
            <Text style={styles.alreadyReviewedTitle}>Review submitted</Text>
            <Text style={styles.alreadyReviewedText}>
              You rated this event {'★'.repeat(myReview.rating)}
            </Text>
          </View>
        </View>
      )}

      {/* OTHER ACTIONS */}
      {event.host_id && user && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>More actions</Text>

          <View style={styles.eventActions}>
            <View style={styles.eventAction}>
              <Button
                title={hosting ? 'Chats' : 'Message host'}
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
        </View>
      )}

      {/* EXISTING REVIEWS */}
      {eventReviews.length > 0 && (
        <View style={styles.reviewsSection}>
          <View style={styles.sectionHeadingRow}>
            <Ionicons name="star-outline" size={21} color={colors.green} />
            <Text style={styles.sectionTitle}>Event reviews</Text>
            <View style={styles.reviewCount}>
              <Text style={styles.reviewCountText}>
                {eventReviews.length}
              </Text>
            </View>
          </View>

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
                        size={14}
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

      {/* CONFIRMATION MODALS */}
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

  content: {
    padding: 16,
    paddingBottom: 36,
    gap: 14,
  },

  notFound: {
    padding: 16,
    color: colors.text,
  },

  headerCard: {
    backgroundColor: '#DCE5DD',
    borderRadius: 18,
    padding: 18,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  sportIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  categoryTag: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  categoryTagText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },

  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },

  pastStatusTag: {
    backgroundColor: '#ECECEC',
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.green,
  },

  pastStatusDot: {
    backgroundColor: colors.muted,
  },

  statusText: {
    color: colors.green,
    fontSize: 11,
    fontWeight: '700',
  },

  pastStatusText: {
    color: colors.muted,
  },

  title: {
    fontSize: 25,
    fontWeight: '800',
    color: colors.text,
    lineHeight: 31,
  },

  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },

  hostInfo: {
    marginLeft: 9,
  },

  hostLabel: {
    fontSize: 11,
    color: colors.muted,
  },

  hostName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },

  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 17,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: '#C5D2C8',
    gap: 9,
  },

  levelTag: {
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },

  levelText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },

  sportName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },

  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EDF3EE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  infoContent: {
    flex: 1,
    marginLeft: 12,
  },

  infoLabel: {
    color: colors.muted,
    fontSize: 12,
    marginBottom: 3,
  },

  infoValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },

  infoSub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },

  infoDivider: {
    height: 1,
    backgroundColor: colors.bg,
  },

  description: {
    color: colors.text,
    lineHeight: 22,
    fontSize: 14,
    marginTop: 10,
  },

  access: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.bg,
  },

  accessChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EDF3EE',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  accessChipText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },

  partHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  partSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
  },

  partCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EDF3EE',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  partCountText: {
    color: colors.green,
    fontWeight: '700',
    fontSize: 12,
  },

  participantProgress: {
    height: 6,
    borderRadius: 5,
    backgroundColor: colors.bg,
    overflow: 'hidden',
    marginTop: 15,
    marginBottom: 14,
  },

  participantProgressFill: {
    height: '100%',
    backgroundColor: colors.green,
    borderRadius: 5,
  },

  avatars: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 38,
  },

  noParticipants: {
    color: colors.muted,
    fontSize: 12,
    marginLeft: 4,
  },

  mainAction: {
    marginTop: 2,
  },

  waitlistBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },

  waitlistHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  waitlistTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 16,
  },

  waitlistDescription: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    marginBottom: 14,
  },

  alreadyReviewed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#DCE5DD',
    borderRadius: 14,
    padding: 14,
  },

  alreadyReviewedTitle: {
    color: colors.green,
    fontWeight: '800',
    fontSize: 14,
  },

  alreadyReviewedText: {
    color: colors.text,
    fontSize: 12,
    marginTop: 2,
  },

  eventActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 13,
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

  reviewsSection: {
    gap: 12,
  },

  reviewCount: {
    backgroundColor: '#EDF3EE',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginLeft: 'auto',
  },

  reviewCountText: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '700',
  },

  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
  },

  reviewAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  reviewAuthor: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },

  reviewStars: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 2,
  },

  reviewContent: {
    color: colors.text,
    lineHeight: 21,
    fontSize: 13,
    marginTop: 12,
  },

  reviewAccuracy: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 7,
    fontStyle: 'italic',
  },

  reviewImage: {
    width: '100%',
    height: 190,
    borderRadius: 10,
    marginTop: 12,
  },

  compactInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },

  compactInfoText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  partCountFull: {
    backgroundColor: '#FCE8D8',
  },

  partCountTextFull: {
    color: colors.orange,
  },
});