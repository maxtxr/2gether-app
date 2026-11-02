import { View, Text } from 'react-native';
import { colors } from '../theme';

export default function Avatar({ label, size = 32, dark }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center',
      backgroundColor: dark ? colors.green : colors.chip, marginRight: 4,
    }}>
      <Text style={{ fontSize: size * 0.36, fontWeight: '700', color: dark ? '#fff' : colors.text }}>{label}</Text>
    </View>
  );
}

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
