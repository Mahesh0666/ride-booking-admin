import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
} from 'react-native';
import { COLORS, VEHICLE_ICONS } from '../constants/config';
import socketService from '../services/socketService';
import rideService from '../services/rideService';
import { useRide } from '../context/RideContext';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { getRoadRoute, getRouteToDriver } from '../services/routingService';

const ACTIVE_STATUSES = ['scheduled', 'requested', 'accepted', 'arriving', 'in_progress'];

interface RideStatusScreenProps {
  navigation: any;
  route: {
    params: {
      pickup?: any;
      dropoff?: any;
      vehicleType?: string;
      fareEstimate?: number;
      paymentMethod?: string;
      rideId?: string;
    };
  };
}

export default function RideStatusScreen({ navigation, route }: RideStatusScreenProps) {
  const { activeRide, driverPosition, setActiveRide, clearActiveRide, minimizeRide, highDemand, clearHighDemand } = useRide();
  const [localRide, setLocalRide] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(route.params.rideId ? !activeRide : false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [roadRouteCoords, setRoadRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [driverRouteCoords, setDriverRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const { pickup, dropoff, vehicleType, fareEstimate, rideId } = route.params;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  useEffect(() => {
    if (rideId && activeRide?._id !== rideId) {
      loadRide();
    } else if (rideId && activeRide?._id === rideId) {
      setIsLoading(false);
    }
    if (rideId) {
      socketService.subscribeToRideUpdates(rideId);
    }
  }, [rideId]);

  useEffect(() => {
    const timer = setInterval(() => setTimeElapsed((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadRide = async () => {
    try {
      const response = await rideService.getRide(rideId);
      const fetched = response.ride;
      if (fetched?._id && ACTIVE_STATUSES.includes(fetched.status)) {
        setActiveRide(fetched);
      } else {
        setLocalRide(fetched);
      }
      setIsLoading(false);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to load ride');
      navigation.goBack();
    }
  };

  const currentRide =
    (rideId && activeRide?._id === rideId ? activeRide : localRide) || activeRide || route.params;  const status = currentRide.status || (currentRide._id ? 'requested' : 'pending');
  const hasAcId = !!(currentRide._id || currentRide.rideId);

  useEffect(() => {
    const p = currentRide.pickupLocation;
    const d = currentRide.dropoffLocation;
    if (p?.coordinates && d?.coordinates) {
      const pickupPt = { latitude: p.coordinates[1], longitude: p.coordinates[0] };
      const dropoffPt = { latitude: d.coordinates[1], longitude: d.coordinates[0] };
      getRoadRoute(pickupPt, dropoffPt).then((result) => {
        if (result) setRoadRouteCoords(result.coordinates);
      });
    } else if (pickup && dropoff) {
      getRoadRoute(pickup, dropoff).then((result) => {
        if (result) setRoadRouteCoords(result.coordinates);
      });
    }
  }, [currentRide?._id]);

  useEffect(() => {
    if (driverPosition && currentRide.pickupLocation?.coordinates) {
      const pickupPt = {
        latitude: currentRide.pickupLocation.coordinates[1],
        longitude: currentRide.pickupLocation.coordinates[0],
      };
      getRouteToDriver(driverPosition, pickupPt).then((coords) => {
        if (coords) setDriverRouteCoords(coords);
      });
    }
  }, [driverPosition?.latitude, driverPosition?.longitude]);

  // Hardware back during an active ride must NOT cancel or exit the booking —
  // it minimizes to the persistent "Looking for a driver" card on Home.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (hasAcId && ACTIVE_STATUSES.includes(status)) {
        minimizeRide();
        navigation.goBack();
        return true;
      }
      // No ride created yet (request form): allow going back for a fresh start.
      if (!hasAcId) return false;
      return false;
    });
    return () => sub.remove();
  }, [hasAcId, status]);

   const handleRequestRide = async (options?: { tip?: number }) => {
    if (!pickup || !dropoff) return;
    setIsLoading(true);
    try {
      const response = await rideService.requestRide(pickup, dropoff, vehicleType || 'auto', {
        paymentMethod: route.params.paymentMethod === 'wallet' ? 'cash' : route.params.paymentMethod,
        fare: route.params.fareEstimate,
        tip: options?.tip,
      });
      setActiveRide(response.ride);
      socketService.subscribeToRideUpdates(response.ride._id);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Failed to request ride');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryWithTip = async () => {
    if (!highDemand) return;
    const tip = Math.max(highDemand.suggestedTip, 1);
    const baseFare = route.params.fareEstimate || 0;
    try {
      const response = await rideService.requestRide(pickup, dropoff, vehicleType || 'auto', {
        paymentMethod: route.params.paymentMethod === 'wallet' ? 'cash' : route.params.paymentMethod,
        fare: baseFare + tip,
        tip,
      });
      setActiveRide(response.ride);
      socketService.subscribeToRideUpdates(response.ride._id);
      clearHighDemand();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Failed to request ride');
    }
  };

  const handleCancelRide = async () => {
    if (!currentRide?._id || isCancelling) return;

    Alert.alert('Cancel Ride', 'Are you sure you want to cancel?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setIsCancelling(true);
          try {
            await rideService.cancelRide(currentRide._id, 'Changed my mind');
            clearActiveRide();
            navigation.navigate('Home' as never);
            Alert.alert('Cancelled', 'Your ride has been cancelled');
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.error?.message || 'Cancel failed');
          } finally {
            setIsCancelling(false);
          }
        },
      },
    ]);
  };

  const handleMinimize = () => {
    if (!hasAcId || !ACTIVE_STATUSES.includes(status)) return;
    minimizeRide();
    navigation.goBack();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getStatusText = (st: string) => {
    const texts: Record<string, string> = {
      scheduled: 'Scheduled ride',
      requested: 'Finding a driver...',
      accepted: 'Driver is on their way',
      arriving: 'Driver is arriving',
      in_progress: 'Ride in progress',
      completed: 'Ride completed',
      cancelled: 'Ride cancelled',
    };
    return texts[st] || st;
  };

  const renderMapView = () => {
    const p = currentRide.pickupLocation || pickup;
    const d = currentRide.dropoffLocation || dropoff;
    if (!p && !currentRide.pickupLocation) return null;

    let region;
    let coordinates: { latitude: number; longitude: number }[] = [];

    if (currentRide.pickupLocation?.coordinates) {
      const [pLng, pLat] = currentRide.pickupLocation.coordinates;
      const [dLng, dLat] = currentRide.dropoffLocation?.coordinates || [pLng, pLat];
      region = {
        latitude: pLat,
        longitude: pLng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      coordinates = [
        { latitude: pLat, longitude: pLng },
        { latitude: dLat, longitude: dLng },
      ];
    } else if (pickup) {
      region = {
        latitude: pickup.latitude,
        longitude: pickup.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      coordinates = [
        { latitude: pickup.latitude, longitude: pickup.longitude },
        ...(dropoff ? [{ latitude: dropoff.latitude, longitude: dropoff.longitude }] : []),
      ];
    } else {
      return null;
    }

    if (driverPosition) {
      region = {
        latitude: driverPosition.latitude,
        longitude: driverPosition.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    const polylineCoords = roadRouteCoords.length > 0
      ? roadRouteCoords
      : coordinates;

    return (
      <MapView
        style={styles.map}
        region={region}
        provider={PROVIDER_GOOGLE}
        showsTraffic={false}
        showsBuildings={false}
        showsIndoors={false}
        showsPointsOfInterest={false}
        loadingEnabled={true}
        cacheEnabled={true}
      >
        <Marker coordinate={polylineCoords[0]} pinColor={COLORS.primary} />
        {polylineCoords.length > 1 && (
          <Marker coordinate={polylineCoords[polylineCoords.length - 1]} pinColor={COLORS.success} />
        )}
        {polylineCoords.length > 1 && (
          <Polyline coordinates={polylineCoords} strokeColor={COLORS.primary} strokeWidth={5} />
        )}
        {driverPosition && (
          <>
            <Marker coordinate={driverPosition} pinColor={COLORS.secondary} title="Your driver" />
            {driverRouteCoords.length > 0 && (
              <Polyline coordinates={driverRouteCoords} strokeColor={COLORS.secondary} strokeWidth={4} />
            )}
          </>
        )}
      </MapView>
    );
  };

  if (isLoading && rideId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading ride...</Text>
      </View>
    );
  }

  const canCancel = ['scheduled', 'requested', 'accepted', 'arriving'].includes(status);
  const showOtp = ['accepted', 'arriving', 'in_progress'].includes(status) && !!currentRide.otp;
  const showMinimize = hasAcId && ACTIVE_STATUSES.includes(status);

  return (
    <View style={styles.container}>
      {renderMapView()}

      <View style={styles.statusHeader}>
        <View style={styles.statusTextWrap}>
          <Animated.View
            style={[
              styles.pulseDot,
              { opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.2] }) },
            ]}
          />
          <Text style={styles.statusText}>{getStatusText(status)}</Text>
        </View>
        <Text style={styles.timer}>{formatTime(timeElapsed)}</Text>
      </View>

      {showMinimize && (
        <TouchableOpacity style={styles.minimizeBar} onPress={handleMinimize}>
          <Text style={styles.minimizeBarText}>
            ▾ Minimize — we'll keep looking and notify you
          </Text>
        </TouchableOpacity>
      )}

      {showOtp && (
        <View style={styles.otpBanner}>
          <Text style={styles.otpBannerLabel}>Share this OTP with your driver</Text>
          <Text style={styles.otpBannerValue}>{currentRide.otp}</Text>
        </View>
      )}

      {highDemand ? (
        <View style={styles.highDemandSection}>
          <Text style={styles.highDemandTitle}>No driver available right now</Text>
          <Text style={styles.highDemandSub}>
            High demand. Add an extra tip of ₹{highDemand.suggestedTip} to get matched faster.
          </Text>
          <TouchableOpacity style={styles.requestButton} onPress={handleRetryWithTip}>
            <Text style={styles.requestButtonText}>Retry with +₹{highDemand.suggestedTip} tip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.highDemandCancel} onPress={clearHighDemand}>
            <Text style={styles.highDemandCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : !hasAcId ? (
        <View style={styles.requestSection}>
          <View style={styles.fareContainer}>
            <Text style={styles.fareLabel}>Estimated Fare</Text>
            <Text style={styles.fareAmount}>₹{fareEstimate?.toFixed(2) || '—'}</Text>
          </View>
            <TouchableOpacity style={styles.requestButton} onPress={() => handleRequestRide()} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.requestButtonText}>Request {VEHICLE_ICONS.auto} Auto Ride</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.rideInfoSection}>
          {currentRide.driver && (
            <View style={styles.driverInfo}>
              <View style={styles.driverAvatar}>
                <Text style={styles.driverInitial}>{currentRide.driver.name?.charAt(0) || '?'}</Text>
              </View>
           <View style={styles.driverDetails}>
             <Text style={styles.driverName}>{currentRide.driver.name}</Text>
             <Text style={styles.driverRating}>
               {currentRide.driver.rating?.toFixed(1) || '—'} ★
               {currentRide.driver.vehicle?.licensePlate
                 ? ` · ${currentRide.driver.vehicle.licensePlate}`
                 : ''}
               {currentRide.driver.vehicle?.model
                 ? ` · ${currentRide.driver.vehicle.make || ''} ${currentRide.driver.vehicle.model}`
                 : ''}
             </Text>
             {currentRide.driver.phone ? (
               <Text style={styles.driverPhone}>{currentRide.driver.phone}</Text>
             ) : null}
           </View>
            </View>
          )}

          <View style={styles.rideDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pickup</Text>
              <Text style={styles.detailValue}>{currentRide.pickupLocation?.address || pickup?.address}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Dropoff</Text>
              <Text style={styles.detailValue}>{currentRide.dropoffLocation?.address || dropoff?.address}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Fare</Text>
              <Text style={styles.detailValue}>₹{currentRide.fare?.toFixed(2)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Vehicle</Text>
              <Text style={styles.detailValue}>{(currentRide.vehicleType || 'auto').toUpperCase()}</Text>
            </View>
          </View>

          {canCancel && (
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelRide} disabled={isCancelling}>
              {isCancelling ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.cancelButtonText}>Cancel Ride</Text>
              )}
            </TouchableOpacity>
          )}
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
  map: { height: 250 },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusTextWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  timer: {
    fontSize: 14,
    color: COLORS.gray,
  },
  minimizeBar: {
    backgroundColor: COLORS.grayLight,
    paddingVertical: 10,
    alignItems: 'center',
  },
  minimizeBarText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  otpBanner: {
    backgroundColor: COLORS.primary,
    padding: 16,
    alignItems: 'center',
  },
  otpBannerLabel: {
    color: COLORS.white + 'CC',
    fontSize: 14,
    marginBottom: 4,
  },
  otpBannerValue: {
    color: COLORS.white,
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 10,
  },
  highDemandSection: {
    padding: 24,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 12,
  },
  highDemandTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.danger,
    textAlign: 'center',
  },
  highDemandSub: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
  highDemandCancel: {
    alignItems: 'center',
    marginTop: 4,
  },
  highDemandCancelText: {
    fontSize: 15,
    color: COLORS.gray,
  },
  requestSection: {
    padding: 24,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  fareContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  fareLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  fareAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  requestButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  requestButtonText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  rideInfoSection: {
    padding: 20,
    backgroundColor: COLORS.white,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  driverInitial: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  driverDetails: { flex: 1 },
  driverName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  driverRating: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  driverPhone: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  rideDetails: { gap: 12, marginBottom: 20 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: COLORS.danger,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});