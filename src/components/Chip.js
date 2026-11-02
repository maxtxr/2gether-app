import { Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

export default function Chip({ label, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={[styles.chip, selected && styles.selected]}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, minHeight: 40, justifyContent: 'center',
    backgroundColor: colors.chip, marginRight: 8, marginBottom: 8,
  },
  selected: { backgroundColor: colors.green },
  text: { color: colors.text, fontSize: 14 },
  textSelected: { color: '#fff', fontWeight: '600' },
});
