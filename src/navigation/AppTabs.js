import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useApp } from '../context/AppContext';
import { colors } from '../theme';
import HeaderLogo, { headerOptions } from './AppHeader';

import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import MyEventsScreen from '../screens/MyEventsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

/** Label and icons for each bottom tab, keyed by route name. */
export const TABS = {
  Home: { label: 'Home', icon: 'home-outline', iconOn: 'home' },
  Search: { label: 'Search', icon: 'search-outline', iconOn: 'search' },
  MyEvents: { label: 'My events', icon: 'calendar-outline', iconOn: 'calendar' },
  Notifications: { label: 'Notifications', icon: 'notifications-outline', iconOn: 'notifications' },
  Profile: { label: 'Profile', icon: 'person-outline', iconOn: 'person' },
};

// React Navigation renders every tab icon inside a fixed box (31x28 by
// default) and clips anything that does not fit. Android clips strictly, so a
// wider icon (e.g. one with lots of horizontal padding) disappears completely.
// We declare the box explicitly; it is square so the focused highlight is a
// circle of `ICON_CIRCLE_SIZE` diameter.
const ICON_CIRCLE_SIZE = 36;
const ICON_BOX = { width: ICON_CIRCLE_SIZE, height: ICON_CIRCLE_SIZE };
const ICON_SIZE = 22;

// Height of the bar itself (the bottom safe-area inset is added on top of it).
// Raise/lower this to give the icons more or less breathing room.
const TAB_BAR_HEIGHT = 60;

// Icon-only tab bar for now. Set to true to show the labels again.
const SHOW_LABELS = false;

// React Navigation pads each tab by 5px and aligns its content to the top, so
// add the leftover space as a top margin to sit the icon in the middle.
const TAB_ITEM_PADDING = 5;
const ICON_TOP_MARGIN = Math.max(
  0,
  (TAB_BAR_HEIGHT - (ICON_CIRCLE_SIZE + TAB_ITEM_PADDING * 2)) / 2
);

function TabIcon({ focused, color, config }) {
  return (
    <View style={[styles.iconCircle, focused && styles.iconCircleActive]}>
      <Ionicons
        name={focused ? config.iconOn : config.icon}
        size={ICON_SIZE}
        color={color}
      />
    </View>
  );
}

export default function AppTabs() {
  const { unreadCount } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const config = TABS[route.name];

        return {
          ...headerOptions,
          headerTitle: () => <HeaderLogo />,
          tabBarLabel: config.label,
          // Kept for accessibility/screen readers even when hidden.
          tabBarShowLabel: SHOW_LABELS,
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#B9CFC5',
          tabBarStyle: [styles.tabBar, { height: TAB_BAR_HEIGHT + insets.bottom }],
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarIconStyle: {
            ...ICON_BOX,
            marginTop: SHOW_LABELS ? undefined : ICON_TOP_MARGIN,
          },
          // Keep labels at a fixed size: scaled-up labels on Android squeeze
          // the icon out of the tab bar.
          tabBarAllowFontScaling: false,
          tabBarIcon: ({ focused, color }) => (
            <TabIcon focused={focused} color={color} config={config} />
          ),
        };
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={ExploreScreen} />
      <Tab.Screen name="MyEvents" component={MyEventsScreen} />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ tabBarBadge: unreadCount > 0 ? unreadCount : undefined }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.green,
    borderTopWidth: 0,
    paddingTop: 0,
  },
  tabBarLabel: {
    fontSize: 11,
  },
  iconCircle: {
    width: ICON_CIRCLE_SIZE,
    height: ICON_CIRCLE_SIZE,
    borderRadius: ICON_CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleActive: {
    backgroundColor: colors.greenLight,
  },
});
