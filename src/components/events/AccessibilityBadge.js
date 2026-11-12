import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme';

const ICONS = {
  'Wheelchair friendly': 'wheelchair-outline',
  'Flat terrain': 'walk-outline',
  'Low intensity': 'leaf-outline',
  'All ages': 'people-outline',
};

/**
 * Pill badge highlighting an accessibility feature of an event
 * (e.g. "Flat terrain", "Wheelchair friendly", "All ages").
 */
export default function AccessibilityBadge({ label, size = 'md' }) {
  if (!label) return null;
  const small = size === 'sm';

  return (
    <View style={[styles.badge, small && styles.badgeSm]}>
      <Ionicons
        name={ICONS[label] || 'accessibility-outline'}
        size={small ? 12 : 14}
        color={colors.green}
      />
      <Text style={[styles.text, small && styles.textSm]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.chip,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    gap: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.green,
  },
  textSm: {
    fontSize: 11,
  },
});
