import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme';
import { useApp, eventHasEnded } from '../../context/AppContext';
import ConfirmModal from '../common/ConfirmModal';

export default function EventCard({ event, onPress, right }) {
  const { goingIds = [], hostedIds = [], joinEvent } = useApp();
  const going = goingIds.includes(event.id);
  const hosting = hostedIds.includes(event.id);

  // Inscrição rápida pelo "+": pergunta primeiro, depois mostra o resultado
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
          name={event.icon || 'calendar-star'}
          size={24}
          color={colors.green}
        />
      </View>

      {/* Main Details */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.muted} />
          <Text style={styles.metaText}>{event.short || event.date}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={colors.muted} />
          {/* Zona do evento; eventos antigos sem zona mostram o local */}
          <Text style={styles.metaText} numberOfLines={1}>{event.area || event.place}</Text>
          <Text style={styles.bullet}>•</Text>
          <View style={styles.levelTag}>
            <Text style={styles.levelText}>{event.level || 'All levels'}</Text>
          </View>
        </View>

        {/* Accessibility Tag if present (António/Senior requirement) */}
        {event.accessibilityTag && (
          <View style={styles.accessibilityRow}>
            <Ionicons name="accessibility-outline" size={12} color={colors.green} />
            <Text style={styles.accessibilityText}>{event.accessibilityTag}</Text>
          </View>
        )}
      </View>
      </Pressable>

      {/* Status or Join Action (or a custom trailing element like the Review button) */}
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
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm + 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.995 }],
  },
  categoryIconBox: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    fontWeight: '700',
    color: colors.text,
    fontSize: 15,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaText: {
    color: colors.muted,
    fontSize: 12,
    marginLeft: spacing.xs,
    flexShrink: 1,
  },
  bullet: {
    color: colors.muted,
    marginHorizontal: 4,
    fontSize: 10,
  },
  levelTag: {
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  levelText: {
    fontSize: 11,
    color: colors.primary,
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
    color: colors.green,
    fontWeight: '600',
  },
  actionContainer: {
    marginLeft: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 58,
  },

  joinButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },

  joinButtonPressed: {
    opacity: 0.8,
  },

  badge: {
    minWidth: 58,
    height: 32,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  badgeGoing: {
    backgroundColor: colors.green,
  },

  badgeHosting: {
    backgroundColor: colors.orange,
  },

  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
});