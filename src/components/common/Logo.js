import React from 'react';
import { Image } from 'react-native';

/**
 * App logo, rendered from assets/icon.png so the same mark is used
 * on every screen (auth headers, tab headers, etc).
 */
export default function Logo({ size = 38 }) {
  return (
    <Image
      source={require('../../../assets/icon.png')}
      style={{ width: size, height: size }}
      accessibilityRole="image"
      accessibilityLabel="2Gether app logo"
    />
  );
}
