import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDriverAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import ActiveRideScreen from '../screens/ActiveRideScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ReviewStatusScreen from '../screens/ReviewStatusScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EarningsScreen from '../screens/EarningsScreen';
import TripsScreen from '../screens/TripsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import DocumentsScreen from '../screens/DocumentsScreen';
import SupportScreen from '../screens/SupportScreen';
import TermsGateScreen from '../screens/TermsGateScreen';
import LegalScreen from '../screens/LegalScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;
  ReviewStatus: undefined;
  Home: undefined;
  ActiveRide: { rideId: string };
  Profile: undefined;
  Earnings: undefined;
  Trips: undefined;
  EditProfile: undefined;
  Documents: undefined;
  Support: undefined;
  App: undefined;
  Legal: { doc?: string };
  TermsGate: undefined;
  TermsLegal: { doc?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

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

function OnboardingStack({ status }: { status?: string }) {
  const initial = status === 'submitted' || status === 'rejected' ? 'ReviewStatus' : 'Onboarding';
  return (
    <Stack.Navigator initialRouteName={initial} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="ReviewStatus" component={ReviewStatusScreen} />
      <Stack.Screen name="App" component={AppStack} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ActiveRide" component={ActiveRideScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Earnings" component={EarningsScreen} />
      <Stack.Screen name="Trips" component={TripsScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="Documents" component={DocumentsScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="Legal" component={LegalScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { driver, isLoading, termsAccepted } = useDriverAuth();

  if (isLoading) {
    return null;
  }

  if (!driver) {
    return <AuthStack />;
  }

  if (!termsAccepted) {
    return <TermsGate />;
  }

  if (driver.onboardingStatus === 'approved' || driver.isVerified) {
    return <AppStack />;
  }

  return <OnboardingStack status={driver.onboardingStatus} />;
}