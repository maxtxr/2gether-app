import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../../theme';
import { Avatar, Stars } from '../../components';

export function ProfileHeader({
  user,
  onEditPress,
  onSettingsPress,
}) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatarWrap}>
          <Avatar source={user?.avatarUrl} name={user?.name} size={74} />
        </View>

        <View style={styles.profileMeta}>
          <View style={styles.nameRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {user?.name || 'Anonymous User'}
              </Text>
              {!!user?.email && <Text style={styles.emailText}>{user.email}</Text>}
            </View>

            <Pressable
              onPress={onSettingsPress}
              hitSlop={8}
              style={styles.settingsIconBtn}
              accessibilityRole="button"
              accessibilityLabel="Settings"
            >
              <Ionicons name="settings-outline" size={21} color={colors.text} />
            </Pressable>
          </View>

          {user?.bio ? (
            <Text style={styles.bio} numberOfLines={2}>
              {user.bio}
            </Text>
          ) : (
            <Text style={styles.bioEmpty}>Add a bio to let others know you...</Text>
          )}

          {user?.since && (
            <View style={styles.sinceBadge}>
              <Ionicons name="calendar-outline" size={12} color={colors.muted} />
              <Text style={styles.since}>Member since {user.since}</Text>
            </View>
          )}
        </View>
      </View>

      <Pressable
        onPress={onEditPress}
        style={({ pressed }) => [styles.editBtn, pressed && styles.btnPressed]}
        accessibilityRole="button"
      >
        <Ionicons name="pencil-outline" size={14} color={colors.text} />
        <Text style={styles.editBtnText}>Edit Profile</Text>
      </Pressable>
    </View>
  );
}

export function StatsRow({ joinedCount = 0, hostedCount = 0, rating }) {
  const ratingText = rating == null ? '—' : Number(rating).toFixed(1);
  return (
    <View style={styles.statsCard}>
      <View style={styles.statItem}>
        <View style={styles.statValGroup}>
          <Ionicons
            name="checkmark-done-circle-outline"
            size={16}
            color={colors.green || '#16A34A'}
          />
          <Text style={styles.statNum}>{joinedCount}</Text>
        </View>
        <Text style={styles.statDesc}>Joined</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <View style={styles.statValGroup}>
          <Ionicons name="sparkles-outline" size={15} color={colors.green || '#16A34A'} />
          <Text style={styles.statNum}>{hostedCount}</Text>
        </View>
        <Text style={styles.statDesc}>Hosted</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <View style={styles.statValGroup}>
          <Ionicons name="star" size={14} color="#F59E0B" />
          <Text style={styles.statNum}>{ratingText}</Text>
        </View>
        <Text style={styles.statDesc}>Rating</Text>
      </View>
    </View>
  );
}

export function PendingReviewBanner({ event, onReview }) {
  if (!event) return null;
  return (
    <View style={styles.pendingReviewBanner}>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <View style={styles.pendingReviewBadge}>
          <Ionicons name="time-outline" size={12} color="#D97706" />
          <Text style={styles.pendingReviewBadgeText}>Needs Review</Text>
        </View>
        <Text style={styles.pendingTitle} numberOfLines={1}>
          How was "{event.title}"?
        </Text>
        <Text style={styles.pendingSubtitle}>Help your host and future attendees</Text>
      </View>
      <Pressable
        style={styles.reviewCtaBtn}
        onPress={() => onReview(event)}
        accessibilityRole="button"
      >
        <Text style={styles.reviewCtaText}>Rate</Text>
      </Pressable>
    </View>
  );
}

export function ReviewsCompletedBanner() {
  return (
    <View style={styles.reviewsCompletedBanner}>
      <View style={styles.completedIcon}>
        <Ionicons name="checkmark-done" size={18} color="#16A34A" />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.completedTitle}>All reviews up to date!</Text>
        <Text style={styles.completedSubtitle}>
          You've reviewed all your past events. Thanks for sharing your feedback!
        </Text>
      </View>
    </View>
  );
}

