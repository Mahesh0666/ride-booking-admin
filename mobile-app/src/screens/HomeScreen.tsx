import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  ScrollView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { COLORS, VEHICLE_ICONS, CAB_VEHICLE_TYPES, CabVehicleType } from '../constants/config';
import rideService, { RideServiceOption } from '../services/rideService';
import { getInitialRegion, Coordinates, getCurrentLocation } from '../utils/location';
import { consumePendingLocation } from '../utils/locationStore';
import { reverseGeocode } from '../services/placesService';
import { getRoadRoute, RoutePoint } from '../services/routingService';

const PAYMENT_METHOD = 'cash';

type BookingMode = 'auto' | 'cab';

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [bookingMode, setBookingMode] = useState<BookingMode>('auto');
  const [pickup, setPickup] = useState<Coordinates | null>(null);
  const [dropoff, setDropoff] = useState<Coordinates | null>(null);
  const [mapRegion, setMapRegion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<RideServiceOption[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState('auto');
  const [fareEstimate, setFareEstimate] = useState<number | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [selectedCab, setSelectedCab] = useState<string>('sedan_basic');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [cabBooked, setCabBooked] = useState(false);
  const [cabBookingLoading, setCabBookingLoading] = useState(false);
  const [roadRouteCoords, setRoadRouteCoords] = useState<RoutePoint[]>([]);

  const pickupRef = React.useRef<Coordinates | null>(null);
  const dropoffRef = React.useRef<Coordinates | null>(null);
  const sheetAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(sheetAnim, { toValue: 1, useNativeDriver: true, friction: 7, tension: 60 }).start();
  }, [sheetAnim]);

  const setPickupBoth = (loc: Coordinates | null) => {
    pickupRef.current = loc;
    setPickup(loc);
  };

  const setDropoffBoth = (loc: Coordinates | null) => {
    dropoffRef.current = loc;
    setDropoff(loc);
  };

  useEffect(() => {
    initializeLocation();
    loadServices();
  }, []);

  useEffect(() => {
    if (pickupRef.current && dropoffRef.current && services.length > 0) {
      const distance = calculateDistance(
        pickupRef.current.latitude,
        pickupRef.current.longitude,
        dropoffRef.current.latitude,
        dropoffRef.current.longitude
      );
      setRouteDistance(distance);
      updateFareEstimate(distance, selectedVehicle, services);
      fetchRoadRoute();
    } else {
      setFareEstimate(null);
      setRouteDistance(null);
      setRoadRouteCoords([]);
    }
  }, [pickup, dropoff, selectedVehicle, services]);

  const fetchRoadRoute = async () => {
    if (!pickupRef.current || !dropoffRef.current) return;
    const result = await getRoadRoute(pickupRef.current, dropoffRef.current);
    if (result) {
      setRoadRouteCoords(result.coordinates);
      if (result.distanceKm) {
        setRouteDistance(result.distanceKm);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      const pendingPickup = consumePendingLocation('pickup');
      const pendingDropoff = consumePendingLocation('dropoff');
      if (pendingPickup) setPickupBoth(pendingPickup);
      if (pendingDropoff) setDropoffBoth(pendingDropoff);
    }, [])
  );

  const recomputeFare = () => {
    if (pickupRef.current && dropoffRef.current) {
      const distance = calculateDistance(
        pickupRef.current.latitude,
        pickupRef.current.longitude,
        dropoffRef.current.latitude,
        dropoffRef.current.longitude
      );
      updateFareEstimate(distance, selectedVehicle, services);
    }
  };

  const loadServices = async () => {
    try {
      const data = await rideService.getServices();
      const list = data.services || [];
      setServices(list);
      if (list.length > 0) setSelectedVehicle(list[0].code);
    } catch (err) {
      console.warn('Failed to load services', err);
    }
  };

  const initializeLocation = async () => {
    setSelectedDate(getTodayDate());
    try {
      const loc = await getCurrentLocation();
      if (loc) {
        setMapRegion({
          latitude: loc.latitude,
          longitude: loc.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        setIsLoading(false);
        return;
      }
    } catch (e) {
      console.warn('GPS failed, using default');
    }
    setMapRegion(getInitialRegion(28.6139, 77.2090));
    setIsLoading(false);
  };

  const getTodayDate = (): string => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const formatDateDisplay = (dateStr: string): string => {
    if (!dateStr) return 'Today';
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const selected = new Date(dateStr + 'T00:00:00');
    if (selected.getTime() === today.getTime()) return 'Today';
    if (selected.getTime() === tomorrow.getTime()) return 'Tomorrow';
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const generateDates = (): string[] => {
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
    return dates;
  };

  const openPickupPicker = () => {
    navigation.navigate('PickLocation', { mode: 'pickup', initial: pickup, center: null });
  };

  const openDropoffPicker = () => {
    navigation.navigate('PickLocation', { mode: 'dropoff', initial: dropoff, center: pickup });
  };

  const handleBookRide = useCallback(() => {
    if (!pickup || !dropoff) {
      Alert.alert('Error', 'Please select pickup and drop locations');
      return;
    }
    navigation.navigate('RideStatus', {
      pickup, dropoff, vehicleType: selectedVehicle, fareEstimate, paymentMethod: PAYMENT_METHOD,
    } as any);
  }, [pickup, dropoff, selectedVehicle, fareEstimate, navigation]);

  const getCabFare = (): number | null => {
    if (!routeDistance) return null;
    const cab = CAB_VEHICLE_TYPES.find((v) => v.code === selectedCab);
    if (!cab) return null;
    const MIN_FARE = 500;
    const MIN_KM = 10;
    if (routeDistance <= MIN_KM) return MIN_FARE;
    return MIN_FARE + (routeDistance - MIN_KM) * cab.perKm;
  };

  const handleConfirmCab = async () => {
    if (!pickup || !dropoff || !routeDistance) {
      Alert.alert('Error', 'Please select pickup and drop locations');
      return;
    }
    const fare = getCabFare();
    if (!fare) return;

    setCabBookingLoading(true);
    try {
      await rideService.requestCabBooking({
        pickup: { latitude: pickup.latitude, longitude: pickup.longitude, address: pickup.address },
        dropoff: { latitude: dropoff.latitude, longitude: dropoff.longitude, address: dropoff.address },
        vehicleType: selectedCab,
        distanceKm: routeDistance,
        fare,
        travelDate: selectedDate,
      });
      setCabBooked(true);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error?.message || 'Failed to book. Please try again.');
    } finally {
      setCabBookingLoading(false);
    }
  };

  const handleMapTap = async (event: any) => {
    const coordinate = event.nativeEvent.coordinate;
    const tapped: Coordinates = { latitude: coordinate.latitude, longitude: coordinate.longitude };
    const address = await reverseGeocode(coordinate.latitude, coordinate.longitude);
    if (address) tapped.address = address;
    if (!dropoff) setDropoffBoth(tapped);
    else setPickupBoth(tapped);
    recomputeFare();
  };

  const updateFareEstimate = async (distance: number, code: string, list: RideServiceOption[]) => {
    setRouteDistance(distance);
    setFareEstimate(null);
    if (pickupRef.current && dropoffRef.current) {
      try {
        const data = await rideService.estimate(
          { latitude: pickupRef.current.latitude, longitude: pickupRef.current.longitude },
          { latitude: dropoffRef.current.latitude, longitude: dropoffRef.current.longitude },
          code
        );
        const est = data?.estimate;
        if (est) {
          setRouteDistance(est.distanceKm);
          setFareEstimate(est.fare);
        } else {
          fallbackEstimate(distance, code, list);
        }
      } catch { fallbackEstimate(distance, code, list); }
    } else {
      const svc = list.find((s) => s.code === code);
      if (svc) {
        const duration = distance * 2;
        let fare = svc.baseFare + distance * svc.perKm + duration * svc.perMin;
        fare = Math.max(fare, svc.minFare);
        setFareEstimate(parseFloat(fare.toFixed(2)));
      }
    }
  };

  const fallbackEstimate = (distance: number, code: string, list: RideServiceOption[]) => {
    const svc = list.find((s) => s.code === code);
    if (!svc) return;
    const duration = distance * 2;
    let fare = svc.baseFare + distance * svc.perKm + duration * svc.perMin;
    fare = Math.max(fare, svc.minFare);
    setFareEstimate(parseFloat(fare.toFixed(2)));
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  if (cabBooked) {
    const cab = CAB_VEHICLE_TYPES.find((v) => v.code === selectedCab);
    const fare = getCabFare();
    return (
      <View style={styles.confirmContainer}>
        <View style={styles.confirmCard}>
          <Text style={styles.confirmIcon}>✅</Text>
          <Text style={styles.confirmTitle}>Booking Confirmed!</Text>
          <Text style={styles.confirmMessage}>
            We have noted your response and we will get connected to you soon.
          </Text>
          <View style={styles.confirmDetails}>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Pickup</Text>
              <Text style={styles.confirmValue} numberOfLines={1}>{pickup?.address || 'Selected'}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Drop</Text>
              <Text style={styles.confirmValue} numberOfLines={1}>{dropoff?.address || 'Selected'}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Vehicle</Text>
              <Text style={styles.confirmValue}>{cab?.icon} {cab?.name}</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Seats</Text>
              <Text style={styles.confirmValue}>{cab?.seats} Seater</Text>
            </View>
            {routeDistance != null && (
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Distance</Text>
                <Text style={styles.confirmValue}>{routeDistance.toFixed(1)} km</Text>
              </View>
            )}
            {fare != null && (
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Estimated Fare</Text>
                <Text style={[styles.confirmValue, { color: COLORS.success, fontWeight: 'bold' }]}>₹{fare.toFixed(0)}</Text>
              </View>
            )}
            {routeDistance != null && (
              <View style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>Fare Info</Text>
                <Text style={styles.confirmValue}>
                  {routeDistance <= 10 ? 'Min ₹500 (up to 10 km)' : `₹500 + ₹${(cab?.perKm || 0)} × ${(routeDistance - 10).toFixed(1)} km`}
                </Text>
              </View>
            )}
            <View style={styles.confirmRow}>
              <Text style={styles.confirmLabel}>Date</Text>
              <Text style={styles.confirmValue}>{formatDateDisplay(selectedDate)}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.confirmDoneBtn} onPress={() => {
            setCabBooked(false);
            setPickupBoth(null); setDropoffBoth(null); setRouteDistance(null);
          }}>
            <Text style={styles.confirmDoneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading || !mapRegion) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  const cabFare = getCabFare();
  const selectedCabInfo = CAB_VEHICLE_TYPES.find((v) => v.code === selectedCab);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={mapRegion}
        onPress={handleMapTap}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsTraffic={false}
        showsBuildings={false}
        showsIndoors={false}
        showsPointsOfInterest={false}
        loadingEnabled={true}
        moveOnMarkerPress={false}
        cacheEnabled={true}
      >
        {pickup && <Marker coordinate={{ latitude: pickup.latitude, longitude: pickup.longitude }} pinColor={COLORS.success} title="Pickup" />}
        {dropoff && <Marker coordinate={{ latitude: dropoff.latitude, longitude: dropoff.longitude }} pinColor={COLORS.danger} title="Drop" />}
        {roadRouteCoords.length > 0 ? (
          <Polyline
            coordinates={roadRouteCoords}
            strokeColor={COLORS.primary}
            strokeWidth={5}
          />
        ) : (
          pickup && dropoff && (
            <Polyline
              coordinates={[
                { latitude: pickup.latitude, longitude: pickup.longitude },
                { latitude: dropoff.latitude, longitude: dropoff.longitude },
              ]}
              strokeColor={COLORS.primary}
              strokeWidth={4}
            />
          )
        )}
      </MapView>

      <View style={styles.headerOverlay}>
        <View>
          <Text style={styles.greeting}>Hi, {user?.name?.split(' ')[0] || 'there'} 👋</Text>
          <Text style={styles.subGreeting}>Where shall we take you?</Text>
        </View>
        <TouchableOpacity style={styles.notifButton} onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.notifIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.fieldsCard}>
        <TouchableOpacity style={styles.fieldRow} onPress={openPickupPicker}>
          <View style={styles.fieldIconWrap}><View style={styles.dotPickup} /></View>
          <View style={styles.fieldBody}>
            <Text style={styles.fieldLabel}>PICKUP</Text>
            <Text style={[styles.fieldValue, !pickup && styles.fieldPlaceholder]} numberOfLines={1}>
              {pickup?.address || 'Choose pickup location'}
            </Text>
          </View>
          <Text style={styles.fieldChevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.fieldRow} onPress={openDropoffPicker}>
          <View style={styles.fieldIconWrap}><View style={styles.dotDropoff} /></View>
          <View style={styles.fieldBody}>
            <Text style={styles.fieldLabel}>DROP</Text>
            <Text style={[styles.fieldValue, !dropoff && styles.fieldPlaceholder]} numberOfLines={1}>
              {dropoff?.address || 'Search or pick on map'}
            </Text>
          </View>
          <Text style={styles.fieldChevron}>›</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.bottomSheet, {
        transform: [{ translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [120, 0] }) }],
        opacity: sheetAnim,
      }]}>
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeTab, bookingMode === 'auto' && styles.modeTabActive]}
            onPress={() => setBookingMode('auto')}
          >
            <Text style={[styles.modeTabText, bookingMode === 'auto' && styles.modeTabTextActive]}>🛺 Auto</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, bookingMode === 'cab' && styles.modeTabActive]}
            onPress={() => setBookingMode('cab')}
          >
            <Text style={[styles.modeTabText, bookingMode === 'cab' && styles.modeTabTextActive]}>🚗 Cabs</Text>
          </TouchableOpacity>
        </View>

        {bookingMode === 'auto' ? (
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <View style={styles.vehicleSelector}>
              {services.map((s) => (
                <TouchableOpacity
                  key={s.code}
                  style={[styles.vehicleOption, selectedVehicle === s.code && styles.vehicleOptionSelected]}
                  onPress={() => { setSelectedVehicle(s.code); recomputeFare(); }}
                >
                  <Text style={styles.vehicleIcon}>{s.icon}</Text>
                  <Text style={styles.vehicleName}>{s.name}</Text>
                  <Text style={styles.vehicleCapacity}>{s.capacity}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {fareEstimate != null ? (
              <View style={styles.fareRow}>
                <View>
                  <Text style={styles.fareLabel}>{routeDistance != null ? `${routeDistance.toFixed(1)} km · ` : ''}Estimated Auto fare</Text>
                  {routeDistance != null && (
                    <Text style={styles.fareHint}>{routeDistance <= 4 ? 'Up to 4 km: ₹100 minimum' : '₹20 per km above 4 km'}</Text>
                  )}
                </View>
                <Text style={styles.fareAmount}>₹{fareEstimate.toFixed(2)}</Text>
              </View>
            ) : (
              <View style={styles.fareRow}>
                <Text style={styles.fareHint}>Choose pickup & drop to see the fare</Text>
              </View>
            )}

            {dropoff && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Payment</Text>
                <View style={styles.paymentSelector}>
                  <Text style={styles.paymentIcon}>💵</Text>
                  <Text style={styles.paymentText}>Cash</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.bookButton, (!pickup || !dropoff) && styles.bookButtonDisabled]}
              onPress={handleBookRide}
              disabled={!pickup || !dropoff}
            >
              <Text style={styles.bookButtonText}>
                {pickup && dropoff ? `Book ${VEHICLE_ICONS[selectedVehicle] || ''} Auto` : 'Select pickup & drop'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <Text style={styles.sectionTitle}>Select Vehicle</Text>
            <View style={styles.cabGrid}>
              {CAB_VEHICLE_TYPES.map((v) => (
                <TouchableOpacity
                  key={v.code}
                  style={[styles.cabCard, selectedCab === v.code && styles.cabCardSelected]}
                  onPress={() => setSelectedCab(v.code)}
                >
                  <Text style={styles.cabCardIcon}>{v.icon}</Text>
                  <Text style={styles.cabCardName}>{v.name}</Text>
                  <Text style={styles.cabCardDesc}>{v.description}</Text>
                  <Text style={styles.cabCardPrice}>₹{v.perKm}/km</Text>
                </TouchableOpacity>
              ))}
            </View>

            {routeDistance != null && cabFare != null ? (
              <View style={styles.fareRow}>
                <View>
                  <Text style={styles.fareLabel}>{routeDistance.toFixed(1)} km · {selectedCabInfo?.name}</Text>
                  <Text style={styles.fareHint}>
                    {routeDistance <= 10
                      ? 'Min ₹500 for up to 10 km'
                      : `₹500 for 10 km + ₹${selectedCabInfo?.perKm}/km thereafter`}
                  </Text>
                </View>
                <Text style={styles.fareAmount}>₹{cabFare.toFixed(0)}</Text>
              </View>
            ) : (
              <View style={styles.fareRow}>
                <Text style={styles.fareHint}>Select pickup & drop to see fare</Text>
              </View>
            )}

            <Text style={styles.sectionTitle}>Travel Date</Text>
            <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(!showDatePicker)}>
              <Text style={styles.dateSelectorIcon}>📅</Text>
              <Text style={styles.dateSelectorText}>{formatDateDisplay(selectedDate)}</Text>
              <Text style={styles.dateSelectorChevron}>{showDatePicker ? '▴' : '▾'}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <View style={styles.datePickerDropdown}>
                {generateDates().map((date) => (
                  <TouchableOpacity
                    key={date}
                    style={[styles.dateOption, selectedDate === date && styles.dateOptionSelected]}
                    onPress={() => { setSelectedDate(date); setShowDatePicker(false); }}
                  >
                    <Text style={[styles.dateOptionText, selectedDate === date && styles.dateOptionTextSelected]}>
                      {formatDateDisplay(date)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.bookButton, (!pickup || !dropoff || cabBookingLoading) && styles.bookButtonDisabled]}
              onPress={handleConfirmCab}
              disabled={!pickup || !dropoff || cabBookingLoading}
            >
              {cabBookingLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.bookButtonText}>
                  {pickup && dropoff ? 'Confirm Booking' : 'Select pickup & drop'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}

        <TouchableOpacity style={styles.sosLink} onPress={() => navigation.navigate('SOS')}>
          <Text style={styles.sosLinkText}>Emergency SOS support</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
  loadingText: { marginTop: 16, fontSize: 16, color: COLORS.gray },
  map: { flex: 1 },
  headerOverlay: {
    position: 'absolute', top: 55, left: 16, right: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  greeting: {
    fontSize: 20, fontWeight: 'bold', color: COLORS.white,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  subGreeting: {
    fontSize: 13, color: COLORS.white, marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  notifButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center',
  },
  notifIcon: { fontSize: 18 },
  fieldsCard: {
    position: 'absolute', top: 108, left: 16, right: 16,
    backgroundColor: COLORS.white, borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8,
    elevation: 5, overflow: 'hidden',
  },
  fieldRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  fieldIconWrap: { width: 24, alignItems: 'center' },
  dotPickup: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.success },
  dotDropoff: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.danger },
  fieldBody: { flex: 1 },
  fieldLabel: { fontSize: 10, fontWeight: 'bold', color: COLORS.gray, letterSpacing: 1 },
  fieldValue: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginTop: 2 },
  fieldPlaceholder: { color: COLORS.gray, fontWeight: '400' },
  fieldChevron: { fontSize: 22, color: COLORS.gray },
  divider: { height: 1, backgroundColor: COLORS.grayLight, marginLeft: 48 },
  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 30, maxHeight: '55%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 10,
  },
  modeToggle: {
    flexDirection: 'row', backgroundColor: COLORS.grayLight, borderRadius: 12, padding: 4, marginBottom: 14,
  },
  modeTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  modeTabActive: { backgroundColor: COLORS.primary },
  modeTabText: { fontSize: 14, fontWeight: '600', color: COLORS.gray },
  modeTabTextActive: { color: COLORS.white },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 10, marginTop: 4 },
  vehicleSelector: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  vehicleOption: {
    flex: 1, alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: COLORS.grayLight,
  },
  vehicleOptionSelected: { backgroundColor: COLORS.primary + '20', borderWidth: 2, borderColor: COLORS.primary },
  vehicleIcon: { fontSize: 28, marginBottom: 4 },
  vehicleName: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  vehicleCapacity: { fontSize: 11, color: COLORS.gray },
  cabGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  cabCard: {
    width: '47%', alignItems: 'center', padding: 14, borderRadius: 14,
    backgroundColor: COLORS.grayLight, borderWidth: 2, borderColor: 'transparent',
  },
  cabCardSelected: { backgroundColor: COLORS.primary + '15', borderColor: COLORS.primary },
  cabCardIcon: { fontSize: 32, marginBottom: 6 },
  cabCardName: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  cabCardDesc: { fontSize: 11, color: COLORS.gray, marginTop: 2, textAlign: 'center' },
  cabCardPrice: { fontSize: 13, fontWeight: 'bold', color: COLORS.primary, marginTop: 6 },
  fareRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.grayLight, borderRadius: 12, padding: 12, marginBottom: 12,
  },
  fareLabel: { fontSize: 14, color: COLORS.text },
  fareHint: { fontSize: 14, color: COLORS.gray },
  fareAmount: { fontSize: 18, fontWeight: 'bold', color: COLORS.success },
  paymentRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
  },
  paymentLabel: { fontSize: 14, color: COLORS.gray },
  paymentSelector: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.grayLight,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, gap: 6,
  },
  paymentIcon: { fontSize: 16 },
  paymentText: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  bookButton: {
    backgroundColor: COLORS.primary, borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 4,
  },
  bookButtonDisabled: { backgroundColor: COLORS.gray },
  bookButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  dateSelector: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.grayLight,
    borderRadius: 12, padding: 14, marginBottom: 8, gap: 10,
  },
  dateSelectorIcon: { fontSize: 18 },
  dateSelectorText: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },
  dateSelectorChevron: { fontSize: 14, color: COLORS.gray },
  datePickerDropdown: {
    backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.grayLight,
    marginBottom: 14, overflow: 'hidden',
  },
  dateOption: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: COLORS.grayLight },
  dateOptionSelected: { backgroundColor: COLORS.primary + '15' },
  dateOptionText: { fontSize: 14, color: COLORS.text },
  dateOptionTextSelected: { color: COLORS.primary, fontWeight: 'bold' },
  sosLink: { marginTop: 12, alignItems: 'center' },
  sosLinkText: { fontSize: 13, color: COLORS.danger, fontWeight: '600' },
  confirmContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: 24,
  },
  confirmCard: {
    backgroundColor: COLORS.white, borderRadius: 24, padding: 32, alignItems: 'center', width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 8,
  },
  confirmIcon: { fontSize: 60, marginBottom: 16 },
  confirmTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, marginBottom: 10, textAlign: 'center' },
  confirmMessage: { fontSize: 15, color: COLORS.gray, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  confirmDetails: { width: '100%', backgroundColor: COLORS.grayLight, borderRadius: 14, padding: 16, marginBottom: 24 },
  confirmRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: COLORS.white,
  },
  confirmLabel: { fontSize: 13, color: COLORS.gray },
  confirmValue: { fontSize: 13, color: COLORS.text, fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 10 },
  confirmDoneBtn: { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 48 },
  confirmDoneBtnText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});
