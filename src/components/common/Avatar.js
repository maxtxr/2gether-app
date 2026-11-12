import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../../theme';

export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export default function Avatar({ source, name = '', label, size = 40, dark = false, style }) {
  const displayText = label || initials(name);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: dark ? colors.green : colors.chip,
        },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={name || label || 'User avatar'}
    >
      {source ? (
        <Image
          source={typeof source === 'string' ? { uri: source } : source}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <Text
          style={[
            styles.initials,
            { fontSize: Math.max(12, size * 0.38), color: dark ? '#FFFFFF' : colors.text },
          ]}
        >
          {displayText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    fontWeight: '700',
  },
});