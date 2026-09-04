import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDriverAuth } from '../context/AuthContext';
import { COLORS, DRIVER_STATUS_COLORS, API_BASE_URL } from '../constants/config';
import socketService from '../services/socketService';
import rideService from '../services/rideService';
import { getCurrentLocation, watchDriverLocation, startBackgroundLocationUpdates, stopBackgroundLocationUpdates } from '../services/locationService';

interface Ride {
  _id: string;
  rider: { name: string; phone?: string; rating?: number };
  pickupLocation: { type: string; coordinates: [number, number]; address?: string };
  dropoffLocation: { type: string; coordinates: [number, number]; address?: string };
  status: string;
  fare: number;
  vehicleType: string;
   distance: number;
   duration: number;
   createdAt: string;
   tip?: number;
 }

export default function HomeScreen({ navigation }: any) {
  const { driver, updateDriver } = useDriverAuth();
  const [location, setLocation] = useState<any>(null);
  const [mapRegion, setMapRegion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(driver?.isOnline || false);
  const [incomingRide, setIncomingRide] = useState<Ride | null>(null);
  const [connected, setConnected] = useState(false);
  const onRideRequested = useRef<any>(null);
  const onRideTaken = useRef<any>(null);
  const onRideCancelled = useRef<any>(null);

  useEffect(() => {
    initializeLocation();
    startBackgroundLocationUpdates();
    setupSocket();

    const unsub = socketService.onConnectionStatus(setConnected);

    const watch = watchDriverLocation((loc) => {
      setLocation(loc);
    });

    return () => {
      unsub?.();
      if (watch && typeof (watch as any).then === 'function') {
        (watch as Promise<any>).then((sub: any) => sub?.remove()).catch(() => {});
      }
      stopBackgroundLocationUpdates();
      if (onRideRequested.current) socketService.off('ride_requested', onRideRequested.current);
      if (onRideTaken.current) socketService.off('ride_taken', onRideTaken.current);
      if (onRideCancelled.current) socketService.off('ride_cancelled', onRideCancelled.current);
    };
  }, []);

  const initializeLocation = async () => {
    const loc = await getCurrentLocation();
    if (loc) {
      setLocation(loc);
      setMapRegion({
        latitude: loc.latitude,
        longitude: loc.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } else {
      setMapRegion({
        latitude: 28.6139,
        longitude: 77.2090,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
    setIsLoading(false);
  };

  const setupSocket = async () => {
    const authToken = driver?.token || (await AsyncStorage.getItem('driver_token'));
    await socketService.connect(authToken);

    onRideRequested.current = (ride: Ride) => {
      setIncomingRide(ride);
    };
    socketService.on('ride_requested', onRideRequested.current);

    onRideTaken.current = (data: { rideId: string; acceptedBy: string }) => {
      setIncomingRide((prev) => {
        if (prev?._id === data.rideId) {
          Alert.alert('Ride taken', 'Another driver accepted this ride.');
          return null;
        }
        return prev;
      });
    };
    socketService.on('ride_taken', onRideTaken.current);

    onRideCancelled.current = (data: { rideId: string; cancelledBy: string }) => {
      setIncomingRide((prev) => {
        if (prev?._id === data.rideId) {
          Alert.alert('Ride Cancelled', 'The rider has cancelled this ride request.');
          return null;
        }
        return prev;
      });
    };
    socketService.on('ride_cancelled', onRideCancelled.current);
  };

  const toggleOnline = async (value: boolean) => {
    try {
      const authToken = driver?.token || (await AsyncStorage.getItem('driver_token'));
      if (!authToken) return;
      await fetch(`${API_BASE_URL}/auth/online-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ isOnline: value }),
      });
      setIsOnline(value);
      updateDriver({ isOnline: value });
    } catch (err) {
      console.error('Failed to update online status:', err);
    }
  };

  const handleAcceptRide = useCallback(async () => {
    if (!incomingRide) return;

    try {
      await rideService.acceptRide(incomingRide._id);

      navigation.navigate('ActiveRide', { rideId: incomingRide._id });
      setIncomingRide(null);
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message || err.message || 'Failed to accept ride';
      setIncomingRide(null);
      Alert.alert('Ride no longer available', message);
    }
  }, [incomingRide, navigation]);

  const handleDeclineRide = () => {
    setIncomingRide(null);
    Alert.alert('Ride declined', 'You declined the ride');
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading || !mapRegion) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={mapRegion} provider={PROVIDER_GOOGLE}>
        {location && (
          <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }} />
        )}
      </MapView>

      <View style={styles.headerOverlay}>
        <TouchableOpacity
          style={styles.driverHeader}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={styles.driverAvatar}>
            <Text style={styles.driverInitial}>{driver?.name?.charAt(0) || '?'}</Text>
          </View>
          <View>
            <Text style={styles.driverName}>{driver?.name}</Text>
            <Text style={styles.driverStats}>
              {driver?.rating?.toFixed(1) || '0'} ★ · {driver?.totalRides || 0} rides · ₹{driver?.earnings?.toFixed(0) || 0} earned
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.onlineToggle}>
          <Text style={[styles.onlineLabel, { color: connected ? COLORS.success : '#fca311' }]}>
            {connected ? 'Connected' : 'Connecting...'}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={toggleOnline}
            trackColor={{ false: '#ddd', true: COLORS.success }}
            thumbColor={isOnline ? COLORS.success : '#fff'}
          />
        </View>
      </View>

      {incomingRide && (
        <View style={styles.rideRequestCard}>
          <View style={styles.rideRequestHeader}>
            <View>
              <Text style={styles.riderName}>{incomingRide.rider?.name || 'Rider'}</Text>
              <Text style={styles.riderPhone}>{incomingRide.rider?.phone || ''}</Text>
              <Text style={styles.pickupAddress}>from {incomingRide.pickupLocation?.address}</Text>
              <Text style={styles.pickupAddress}>to {incomingRide.dropoffLocation?.address}</Text>
            </View>
            <View style={styles.fareBox}>
              <Text style={styles.fareAmount}>₹{incomingRide.fare?.toFixed(2)}</Text>
              <Text style={styles.fareSub}>₹{(incomingRide.fare * 0.9).toFixed(2)} earnings</Text>
            </View>
          </View>

           <View style={styles.rideRequestDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Pickup at {formatTime(incomingRide.createdAt)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{incomingRide.vehicleType} · {incomingRide.distance.toFixed(1)} km</Text>
            </View>
            {incomingRide.tip > 0 && (
              <View style={styles.detailItem}>
                <Text style={styles.tipLabel}>Tip included · +₹{incomingRide.tip.toFixed(0)}</Text>
              </View>
            )}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.declineButton} onPress={handleDeclineRide}>
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptButton} onPress={handleAcceptRide}>
              <Text style={styles.acceptButtonText}>Accept Ride</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!incomingRide && (
        <View style={styles.statusFooter}>
          <Text style={styles.statusText}>
            {!connected
              ? 'Connecting to server...'
              : isOnline
              ? 'Waiting for ride requests...'
              : 'Go online to receive ride requests'}
          </Text>
        </View>
      )}
    </View>
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
  map: { flex: 1 },
  headerOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white + '90',
    padding: 12,
    borderRadius: 12,
  },
  chevron: { fontSize: 22, color: COLORS.gray, marginLeft: 4 },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInitial: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  driverStats: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  onlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white + '90',
    padding: 8,
    borderRadius: 12,
  },
  onlineLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  rideRequestCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  rideRequestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  riderName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  riderPhone: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 1,
  },
  pickupAddress: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  fareBox: {
    alignItems: 'flex-end',
  },
  fareAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  fareSub: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
    marginTop: 2,
  },
  rideRequestDetails: {
    gap: 8,
    marginBottom: 20,
  },
  detailItem: {},
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  tipLabel: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.danger,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  declineButtonText: {
    color: COLORS.danger,
    fontSize: 18,
    fontWeight: 'bold',
  },
  acceptButton: {
    flex: 2,
    backgroundColor: COLORS.success,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusFooter: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: COLORS.gray,
    backgroundColor: COLORS.white + '90',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
});