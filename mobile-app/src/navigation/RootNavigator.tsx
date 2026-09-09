import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/config';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import RideStatusScreen from '../screens/RideStatusScreen';
import RideHistoryScreen from '../screens/RideHistoryScreen';
import BookingsScreen from '../screens/BookingsScreen';
import OffersScreen from '../screens/OffersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ReceiptsScreen from '../screens/ReceiptsScreen';
import PaymentMethodsScreen from '../screens/PaymentMethodsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import SavedAddressesScreen from '../screens/SavedAddressesScreen';
import SOSScreen from '../screens/SOSScreen';
import RatingScreen from '../screens/RatingScreen';
import PickLocationScreen from '../screens/PickLocationScreen';
import TermsGateScreen from '../screens/TermsGateScreen';
import LegalScreen from '../screens/LegalScreen';
import ScheduleRideScreen from '../screens/ScheduleRideScreen';
import WalletScreen from '../screens/WalletScreen';
import ActiveRideCard from '../components/ActiveRideCard';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  RideStatus: { rideId?: string; pickup?: any; dropoff?: any; vehicleType?: string; fareEstimate?: number; paymentMethod?: string };
  RideHistory: undefined;
  Bookings: undefined;
  BookingsList: undefined;
  Offers: undefined;
  Profile: undefined;
  Receipts: undefined;
  PaymentMethods: undefined;
  Notifications: undefined;
  HelpSupport: undefined;
  SavedAddresses: undefined;
  SOS: { rideId?: string };
  Rating: { rideId: string };
  PickLocation: { mode: 'pickup' | 'dropoff'; initial?: any };
  Legal: { doc?: string };
  TermsGate: undefined;
  TermsLegal: { doc?: string };
  ScheduleRide: undefined;
  Wallet: undefined;
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

const tabIcon = (label: string) => ({ color }: any) => {
  const glyphs: Record<string, string> = {
    Home: '⌂',
    Bookings: '☰',
    Offers: '⟠',
    Profile: '◉',
  };
  return (
    <Text style={{ fontSize: 22, color }}>{glyphs[label] || '•'}</Text>
  );
};

function MainTabs() {
  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.gray,
          tabBarStyle: { backgroundColor: COLORS.white },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{ tabBarIcon: tabIcon('Home') }}
        />
        <Tab.Screen
          name="Bookings"
          component={BookingsScreen}
          options={{ tabBarIcon: tabIcon('Bookings') }}
        />
        <Tab.Screen
          name="Offers"
          component={OffersScreen}
          options={{ tabBarIcon: tabIcon('Offers') }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ tabBarIcon: tabIcon('Profile') }}
        />
      </Tab.Navigator>
      <ActiveRideCard />
    </>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Legal" component={LegalScreen} />
    </Stack.Navigator>
  );
}

function TermsGate() {
  return (
    <Stack.Navigator initialRouteName="TermsGate" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TermsGate" component={TermsGateScreen} />
      <Stack.Screen name="TermsLegal" component={LegalScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={MainTabs} />
      <Stack.Screen name="RideStatus" component={RideStatusScreen} />
      <Stack.Screen name="RideHistory" component={RideHistoryScreen} />
      <Stack.Screen name="BookingsList" component={BookingsScreen} />
      <Stack.Screen name="Receipts" component={ReceiptsScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
      <Stack.Screen name="SOS" component={SOSScreen} />
      <Stack.Screen name="Rating" component={RatingScreen} />
      <Stack.Screen name="PickLocation" component={PickLocationScreen} />
      <Stack.Screen name="Legal" component={LegalScreen} />
      <Stack.Screen name="ScheduleRide" component={ScheduleRideScreen} />
      <Stack.Screen name="Wallet" component={WalletScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, isLoading, termsAccepted } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <AuthStack />;
  }

  return termsAccepted ? <AppStack /> : <TermsGate />;
}