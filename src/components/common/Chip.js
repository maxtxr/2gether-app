import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme';

export default function Chip({ label, icon, selected, onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={16}
          color={selected ? '#FFFFFF' : colors.text}
          style={styles.icon}
        />
      )}
      <Text style={[styles.text, selected && styles.textSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.pill,
    minHeight: 40,
    backgroundColor: colors.chip,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  selected: {
    backgroundColor: colors.green,
  },
  pressed: {
    opacity: 0.8,
  },
  icon: {
    marginRight: spacing.xs + 2,
  },
  text: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  textSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});