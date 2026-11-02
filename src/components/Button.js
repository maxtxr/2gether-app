import { Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export default function Button({ title, onPress, variant = 'primary', icon, disabled, style }) {
  const v = variant;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={[styles.base, v === 'primary' && styles.primary, v === 'outline' && styles.outline,
        v === 'danger' && styles.danger, disabled && styles.disabled, style]}
    >
      {icon && <Ionicons name={icon} size={18} color={v === 'primary' ? '#fff' : v === 'danger' ? colors.danger : colors.green} style={{ marginRight: 8 }} />}
      <Text style={[styles.text, v !== 'primary' && { color: v === 'danger' ? colors.danger : colors.green }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 24, minHeight: 48 },
  primary: { backgroundColor: colors.orange },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.green },
  danger: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.danger },
  disabled: { opacity: 0.45 },
  text: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
