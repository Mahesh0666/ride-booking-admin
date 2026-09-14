import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import { DriverAuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
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
    <DriverAuthProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <RootNavigator />
      </NavigationContainer>
    </DriverAuthProvider>
  );
}

registerRootComponent(App);
