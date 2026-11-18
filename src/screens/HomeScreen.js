
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../theme';
import { useApp } from '../context/AppContext';
import { EventCard } from '../components';

export default function HomeScreen({ navigation }) {
  const { user, events, reviews } = useApp();

  const interests = user?.interests || [];
  const firstName = (user?.name || '').trim().split(/\s+/)[0];

  const upcoming = events.filter((e) => !e.past);

  const matchesInterests = (e) =>
    interests.some(
      (i) =>
        e.sport === i ||
        e.category === i ||
        (e.title || '').toLowerCase().includes(i.toLowerCase())
    );

  const picked = upcoming.filter(matchesInterests);
  const rest = upcoming.filter((e) => !matchesInterests(e));

  const suggested = [...picked, ...rest].slice(0, 6);

  // Juntar todas as reviews de todos os eventos
  const feedReviews = Object.values(reviews || {})
    .flat()
    .sort(
      (a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );

  const open = (id) =>
    navigation.navigate('EventDetail', { id });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hi, {firstName} 👋
          </Text>

          <Text style={styles.subtitle}>
            Discover what's happening around you.
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons name="sparkles" size={22} color="#fff" />
        </View>
      </View>

      {/* Suggested events */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Suggested events
        </Text>

        <Text style={styles.seeAll}>
          For you
        </Text>
      </View>

      {suggested.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.eventsList}
        >
          {suggested.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <EventCard
                event={event}
                onPress={() => open(event.id)}
              />
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyEvents}>
          <Ionicons
            name="calendar-outline"
            size={24}
            color={colors.muted}
          />

          <Text style={styles.emptyText}>
            No upcoming events right now.
          </Text>
        </View>
      )}

      {/* Feed */}
      <View style={styles.feedHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            Feed
          </Text>

          <Text style={styles.feedSubtitle}>
            See what people are sharing.
          </Text>
        </View>

        <Ionicons
          name="newspaper-outline"
          size={23}
          color={colors.green}
        />
      </View>

      {/* Reviews */}
      {feedReviews.length > 0 ? (
        <View style={styles.reviewsList}>
          {feedReviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              
              {/* Author */}
              <View style={styles.reviewHeader}>
                <View style={styles.avatar}>
                  <Ionicons
                    name="person"
                    size={20}
                    color={colors.green}
                  />
                </View>

                <View style={styles.authorInfo}>
                  <Text style={styles.authorName}>
                    {review.author}
                  </Text>

                  <Text style={styles.eventName}>
                    {review.eventTitle}
                  </Text>
                </View>

                <View style={styles.rating}>
                  <Ionicons
                    name="star"
                    size={14}
                    color="#F5B942"
                  />

                  <Text style={styles.ratingText}>
                    {review.rating}/5
                  </Text>
                </View>
              </View>

              {/* Review text */}
              <Text style={styles.reviewContent}>
                {review.content}
              </Text>

              {/* Review image */}
              {review.imageUrl && (
                <Image
                  source={{ uri: review.imageUrl }}
                  style={styles.reviewImage}
                  resizeMode="cover"
                />
              )}

              {/* Date */}
              <View style={styles.reviewFooter}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={colors.muted}
                />

                <Text style={styles.reviewDate}>
                  {new Date(review.createdAt).toLocaleDateString(
                    'en-GB',
                    {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }
                  )}
                </Text>

                <Text
                  style={styles.viewEvent}
                  onPress={() => open(review.eventId)}
                >
                  View event
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyFeed}>
          <View style={styles.emptyFeedIcon}>
            <Ionicons
              name="images-outline"
              size={30}
              color={colors.green}
            />
          </View>

          <Text style={styles.emptyFeedTitle}>
            Nothing to see yet
          </Text>

          <Text style={styles.emptyFeedText}>
            Reviews and photos from events will appear here.
            Join an event and share your experience!
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  content: {
    paddingTop: 16,
    paddingBottom: 30,
  },

  header: {
    marginHorizontal: 16,
    marginBottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  greeting: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '800',
  },

  subtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionHeader: {
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },

  seeAll: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '700',
  },

  eventsList: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 12,
  },

  eventCard: {
    width: 275,
  },

  emptyEvents: {
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    alignItems: 'center',
    gap: 8,
  },

  emptyText: {
    color: colors.muted,
    fontSize: 13,
  },

  feedHeader: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  feedSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },

  reviewsList: {
    marginHorizontal: 16,
    gap: 14,
  },

  reviewCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: 16,
  },

  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  authorInfo: {
    flex: 1,
    marginLeft: 10,
  },

  authorName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },

  eventName: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },

  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  ratingText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },

  reviewContent: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },

  reviewImage: {
    width: '100%',
    height: 220,
    borderRadius: radii.md,
    marginBottom: 12,
    backgroundColor: colors.bg,
  },

  reviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },

  reviewDate: {
    color: colors.muted,
    fontSize: 11,
    flex: 1,
  },

  viewEvent: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '700',
  },

  emptyFeed: {
    marginHorizontal: 16,
    minHeight: 220,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  emptyFeedIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  emptyFeedTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 7,
  },

  emptyFeedText: {
    color: colors.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
});
