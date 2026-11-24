import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Logo from './Logo';
import { colors } from '../../theme';

export default function SplashScreen() {
  const scale = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const dotProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Entrance animation: scale up + fade in
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Gentle looping breathing pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.05,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    // 3. Looping progress animation for the loading bar
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotProgress, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dotProgress, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scale, opacity, pulse, dotProgress]);

  const combinedScale = Animated.multiply(scale, pulse);

  const dotScale = dotProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 1],
  });

  const dotOpacity = dotProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Centered Logo & Branding */}
      <Animated.View
        style={[
          styles.centerBlock,
          {
            opacity,
            transform: [{ scale: combinedScale }],
          },
        ]}
      >
        <Logo size={120} />
        <Text style={styles.title}>2Gether</Text>
        <Text style={styles.tagline}>Find what fits. Go together.</Text>
      </Animated.View>

      {/* Minimalistic animated activity indicator */}
      <View style={styles.loaderContainer}>
        <Animated.View
          style={[
            styles.indicatorBar,
            {
              transform: [{ scaleX: dotScale }],
              opacity: dotOpacity,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.green || '#1B4332',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerBlock: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.2,
    marginTop: 18,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500',
    marginTop: 6,
    letterSpacing: 0.3,
  },
  loaderContainer: {
    position: 'absolute',
    bottom: 54,
    width: 64,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    alignItems: 'center',
  },
  indicatorBar: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.orange || '#FF7A00',
    borderRadius: 2,
  },
});