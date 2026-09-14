import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { RideProvider } from './src/context/RideContext';
import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    const initPush = async () => {
      try {
        const { registerForPushNotifications, addNotificationListeners } = await import('./src/services/pushNotificationService');
        registerForPushNotifications();
        addNotificationListeners();
      } catch (e) {
        console.warn('Push notifications not available in Expo Go');
      }
    };
    initPush();
  }, []);

  return (
    <AuthProvider>
      <RideProvider>
        <NavigationContainer ref={navigationRef}>
          <StatusBar style="dark" />
          <RootNavigator />
        </NavigationContainer>
      </RideProvider>
    </AuthProvider>
  );
}

registerRootComponent(App);
