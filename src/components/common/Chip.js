import { Pressable, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
        <MaterialCommunityIcons
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
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 0,
    borderRadius: radii.pill,
    height: 36,
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
    fontSize: 13,
    fontWeight: '500',
  },
  textSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});