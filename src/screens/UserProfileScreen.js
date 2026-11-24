import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radii } from '../theme';
import { useApp } from '../context/AppContext';
import { Avatar, Chip, ReviewCard } from '../components';
import { EventsCardList } from '../components/profile/ProfileComponents';

/**
 * Read-only profile of another member (for example the host of an event).
 * Opened from the event detail screen.
 */
export default function UserProfileScreen({ route, navigation }) {
  const { userId } = route.params || {};
  const { loadPublicProfile, events = [], reviews = {} } = useApp();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await loadPublicProfile(userId);

        if (mounted) {
          setProfile(data);
        }
      } catch (loadError) {
        console.error('Error loading public profile:', loadError);

        if (mounted) {
          setError(loadError.message || 'Could not load this profile.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [userId, loadPublicProfile]);

  const hostedEvents = useMemo(
    () => (events || []).filter((event) => event.host_id === userId),
    [events, userId]
  );

  const hostedEventIds = useMemo(
    () => new Set(hostedEvents.map((event) => event.id)),
    [hostedEvents]
  );

  const receivedReviews = useMemo(
    () =>
      Object.values(reviews || {})
        .flat()
        .filter((review) => hostedEventIds.has(review.eventId))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [reviews, hostedEventIds]
  );

  const rating = useMemo(() => {
    if (receivedReviews.length === 0) return null;

    const total = receivedReviews.reduce(
      (sum, review) => sum + (Number(review.rating) || 0),
      0
    );

    return Math.round((total / receivedReviews.length) * 10) / 10;
  }, [receivedReviews]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.green} />
        <Text style={styles.loadingText}>Loading profile…</Text>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.centered}>
        <Ionicons name="person-circle-outline" size={46} color={colors.muted} />
        <Text style={styles.errorTitle}>Profile unavailable</Text>
        <Text style={styles.errorText}>
          {error || 'We could not find this member.'}
        </Text>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
        >
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <View style={styles.topRow}>
          <Avatar source={profile.avatarUrl} name={profile.name} size={74} />

          <View style={styles.profileMeta}>
            <Text style={styles.name} numberOfLines={1}>
              {profile.name}
            </Text>

            {profile.bio ? (
              <Text style={styles.bio}>{profile.bio}</Text>
            ) : (
              <Text style={styles.bioEmpty}>No bio yet.</Text>
            )}

            {!!profile.since && (
              <View style={styles.sinceBadge}>
                <Ionicons
                  name="calendar-outline"
                  size={12}
                  color={colors.muted}
                />
                <Text style={styles.since}>Member since {profile.since}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{hostedEvents.length}</Text>
          <Text style={styles.statDesc}>Hosted</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statNum}>
            {rating == null ? '—' : rating.toFixed(1)}
          </Text>
          <Text style={styles.statDesc}>Rating</Text>
        </View>
      </View>

      {profile.interests.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Sports & Interests</Text>
            <Text style={styles.count}>{profile.interests.length}</Text>
          </View>
          <View style={styles.wrap}>
            {profile.interests.map((interest) => (
              <Chip key={interest} label={interest} />
            ))}
          </View>
        </View>
      )}

      {profile.accessibility.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Accessibility & Comfort</Text>
            <Text style={styles.count}>{profile.accessibility.length}</Text>
          </View>
          <View style={styles.wrap}>
            {profile.accessibility.map((tag) => (
              <Chip key={tag} label={tag} />
            ))}
          </View>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Events hosted</Text>
          <Text style={styles.count}>{hostedEvents.length}</Text>
        </View>

        <EventsCardList
          events={hostedEvents}
          type="hosted"
          onSelect={(id) => navigation.navigate('EventDetail', { id })}
        />
      </View>

      <View style={styles.reviewsBlock}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Reviews</Text>
          <Text style={styles.count}>{receivedReviews.length}</Text>
        </View>

        {receivedReviews.length > 0 ? (
          <View style={styles.reviewsList}>
            {receivedReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onEventPress={
                  review.eventId
                    ? () =>
                        navigation.navigate('EventDetail', {
                          id: review.eventId,
                        })
                    : undefined
                }
              />
            ))}
          </View>
        ) : (
          <Text style={styles.emptyHint}>
            No reviews from past events yet.
          </Text>
        )}
      </View>
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
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: 24,
  },
  loadingText: {
    marginTop: 10,
    color: colors.muted,
    fontSize: 13,
  },
  errorTitle: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  errorText: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  backBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: radii.pill,
    backgroundColor: colors.green,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileMeta: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
  },
  bio: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  bioEmpty: {
    color: colors.muted,
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
  sinceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  since: {
    color: colors.muted,
    fontSize: 12,
    marginLeft: 4,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  statDesc: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  count: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reviewsBlock: {
    marginBottom: 12,
  },
  reviewsList: {
    gap: 12,
  },
  emptyHint: {
    color: colors.muted,
    fontSize: 13,
  },
});
