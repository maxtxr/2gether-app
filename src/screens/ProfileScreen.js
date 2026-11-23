import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';

import { colors, radii } from '../theme';
import { useApp } from '../context/AppContext';
import { Chip } from '../components';

import {
  ProfileHeader,
  StatsRow,
  PendingReviewBanner,
  ReviewsCompletedBanner,
  EventsCardList,
  BadgesGrid,
  ReviewsList,
} from '../components/profile/ProfileComponents';

export default function ProfileScreen({ navigation }) {
  const {
    user,
    joinedCount = 0,
    upcomingEvents = [],
    hostedEvents = [],
    pastEvents = [],
    badges = [],
    receivedReviews = [],
    averageRating,
  } = useApp();

  const [activeEventTab, setActiveEventTab] = useState('upcoming');

  const safeInterests = Array.isArray(user?.interests) ? user.interests : [];
  const safeAccessibility = Array.isArray(user?.accessibility) ? user.accessibility : [];
  const safeBadges = Array.isArray(badges) ? badges : [];
  const safeUpcoming = Array.isArray(upcomingEvents) ? upcomingEvents : [];
  const safeHosted = Array.isArray(hostedEvents) ? hostedEvents : [];
  const safePast = Array.isArray(pastEvents) ? pastEvents : [];
  const safeReviews = Array.isArray(receivedReviews) ? receivedReviews : [];

  const eventNeedingReview = useMemo(() => {
    return safePast.find((e) => !e.reviewed);
  }, [safePast]);

  const currentTabEvents =
    activeEventTab === 'upcoming'
      ? safeUpcoming
      : activeEventTab === 'hosted'
      ? safeHosted
      : safePast;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ProfileHeader
        user={user}
        onEditPress={() => navigation.navigate('EditProfile')}
        onSettingsPress={() => navigation.navigate('Settings')}
      />

      <StatsRow
        joinedCount={joinedCount || safeUpcoming.length + safePast.length}
        hostedCount={safeHosted.length}
        rating={averageRating}
      />

      {eventNeedingReview ? (
        <PendingReviewBanner
          event={eventNeedingReview}
          onReview={(event) =>
            navigation.navigate('Review', {
              id: event.id,
            })
          }
        />
      ) : safePast.length > 0 ? (
        <ReviewsCompletedBanner />
      ) : null}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Sports & Interests</Text>
          <Text style={styles.badgeText}>{safeInterests.length}</Text>
        </View>
        <View style={styles.wrap}>
          {safeInterests.length > 0 ? (
            safeInterests.map((interest) => <Chip key={interest} label={interest} />)
          ) : (
            <Text style={styles.emptyHint}>No sports or interests added yet.</Text>
          )}
        </View>
      </View>

      {safeAccessibility.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Accessibility & Comfort</Text>
            <Text style={styles.badgeText}>{safeAccessibility.length}</Text>
          </View>
          <View style={styles.wrap}>
            {safeAccessibility.map((tag) => (
              <Chip key={tag} label={tag} />
            ))}
          </View>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.tabBar}>
          <Pressable
            onPress={() => setActiveEventTab('upcoming')}
            style={[styles.tabBtn, activeEventTab === 'upcoming' && styles.tabBtnActive]}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeEventTab === 'upcoming' && styles.tabBtnTextActive,
              ]}
            >
              Upcoming ({safeUpcoming.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveEventTab('hosted')}
            style={[styles.tabBtn, activeEventTab === 'hosted' && styles.tabBtnActive]}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeEventTab === 'hosted' && styles.tabBtnTextActive,
              ]}
            >
              Hosted ({safeHosted.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveEventTab('past')}
            style={[styles.tabBtn, activeEventTab === 'past' && styles.tabBtnActive]}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeEventTab === 'past' && styles.tabBtnTextActive,
              ]}
            >
              Past ({safePast.length})
            </Text>
          </Pressable>
        </View>

        <EventsCardList
          events={currentTabEvents}
          type={activeEventTab}
          onSelect={(id) => navigation.navigate('EventDetail', { id })}
        />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Badges</Text>
          <Text style={styles.badgeText}>
            {safeBadges.filter((b) => b.earned).length}/{safeBadges.length}
          </Text>
        </View>
        <BadgesGrid badges={safeBadges} />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Host Reviews</Text>
          <Text style={styles.badgeText}>{safeReviews.length}</Text>
        </View>
        <ReviewsList reviews={safeReviews} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg || '#F8F9FA',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: radii.md || 16,
    borderWidth: 1,
    borderColor: colors.border || '#E5E7EB',
    padding: 16,
    marginBottom: 12,
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
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: radii.sm || 8,
    padding: 3,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: (radii.sm || 8) - 2,
  },
  tabBtnActive: {
    backgroundColor: '#fff',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
  },
  tabBtnTextActive: {
    color: colors.text,
  },
  emptyHint: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
});