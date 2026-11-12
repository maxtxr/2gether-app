import { View, Alert, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

import { AppProvider, useApp } from './src/context/AppContext';
import { colors } from './src/theme';
import { Logo } from './src/components';

import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ForYouScreen from './src/screens/ForYouScreen';
import ExploreScreen from './src/screens/ExploreScreen';
import MyEventsScreen from './src/screens/MyEventsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import ChatScreen from './src/screens/ChatScreen';
import CreateEventScreen from './src/screens/CreateEventScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// react-native-web ships a no-op Alert.alert, which makes validation and
// confirmations look dead in the browser. Route them to the browser instead.
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  Alert.alert = (title, message, buttons) => {
    const text = message ? `${title}\n\n${message}` : title;
    if (Array.isArray(buttons) && buttons.length) {
      const primary = buttons.find((b) => b.style !== 'cancel');
      if (primary && primary.onPress) {
        if (window.confirm(text)) primary.onPress();
      } else {
        window.alert(text);
      }
    } else {
      window.alert(text);
    }
  };
}

const TABS = {
  ForYou: { label: 'For you', icon: 'sparkles-outline', iconOn: 'sparkles' },
  Search: { label: 'Search', icon: 'search-outline', iconOn: 'search' },
  MyEvents: { label: 'My events', icon: 'calendar-outline', iconOn: 'calendar' },
  Notifications: { label: 'Notifications', icon: 'notifications-outline', iconOn: 'notifications' },
  Profile: { label: 'Profile', icon: 'person-outline', iconOn: 'person' },
};

const headerOptions = {
  headerStyle: { backgroundColor: colors.green },
  headerTintColor: '#fff',
  headerTitleAlign: 'center',
  headerShadowVisible: false,
};

function Tabs() {
  const { unreadCount } = useApp();
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const t = TABS[route.name];
        return {
          ...headerOptions,
          headerTitle: () => <Logo />,
          tabBarLabel: t.label,
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: '#B9CFC5',
          // The library treats `height` as the FULL bar height and carves the
          // safe-area inset out of it, so add the inset or icons get clipped
          // on phones with a home indicator / gesture bar.
          tabBarStyle: { backgroundColor: colors.green, borderTopWidth: 0, height: 66 + insets.bottom, paddingTop: 6 },
          tabBarLabelStyle: { fontSize: 11 },
          tabBarIcon: ({ focused, color }) => (
            <View style={{
              paddingHorizontal: 14, paddingVertical: 3, borderRadius: 14,
              backgroundColor: focused ? colors.greenLight : 'transparent',
            }}>
              <Ionicons name={focused ? t.iconOn : t.icon} size={22} color={color} />
            </View>
          ),
        };
      }}
    >
      <Tab.Screen name="ForYou" component={ForYouScreen} />
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

function Root() {
  const { user } = useApp();
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      {user ? (
        <Stack.Navigator screenOptions={headerOptions}>
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: 'Event' }} />
          <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Group chat' }} />
          <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'Create event' }} />
          <Stack.Screen name="Review" component={ReviewScreen} options={{ title: 'Review' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

export default function App() {
  // Preload the icon font up front so tab/header/button icons are guaranteed
  // to render (icons can show up blank on device while the font is loading).
  const [fontsLoaded, fontError] = useFonts(Ionicons.font);
  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: colors.green }} />;
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <Root />
      </AppProvider>
    </SafeAreaProvider>
  );
}
