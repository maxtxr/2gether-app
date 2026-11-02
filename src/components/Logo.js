import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export default function Logo({ size = 34 }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#0A5A3F', alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="people" size={size * 0.62} color={colors.orange} />
    </View>
  );
}
