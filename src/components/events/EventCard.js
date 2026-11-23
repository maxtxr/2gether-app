import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme';
import { useApp, eventHasEnded } from '../../context/AppContext';
import ConfirmModal from '../common/ConfirmModal';
import { EVENT_CATEGORIES } from '../../data/options';

export default function EventCard({ event, onPress, right }) {
  const { goingIds = [], hostedIds = [], joinEvent } = useApp();
  const going = goingIds.includes(event.id);
  const hosting = hostedIds.includes(event.id);

  const categoryIcon = EVENT_CATEGORIES.find(
    (category) => category.name === event.category
  )?.icon;

  const [confirmJoin, setConfirmJoin] = useState(false);
  const [result, setResult] = useState(null);

  const quickJoin = async () => {
    setConfirmJoin(false);
    try {
      await joinEvent(event.id);
      setResult({
        title: "You're going!",
        message: `You joined ${event.title}. See you there!`,
      });
    } catch (error) {
      setResult({
        title: 'Something went wrong',
        message: error.message || 'Could not join the event. Please try again.',
        variant: 'danger',
      });
    }
  };

  const where = [event.place, event.area].filter(Boolean).join(' · ');

  return (
    <View style={styles.card}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`View details for ${event.title}`}
        style={({ pressed }) => [styles.main, pressed && styles.cardPressed]}
      >
        {/* Sport Category Icon Container */}
        <View style={styles.categoryIconBox}>
          <MaterialCommunityIcons
            name={event.icon || categoryIcon || 'calendar-star'}
            size={22}
            color={colors.green || '#16A34A'}
          />
        </View>

        {/* Main Details */}
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={13} color={colors.muted} />
            <Text style={styles.metaText}>{event.short || event.date || event.when}</Text>
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color={colors.muted} />
            <Text style={styles.metaText} numberOfLines={1}>
              {event.area || event.place || 'TBD'}
            </Text>
            {!!event.level && (
              <View style={styles.levelRow}>
                <Text style={styles.bullet}>{'\u00B7'}</Text>
                <View style={styles.levelTag}>
                  <Text style={styles.levelText}>{event.level}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Accessibility Tag if present */}
          {event.accessibilityTag && (
            <View style={styles.accessibilityRow}>
              <Ionicons name="accessibility-outline" size={12} color={colors.green || '#16A34A'} />
              <Text style={styles.accessibilityText}>{event.accessibilityTag}</Text>
            </View>
          )}
        </View>
      </Pressable>

      {/* Status or Join Action */}
      <View style={styles.actionContainer}>
        {right ? (
          right
        ) : hosting ? (
          <View style={[styles.badge, styles.badgeHosting]}>
            <Text style={styles.badgeText}>{eventHasEnded(event) ? 'Hosted' : 'Hosting'}</Text>
          </View>
        ) : going ? (
          <View style={[styles.badge, styles.badgeGoing]}>
            <Text style={styles.badgeText}>Going</Text>
          </View>
        ) : (
          <Pressable
            onPress={() => setConfirmJoin(true)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Join ${event.title}`}
            style={({ pressed }) => [styles.joinButton, pressed && styles.joinButtonPressed]}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </Pressable>
        )}
      </View>

      <ConfirmModal
        visible={confirmJoin}
        title={`Join ${event.title}?`}
        message={[event.short || event.when, where].filter(Boolean).join('\n')}
        confirmText="Join"
        cancelText="Not now"
        onConfirm={quickJoin}
        onCancel={() => setConfirmJoin(false)}
      />

      <ConfirmModal
        visible={!!result}
        title={result?.title}
        message={result?.message}
        variant={result?.variant}
        onConfirm={() => setResult(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md || 16,
    padding: spacing.md || 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border || '#E5E7EB',
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardPressed: {
    opacity: 0.65,
  },
  categoryIconBox: {
    width: 44,
    height: 44,
    borderRadius: radii.sm || 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  title: {
    fontWeight: '700',
    color: colors.text,
    fontSize: 14.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaText: {
    color: colors.muted,
    fontSize: 12,
    marginLeft: 4,
    flexShrink: 1,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bullet: {
    color: colors.muted,
    marginHorizontal: 5,
    fontSize: 10,
  },
  levelTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  levelText: {
    fontSize: 10.5,
    color: colors.muted,
    fontWeight: '600',
  },
  accessibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  accessibilityText: {
    fontSize: 11,
    color: colors.green || '#16A34A',
    fontWeight: '600',
  },
  actionContainer: {
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 54,
  },
  joinButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.orange || '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinButtonPressed: {
    opacity: 0.75,
  },
  badge: {
    minWidth: 56,
    height: 28,
    borderRadius: radii.pill || 999,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeGoing: {
    backgroundColor: colors.green || '#16A34A',
  },
  badgeHosting: {
    backgroundColor: colors.orange || '#F97316',
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
});