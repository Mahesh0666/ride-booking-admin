import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { RideProvider } from './src/context/RideContext';
import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';
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
