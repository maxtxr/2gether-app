import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export default function Stars({ rating, onChange, size = 34 }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} disabled={!onChange} onPress={() => onChange?.(n)} accessibilityLabel={`${n} stars`} style={{ padding: 2 }}>
          <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={size} color={colors.orange} />
        </Pressable>
      ))}
    </View>
  );
}
