import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { AppProvider, useApp } from './src/context/AppContext';
import { colors } from './src/theme';
import Logo from './src/components/Logo';

import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
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

const TABS = {
  Explore: { label: 'Explore', icon: 'compass-outline', iconOn: 'compass' },
  MyEvents: { label: 'My events', icon: 'calendar-outline', iconOn: 'calendar' },
  Alerts: { label: 'Alerts', icon: 'notifications-outline', iconOn: 'notifications' },
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
          tabBarStyle: { backgroundColor: colors.green, borderTopWidth: 0, height: 66, paddingTop: 6 },
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
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="MyEvents" component={MyEventsScreen} />
      <Tab.Screen
        name="Alerts"
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
  return (
    <SafeAreaProvider>
      <AppProvider>
        <Root />
      </AppProvider>
    </SafeAreaProvider>
  );
}
