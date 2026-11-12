import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

export default function Stars({ rating = 0, onChange, size = 32, readOnly = false }) {
  return (
    <View style={styles.container} accessibilityRole={readOnly ? 'text' : 'adjustable'}>
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const isFilled = starIndex <= Math.round(rating);
        return (
          <Pressable
            key={starIndex}
            disabled={readOnly || !onChange}
            onPress={() => onChange?.(starIndex)}
            accessibilityLabel={`${starIndex} of 5 stars`}
            hitSlop={6}
            style={styles.starPressable}
          >
            <Ionicons
              name={isFilled ? 'star' : 'star-outline'}
              size={size}
              color={colors.orange}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starPressable: {
    padding: 3,
  },
});