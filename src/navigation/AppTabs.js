import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useApp } from '../context/AppContext';
import { colors } from '../theme';
import HeaderLogo, {
  headerOptions,
  HeaderNotificationsButton,
  HeaderChatsButton,
} from './AppHeader';

import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import MyEventsScreen from '../screens/MyEventsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

/** Label and icons for each bottom tab, keyed by route name. */
export const TABS = {
  Home: { label: 'Home', icon: 'home-outline', iconOn: 'home' },
  Search: { label: 'Search', icon: 'search-outline', iconOn: 'search' },
  Create: { label: 'Create', icon: 'add', iconOn: 'add' },
  MyEvents: { label: 'Events', icon: 'calendar-outline', iconOn: 'calendar' },
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

// Orange fill diameter (pre-border). Border is added outside so the + stays this size.
const CREATE_SIZE = 58;
const CREATE_BORDER = 5;
const CREATE_OUTER = CREATE_SIZE + CREATE_BORDER * 2;

// Height of the bar itself (the bottom safe-area inset is added on top of it).
const TAB_BAR_HEIGHT = 60;

const SHOW_LABELS = true;

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

/** Giant orange + in the centre of the tab bar → Create event. */
function CreateTabIcon() {
  return (
    <View style={styles.createBtn}>
      <Ionicons name="add" size={36} color="#fff" />
    </View>
  );
}

/** Dummy screen — Create tab never stays focused; it opens CreateEvent. */
function CreatePlaceholder() {
  return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
}

export default function AppTabs() {
  const { unreadCount } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => {
        const config = TABS[route.name];
        const isCreate = route.name === 'Create';

        return {
          ...headerOptions,
          headerTitle: () => <HeaderLogo />,
          headerLeft: () => (
            <HeaderNotificationsButton
              unreadCount={unreadCount}
              onPress={() =>
                navigation.getParent()?.navigate('Notifications')
              }
            />
          ),
          headerRight: () => (
            <HeaderChatsButton
              onPress={() => navigation.getParent()?.navigate('Chats')}
            />
          ),
          tabBarLabel: isCreate ? () => null : config.label,
          tabBarShowLabel: SHOW_LABELS,
          tabBarLabelPosition: 'below-icon',
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#B9CFC5',
          tabBarStyle: [
            styles.tabBar,
            { height: TAB_BAR_HEIGHT + insets.bottom },
          ],
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarIconStyle: isCreate
            ? {
                width: CREATE_OUTER,
                height: CREATE_OUTER,
                marginTop: -18,
              }
            : {
                ...ICON_BOX,
                marginTop: SHOW_LABELS ? undefined : ICON_TOP_MARGIN,
              },
          tabBarAllowFontScaling: false,
          tabBarIcon: ({ focused, color }) =>
            isCreate ? (
              <CreateTabIcon />
            ) : (
              <TabIcon focused={focused} color={color} config={config} />
            ),
        };
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={ExploreScreen} />
      <Tab.Screen
        name="Create"
        component={CreatePlaceholder}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.getParent()?.navigate('CreateEvent');
          },
        })}
        options={{
          tabBarAccessibilityLabel: 'Create event',
        }}
      />
      <Tab.Screen name="MyEvents" component={MyEventsScreen} />
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
    textAlign: 'center',
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
  createBtn: {
    width: CREATE_OUTER,
    height: CREATE_OUTER,
    borderRadius: CREATE_OUTER / 2,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: CREATE_BORDER,
    borderColor: colors.green,
  },
});
