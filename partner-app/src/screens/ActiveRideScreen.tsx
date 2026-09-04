import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDriverAuth } from '../context/AuthContext';
import { COLORS, DRIVER_STATUS_COLORS } from '../constants/config';
import socketService from '../services/socketService';
import rideService from '../services/rideService';
import { getCurrentLocation, watchDriverLocation } from '../services/locationService';
import { Linking, Platform } from 'react-native';

interface Location {
  latitude: number;
  longitude: number;
}

export default function ActiveRideScreen({ navigation, route }: any) {
  const { rideId } = route.params;
  const { driver } = useDriverAuth();
  const [ride, setRide] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState<Location | null>(null);
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadRide();
    setupSocket();
    startLocationStream();

    return () => {
      // Don't disconnect socket — keep it alive for HomeScreen.
      // Just remove this screen's listeners so they don't fire after unmount.
      socketService.off('ride_cancelled');
      socketService.off('ride_status_updated');
    };
  }, [rideId]);

  const startLocationStream = async () => {
    const loc = await getCurrentLocation();
    if (loc) setDriverLocation(loc);
    watchDriverLocation((loc) => {
      setDriverLocation(loc);
      socketService.sendDriverPosition(rideId, loc);
    });
  };

  const loadRide = async () => {
    try {
      const response = await rideService.getRide(rideId);
      setRide(response.ride);
    } catch (err) {
      Alert.alert('Error', 'Failed to load ride');
    } finally {
      setIsLoading(false);
    }
  };

  const setupSocket = async () => {
    const authToken = driver?.token || (await AsyncStorage.getItem('driver_token'));
    await socketService.connect(authToken);
    socketService.subscribeToRideUpdates(rideId);

    socketService.on('ride_cancelled', (data: { rideId: string; cancelledBy: string }) => {
      if (data.rideId === rideId) {
        Alert.alert(
          'Ride Cancelled',
          data.cancelledBy === 'rider'
            ? 'The rider has cancelled this ride.'
            : 'This ride has been cancelled.',
          [{ text: 'OK', onPress: () => navigation.navigate('Home' as never) }]
        );
      }
    });

    socketService.on('ride_status_updated', (updatedRide: any) => {
      if (updatedRide?.rideId === rideId && updatedRide?.status) {
        setRide((prev: any) => (prev ? { ...prev, status: updatedRide.status } : prev));
      } else if (updatedRide?._id === rideId) {
        setRide(updatedRide);
      }
    });
  };

  const updateRideStatus = useCallback(async (status: string) => {
    try {
      const response = await rideService.updateRideStatus(ride._id, status);
      setRide(response.ride);

      if (status === 'completed') {
        Alert.alert('Ride completed', 'Thank you! Your payment has been processed.', [
          { text: 'OK', onPress: () => navigation.navigate('Home' as never) },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Failed to update status');
    }
  }, [ride?._id, navigation]);

  const handleVerifyOtp = useCallback(async () => {
    if (otp.trim().length !== 4) {
      Alert.alert('Enter OTP', 'Please ask the rider for the 4-digit OTP.');
      return;
    }
    setVerifying(true);
    try {
      const response = await rideService.verifyOtp(ride._id, otp.trim());
      setRide(response.ride);
      setOtp('');
    } catch (err: any) {
      Alert.alert('OTP incorrect', err?.response?.data?.error?.message || 'Failed to verify OTP');
    } finally {
      setVerifying(false);
    }
  }, [otp, ride?._id]);

  const openNavigation = (lat: number, lng: number) => {
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`,
      android: `google.navigation:q=${lat},${lng}&mode=d`,
    });
    if (url) {
      Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open maps'));
    }
  };

  if (isLoading || !ride) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading ride...</Text>
      </View>
    );
  }

  const statusColor = DRIVER_STATUS_COLORS[ride.status] || COLORS.gray;
  const pickupCoords = ride.pickupLocation?.coordinates || [0, 0];
  const dropoffCoords = ride.dropoffLocation?.coordinates || [0, 0];
  const isInProgress = ride.status === 'in_progress';
  const region = {
    latitude: pickupCoords[1],
    longitude: pickupCoords[0],
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <MapView style={styles.map} region={region} provider={PROVIDER_GOOGLE}>
        <Marker
          coordinate={{ latitude: pickupCoords[1], longitude: pickupCoords[0] }}
          pinColor={COLORS.primary}
          title="Pickup"
        />
        {isInProgress && (
          <Marker
            coordinate={{ latitude: dropoffCoords[1], longitude: dropoffCoords[0] }}
            pinColor={COLORS.success}
            title="Drop-off"
          />
        )}
        {driverLocation && (
          <Marker coordinate={driverLocation} pinColor={COLORS.warning} title="You" />
        )}
      </MapView>

      <View style={styles.statusBanner}>
        <Text style={styles.statusTextHeader}>{ride.status.toUpperCase()}</Text>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rider</Text>
          <View style={styles.riderInfoStyle}>
            <Text style={styles.riderName}>{ride.rider?.name || 'Unknown'}</Text>
            {ride.rider?.rating && (
              <Text style={styles.riderRating}>{ride.rider.rating.toFixed(1)} ★</Text>
            )}
          </View>
          <Text style={styles.riderPhone}>{ride.rider?.phone || 'No phone'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup Location</Text>
          <Text style={styles.locationText}>{ride.pickupLocation?.address}</Text>
        </View>

        {isInProgress && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Drop-off Location</Text>
            <Text style={styles.locationText}>{ride.dropoffLocation?.address}</Text>
          </View>
        )}

        <View style={styles.fareInfo}>
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Fare</Text>
            <Text style={styles.fareValue}>₹{ride.fare?.toFixed(2)}</Text>
          </View>
          <View style={styles.fareRow}>
            <Text style={styles.fareLabel}>Distance</Text>
            <Text style={styles.fareValue}>{ride.distance?.toFixed(1)} km</Text>
          </View>
          <View style={styles.fareDivider} />
          <View style={styles.fareRow}>
            <Text style={styles.fareLabelBold}>Your earnings</Text>
            <Text style={styles.fareValueBold}>₹{(ride.fare * 0.9).toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.actionSection}>
          {ride.status === 'accepted' && (
            <>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => openNavigation(pickupCoords[1], pickupCoords[0])}
              >
                <Text style={styles.navButtonText}>Navigate to Pickup</Text>
              </TouchableOpacity>
              <View style={styles.otpBox}>
                <Text style={styles.otpTitle}>At pickup? Ask rider for their OTP</Text>
                <TextInput
                  style={styles.otpInput}
                  value={otp}
                  onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, '').slice(0, 4))}
                  keyboardType="number-pad"
                  maxLength={4}
                  placeholder="0000"
                  placeholderTextColor={COLORS.gray}
                />
                <TouchableOpacity
                  style={[styles.verifyButton, verifying && styles.disabledButton]}
                  onPress={handleVerifyOtp}
                  disabled={verifying}
                >
                  {verifying ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.verifyButtonText}>Verify OTP & Start Ride</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          {isInProgress && (
            <>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => openNavigation(dropoffCoords[1], dropoffCoords[0])}
              >
                <Text style={styles.navButtonText}>Navigate to Drop-off</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.completeButton} onPress={() => updateRideStatus('completed')}>
                <Text style={styles.completeButtonText}>Complete Ride</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
  },
  map: { height: 250 },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
    gap: 8,
  },
  statusTextHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  detailsContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.white,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  riderInfoStyle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  riderName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  riderRating: {
    fontSize: 14,
    color: COLORS.warning,
  },
  riderPhone: {
    fontSize: 16,
    color: COLORS.text,
    marginTop: 4,
  },
  locationText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 22,
  },
  fareInfo: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fareLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  fareValue: {
    fontSize: 14,
    color: COLORS.text,
  },
  fareDivider: {
    height: 1,
    backgroundColor: COLORS.gray,
    opacity: 0.3,
    marginVertical: 8,
  },
  fareLabelBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  fareValueBold: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  actionSection: {
    gap: 12,
    marginBottom: 16,
  },
  navButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  navButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  otpBox: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  otpTitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 10,
    textAlign: 'center',
  },
  otpInput: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: 12,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 12,
    textAlign: 'center',
    width: '70%',
    marginBottom: 12,
    color: COLORS.text,
  },
  verifyButton: {
    backgroundColor: COLORS.success,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    width: '100%',
  },
  verifyButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  completeButton: {
    backgroundColor: COLORS.success,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  completeButtonText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
});