
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
import ChatScreen from './src/screens/ChatScreen';
import CreateEventScreen from './src/screens/CreateEventScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import EventChatsScreen from './src/screens/EventChatsScreen';

const Stack = createNativeStackNavigator();

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

function Root() {
  // Obter o utilizador e o estado de carregamento do Supabase
  const { user, authLoading } = useApp();

  // Esperar pela verificação da sessão antes de mostrar os ecrãs
  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.green }}>
        <StatusBar style="light" />
      </View>
    );
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
  // Preload the icon font up front
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
