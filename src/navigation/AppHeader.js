import React from 'react';
import { Pressable, StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../components/common/Logo';
import { colors } from '../theme';

/**
 * Styling shared by every native stack header in the app.
 * Change the header look for the whole app from here.
 */
export const headerOptions = {
  headerStyle: { backgroundColor: colors.green },
  headerTintColor: '#fff',
  headerTitleAlign: 'center',
  headerShadowVisible: false,
};

/**
 * App logo used as the header title on the main tab screens.
 * Pass it to a screen with `headerTitle: () => <HeaderLogo />`.
 */
export default function HeaderLogo() {
  return <Logo />;
}

/** Notifications button for the tab header (top-left, beside the logo). */
export function HeaderNotificationsButton({ onPress, unreadCount = 0 }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Open notifications"
      style={({ pressed }) => [styles.leftBtn, pressed && styles.btnPressed]}
    >
      <Ionicons name="notifications-outline" size={24} color="#fff" />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/** Chats button for the tab header (top-right). */
export function HeaderChatsButton({ onPress }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Open chats"
      style={({ pressed }) => [styles.rightBtn, pressed && styles.btnPressed]}
    >
      <Ionicons name="chatbubbles-outline" size={24} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  leftBtn: {
    marginLeft: 14,
    padding: 6,
  },
  rightBtn: {
    marginRight: 14,
    padding: 6,
  },
  btnPressed: {
    opacity: 0.7,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
});