export function EventsCardList({ events = [], type = 'upcoming', onSelect }) {
  if (events.length === 0) {
    const emptyMessages = {
      upcoming: 'No upcoming events. Find something to join!',
      hosted: 'You have not hosted any events yet.',
      past: 'No past activity recorded yet.',
    };
    return <Text style={styles.emptyHint}>{emptyMessages[type] || 'No events.'}</Text>;
  }

  return events.map((e, index) => {
    const isLast = index === events.length - 1;
    return (
      <Pressable
        key={e.id}
        onPress={() => onSelect(e.id)}
        style={({ pressed }) => [
          styles.eventItem,
          !isLast && styles.rowDivider,
          pressed && styles.btnPressed,
        ]}
      >
        <View
          style={[
            styles.eventIcon,
            type === 'hosted' && { backgroundColor: '#3B82F6' },
            type === 'past' && { backgroundColor: '#6B7280' },
          ]}
        >
          <Ionicons
            name={
              type === 'hosted'
                ? 'person'
                : type === 'past'
                ? 'checkmark'
                : 'calendar'
            }
            size={12}
            color="#fff"
          />
        </View>

        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={styles.titleMetaRow}>
            <Text style={styles.eventHeading} numberOfLines={1}>
              {e.title}
            </Text>
            {!!e.level && <Text style={styles.levelTag}>{e.level}</Text>}
          </View>
          <Text style={styles.eventTimePlace}>
            {e.short || e.when}
            {e.area || e.place ? ` · ${e.area || e.place}` : ''}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.muted} />
      </Pressable>
    );
  });
}

export function BadgesGrid({ badges = [] }) {
  if (badges.length === 0) {
    return <Text style={styles.emptyHint}>No badges available yet.</Text>;
  }
  return (
    <View style={styles.badgeGrid}>
      {badges.map((b) => (
        <View key={b.id} style={[styles.badgeItem, !b.earned && styles.badgeLocked]}>
          <Text style={{ fontSize: 26 }}>{b.earned ? b.icon : '🔒'}</Text>
          <Text style={styles.badgeTitle} numberOfLines={1}>
            {b.name}
          </Text>
          <Text style={styles.badgeSub} numberOfLines={2}>
            {b.earned ? 'Earned' : b.hint}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function ReviewsList({ reviews = [] }) {
  if (reviews.length === 0) {
    return (
      <Text style={styles.emptyHint}>
        Reviews on events you host will appear here.
      </Text>
    );
  }
  return reviews.map((r) => (
    <View key={r.id} style={styles.reviewBubble}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewAuthor}>{r.author || 'Guest'}</Text>
        <Stars rating={r.rating} size={12} />
      </View>
      {!!r.eventTitle && <Text style={styles.reviewTitle}>{r.eventTitle}</Text>}
      {!!r.content && <Text style={styles.reviewText}>{r.content}</Text>}
    </View>
  ));
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: radii.md || 16,
    borderWidth: 1,
    borderColor: colors.border || '#E5E7EB',
    padding: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
  },
  avatarWrap: {
    position: 'relative',
  },
  profileMeta: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  emailText: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 1,
  },
  settingsIconBtn: {
    padding: 4,
    marginLeft: 8,
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
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: radii.pill || 999,
    borderWidth: 1,
    borderColor: colors.border || '#E5E7EB',
    paddingVertical: 9,
    marginTop: 14,
    gap: 6,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: radii.md || 16,
    borderWidth: 1,
    borderColor: colors.border || '#E5E7EB',
    paddingVertical: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    backgroundColor: colors.border || '#E5E7EB',
  },
  pendingReviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radii.md || 16,
    padding: 14,
    marginBottom: 12,
  },
  pendingReviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  pendingReviewBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
    textTransform: 'uppercase',
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  pendingSubtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 1,
  },
  reviewCtaBtn: {
    backgroundColor: '#D97706',
    borderRadius: radii.pill || 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  reviewCtaText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border || '#E5E7EB',
  },
  eventIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.green || '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 6,
  },
  levelTag: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.muted,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  eventTimePlace: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  badgeItem: {
    width: '31%',
    margin: '1%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border || '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  badgeLocked: {
    opacity: 0.35,
  },
  badgeTitle: {
    fontWeight: '700',
    fontSize: 11,
    color: colors.text,
    marginTop: 6,
    textAlign: 'center',
  },
  badgeSub: {
    fontSize: 10,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 2,
  },
  reviewBubble: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border || '#E5E7EB',
    padding: 10,
    marginTop: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewAuthor: {
    fontWeight: '700',
    fontSize: 13,
    color: colors.text,
  },
  reviewTitle: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  reviewText: {
    color: colors.text,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  emptyHint: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  btnPressed: {
    opacity: 0.65,
  },
  reviewsCompletedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: radii.md || 16,
    padding: 14,
    marginBottom: 12,
  },
  completedIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  completedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803D',
  },
  completedSubtitle: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
});