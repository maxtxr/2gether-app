import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../theme';
import { useApp, eventHasEnded } from '../context/AppContext';
import { EventCard, Avatar, ReviewCard } from '../components';

export default function HomeScreen({ navigation }) {
  const { user, events = [], reviews = {} } = useApp();

  const interests = Array.isArray(user?.interests) ? user.interests : [];
  const firstName = (user?.name || '').trim().split(/\s+/)[0] || 'Friend';

  const upcoming = events.filter((e) => !eventHasEnded(e));

  const matchesInterests = (e) =>
    interests.some(
      (i) =>
        e.sport?.toLowerCase() === i.toLowerCase() ||
        e.subcategory?.toLowerCase() === i.toLowerCase() ||
        e.category?.toLowerCase() === i.toLowerCase() ||
        (e.title || '').toLowerCase().includes(i.toLowerCase())
    );

  const picked = upcoming.filter(matchesInterests);
  const rest = upcoming.filter((e) => !matchesInterests(e));
  const suggested = [...picked, ...rest].slice(0, 6);

  // Pagination for reviews feed — start small so Home is quick to scan and
  // let people reveal older stories on demand.
  const REVIEWS_PAGE_SIZE = 5;
  const [visibleReviewsCount, setVisibleReviewsCount] = useState(
    REVIEWS_PAGE_SIZE
  );

  const allFeedReviews = Object.values(reviews || {})
    .flat()
    .filter(Boolean)
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

  const feedReviews = allFeedReviews.slice(0, visibleReviewsCount);
  const hasMoreReviews = visibleReviewsCount < allFeedReviews.length;

  const openEvent = (id) => {
    if (id) navigation.navigate('EventDetail', { id });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Welcoming Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Hey, {firstName} 👋</Text>
          <Text style={styles.subtitle}>Ready for your next activity?</Text>
        </View>

        <Pressable
          onPress={() => navigation.navigate('Tabs', { screen: 'Profile' })}
          style={styles.headerAvatarWrap}
          accessibilityRole="button"
          accessibilityLabel="Go to profile"
        >
          <Avatar source={user?.avatarUrl} name={user?.name} size={42} />
        </Pressable>
      </View>

      {/* 2. Suggested Events */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Suggested Events</Text>
          <Text style={styles.sectionSubtitle}>
            {interests.length > 0 ? 'Based on your sports & preferences' : 'Popular in your area'}
          </Text>
        </View>

        <Pressable
          onPress={() => navigation.navigate('Tabs', { screen: 'Search' })}
          hitSlop={8}
          accessibilityRole="button"
        >
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>

      {suggested.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.eventsScrollList}
        >
          {suggested.map((event) => (
            <View key={event.id} style={styles.eventCardWrapper}>
              <EventCard event={event} onPress={() => openEvent(event.id)} />
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="calendar-outline" size={26} color={colors.muted} />
          <Text style={styles.emptyTitle}>No upcoming events</Text>
          <Text style={styles.emptyText}>
            Check back later or be the first to create one!
          </Text>
        </View>
      )}

      {/* 3. Community Activity Feed */}
      <View style={styles.feedHeader}>
        <View>
          <Text style={styles.sectionTitle}>Community Feed</Text>
          <Text style={styles.sectionSubtitle}>
            Real experiences, ratings, and moments
          </Text>
        </View>
      </View>

      {feedReviews.length > 0 ? (
        <>
          <View style={styles.reviewsList}>
            {feedReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onEventPress={
                  review.eventId
                    ? () => openEvent(review.eventId)
                    : undefined
                }
              />
            ))}
          </View>

          {/* Load More / End Of Feed */}
          <View style={styles.loadMoreContainer}>
            {hasMoreReviews ? (
              <Pressable
                style={({ pressed }) => [
                  styles.loadMoreBtn,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() =>
                  setVisibleReviewsCount((curr) => curr + REVIEWS_PAGE_SIZE)
                }
                accessibilityRole="button"
              >
                <Text style={styles.loadMoreText}>Show more stories</Text>
                <Ionicons
                  name="chevron-down"
                  size={15}
                  color={colors.green || '#16A34A'}
                />
              </Pressable>
            ) : (
              <Text style={styles.endFeedText}>
                You're all caught up with the community!
              </Text>
            )}
          </View>
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons
            name="chatbubbles-outline"
            size={28}
            color={colors.muted}
          />
          <Text style={styles.emptyTitle}>No stories yet</Text>
          <Text style={styles.emptyText}>
            Reviews and photos from completed events will appear here.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg || '#F8FAF9',
  },
  content: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginHorizontal: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  headerAvatarWrap: {
    padding: 2,
  },
  sectionHeader: {
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  seeAll: {
    color: colors.green || '#16A34A',
    fontSize: 13,
    fontWeight: '600',
    paddingBottom: 2,
  },
  eventsScrollList: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    gap: 12,
  },
  eventCardWrapper: {
    width: 280,
  },
  emptyCard: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: radii.md || 16,
    borderWidth: 1,
    borderColor: colors.border || '#E5E7EB',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 240,
  },
  feedHeader: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  reviewsList: {
    marginHorizontal: 16,
    gap: 12,
  },
  loadMoreContainer: {
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radii.pill || 999,
    borderWidth: 1,
    borderColor: colors.border || '#E5E7EB',
    paddingVertical: 9,
    paddingHorizontal: 18,
    gap: 6,
  },
  loadMoreText: {
    color: colors.green || '#16A34A',
    fontSize: 13,
    fontWeight: '700',
  },
  endFeedText: {
    color: colors.muted,
    fontSize: 12,
    fontStyle: 'italic',
  },
});