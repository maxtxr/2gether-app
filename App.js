import { View, Alert, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

import { AppProvider, useApp } from './src/context/AppContext';
import { colors } from './src/theme';
import { AppTabs, headerOptions } from './src/navigation';

import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import CreateEventScreen from './src/screens/CreateEventScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import EventChatsScreen from './src/screens/EventChatsScreen'; //???
import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import LegalScreen from './src/screens/LegalScreen';
import SplashScreen from './src/components/common/SplashScreen';

const Stack = createNativeStackNavigator();

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

function Root() {
  const { user, authLoading } = useApp();

  // Show the animated branded splash screen while checking session credentials
  if (authLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />

      {user ? (
        <Stack.Navigator screenOptions={headerOptions}>
          <Stack.Screen
            name="Tabs"
            component={AppTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EventDetail"
            component={EventDetailScreen}
            options={{ title: 'Event' }}
          />
          <Stack.Screen
            name="EventChats"
            component={EventChatsScreen}
            options={{ title: 'Event chats' }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ title: 'Chat' }}
          />
          <Stack.Screen
            name="Chats"
            component={ChatListScreen}
            options={{ title: 'Chats' }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ title: 'Notifications' }}
          />
          <Stack.Screen
            name="CreateEvent"
            component={CreateEventScreen}
            options={{ title: 'Create event' }}
          />
          <Stack.Screen
            name="Review"
            component={ReviewScreen}
            options={{ title: 'Review' }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Settings' }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ title: 'Edit Profile' }}
          />
          <Stack.Screen
            name="UserProfile"
            component={UserProfileScreen}
            options={({ route }) => ({
              title: route.params?.name || 'Profile',
            })}
          />
          <Stack.Screen
            name="Legal"
            component={LegalScreen}
            options={{ title: 'Legal Information' }}
          />
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
  const [fontsLoaded, fontError] = useFonts(Ionicons.font);

  // Show splash screen while preloading icon fonts
  if (!fontsLoaded && !fontError) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <Root />
      </AppProvider>
    </SafeAreaProvider>
  );
}