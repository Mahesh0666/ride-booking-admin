import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import { DriverAuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { registerForPushNotifications, addNotificationListeners } from './src/services/pushNotificationService';

export default function App() {
  useEffect(() => {
    registerForPushNotifications();
    const cleanup = addNotificationListeners();
    return cleanup;
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
