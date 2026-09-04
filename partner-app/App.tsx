import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import { DriverAuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { StatusBar } from 'expo-status-bar';

export default function App() {
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
