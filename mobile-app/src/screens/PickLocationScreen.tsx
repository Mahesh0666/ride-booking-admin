import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { COLORS } from '../constants/config';
import { getCurrentLocation, getInitialRegion, Coordinates } from '../utils/location';
import { setPendingLocation } from '../utils/locationStore';
import { autocompleteAddresses, reverseGeocode, Place } from '../services/placesService';
import addressService, { SavedAddress } from '../services/addressService';

interface PickLocationScreenProps {
  navigation: any;
  route: {
    params: {
      mode: 'pickup' | 'dropoff';
      initial?: Coordinates;
      center?: Coordinates | null;
    };
  };
}

const DEFAULT_DELHI = { latitude: 28.6139, longitude: 77.209 };

export default function PickLocationScreen({ navigation, route }: PickLocationScreenProps) {
  const { mode, initial, center } = route.params;
  const isPickup = mode === 'pickup';

  const defaultCenter = initial || center;

  const [location, setLocation] = useState<Coordinates | null>(initial || null);
  const [mapRegion, setMapRegion] = useState<any>(
    defaultCenter
      ? getInitialRegion(defaultCenter.latitude, defaultCenter.longitude, 0.02, 0.02)
      : getInitialRegion(DEFAULT_DELHI.latitude, DEFAULT_DELHI.longitude, 0.02, 0.02)
  );
  const [query, setQuery] = useState(initial?.address || '');
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingCurrent, setIsGettingCurrent] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [pinMode, setPinMode] = useState(false);

  const regionDebounce = useRef<any>(null);
  const pinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadSaved();
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const delay = setTimeout(async () => {
      setIsSearching(true);
      const fallback = savedAddresses.map<Place>((a) => ({
        id: a._id,
        label: a.label,
        address: a.address,
        latitude: a.latitude || 0,
        longitude: a.longitude || 0,
        source: 'saved',
      }));
      const results = await autocompleteAddresses(query, fallback);
      setSuggestions(results);
      setIsSearching(false);
    }, 350);
    return () => clearTimeout(delay);
  }, [query, savedAddresses]);

  const loadSaved = async () => {
    try {
      const data = await addressService.getAddresses();
      setSavedAddresses(data.addresses || []);
    } catch (err) {
      // ignore
    }
  };

  const resolveAddress = useCallback(async (lat: number, lng: number) => {
    setIsResolvingAddress(true);
    const address = await reverseGeocode(lat, lng);
    setIsResolvingAddress(false);
    setLocation((prev) => ({
      latitude: lat,
      longitude: lng,
      address: address || prev?.address || undefined,
    }));
  }, []);

  const enterPinMode = () => {
    setPinMode(true);
    Animated.spring(pinAnim, { toValue: 1, useNativeDriver: true, friction: 5, tension: 120 }).start();
    if (mapRegion) resolveAddress(mapRegion.latitude, mapRegion.longitude);
  };

  const exitPinMode = () => {
    setPinMode(false);
    Animated.timing(pinAnim, { toValue: 0, useNativeDriver: true, duration: 150 }).start();
  };

  const handleUseCurrentLocation = async () => {
    setIsGettingCurrent(true);
    exitPinMode();
    const loc = await getCurrentLocation();
    setIsGettingCurrent(false);
    if (!loc) {
      Alert.alert('Could not get location', 'Please check your location permission and try again.');
      return;
    }
    if (!loc.address) {
      const address = await reverseGeocode(loc.latitude, loc.longitude);
      loc.address = address || 'Current location';
    }
    setLocation(loc);
    setQuery(loc.address);
    setMapRegion(getInitialRegion(loc.latitude, loc.longitude, 0.02, 0.02));
  };

  const handlePickSuggestion = (place: Place) => {
    exitPinMode();
    setQuery(place.address);
    setSuggestions([]);
    setLocation({
      latitude: place.latitude,
      longitude: place.longitude,
      address: place.address,
    });
    setMapRegion(getInitialRegion(place.latitude, place.longitude, 0.02, 0.02));
  };

  const handleRegionChange = (region: any) => {
    if (!pinMode) return;
    setMapRegion(region);
    if (regionDebounce.current) clearTimeout(regionDebounce.current);
    regionDebounce.current = setTimeout(() => {
      resolveAddress(region.latitude, region.longitude);
    }, 350);
  };

  const handleConfirm = () => {
    if (!location) {
      Alert.alert('Select a location', 'Please search, use current location, or drop a pin first.');
      return;
    }
    setPendingLocation(mode, location);
    navigation.goBack();
  };

  const showMapView =
    suggestions.length === 0 && query.trim().length < 2 && !isSearching;

  const pinnedScale = pinAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <Text style={styles.searchPin}>{isPickup ? '🚩' : '🏁'}</Text>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder={isPickup ? 'Search pickup address' : 'Search drop-off address'}
            placeholderTextColor={COLORS.gray}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setSuggestions([]); }} hitSlop={{ left: 8, right: 8 }}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickAction, isGettingCurrent && styles.quickActionBusy]}
          onPress={handleUseCurrentLocation}
        >
          <Text style={styles.quickIcon}>📍</Text>
          <Text style={styles.quickText}>Use current location</Text>
          {isGettingCurrent ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Text style={styles.quickChevron}>›</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickAction, pinMode && styles.quickActionActive]}
          onPress={() => (pinMode ? exitPinMode() : enterPinMode())}
        >
          <Text style={styles.quickIcon}>📌</Text>
          <Text style={styles.quickText}>{pinMode ? 'Dragging pin…' : 'Drop a pin on map'}</Text>
          <View style={[styles.toggleDot, pinMode && styles.toggleDotActive]} />
        </TouchableOpacity>
      </View>

      {isSearching ? (
        <View style={styles.suggestionsLoading}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.suggestionsLoadingText}>Searching addresses...</Text>
        </View>
      ) : suggestions.length > 0 ? (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.id}
          style={styles.suggestionsList}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.suggestionRow} onPress={() => handlePickSuggestion(item)}>
              <View style={styles.suggestionIconWrap}>
                <Text style={styles.suggestionIcon}>
                  {item.source === 'saved' ? '★' : '⌖'}
                </Text>
              </View>
              <View style={styles.suggestionBody}>
                <Text style={styles.suggestionLabel}>
                  {item.source === 'saved' ? item.label : item.address.split(',').slice(0, 2).join(',')}
                </Text>
                <Text style={styles.suggestionAddress} numberOfLines={2}>
                  {item.address}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : savedAddresses.length > 0 && query.trim().length === 0 ? (
        <FlatList
          data={savedAddresses}
          keyExtractor={(item) => item._id}
          style={styles.suggestionsList}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={<Text style={styles.savedTitle}>Saved addresses</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.suggestionRow}
              onPress={() =>
                handlePickSuggestion({
                  id: item._id,
                  label: item.label,
                  address: item.address,
                  latitude: item.latitude || 0,
                  longitude: item.longitude || 0,
                  source: 'saved',
                })
              }
            >
              <View style={styles.suggestionIconWrap}>
                <Text style={styles.suggestionIcon}>
                  {item.label === 'Home' ? '🏠' : item.label === 'Work' ? '💼' : '📍'}
                </Text>
              </View>
              <View style={styles.suggestionBody}>
                <Text style={styles.suggestionLabel}>{item.label}</Text>
                <Text style={styles.suggestionAddress} numberOfLines={2}>
                  {item.address}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.mapWrap}>
          <MapView
            style={styles.map}
            region={mapRegion}
            provider={PROVIDER_GOOGLE}
            onRegionChangeComplete={handleRegionChange}
            showsMyLocationButton={true}
            showsUserLocation={true}
            onPress={() => {
              if (pinMode) exitPinMode();
            }}
          >
            {location && !pinMode && (
              <Marker
                coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                pinColor={isPickup ? COLORS.success : COLORS.danger}
                anchor={{ x: 0.5, y: 0.5 }}
              />
            )}
          </MapView>

          {pinMode ? (
            <View style={styles.centerPinWrap} pointerEvents="none">
              <Animated.View style={{ transform: [{ scale: pinnedScale }] }}>
                <Text style={styles.centerPinActive}>📍</Text>
              </Animated.View>
            </View>
          ) : (
            location &&
            !isResolvingAddress && (
              <View style={styles.selectedBadge} pointerEvents="none">
                <Text style={styles.selectedBadgeText}>✓ Pin dropped</Text>
              </View>
            )
          )}

          {pinMode && (
            <View style={styles.pinHint} pointerEvents="none">
              <Text style={styles.pinHintText}>Drag the map to adjust the pin</Text>
            </View>
          )}

          {isResolvingAddress && (
            <View style={styles.resolvingBadge} pointerEvents="none">
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.resolvingText}>Resolving address…</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.footerAddressWrap}>
          <Text style={styles.footerLabel}>{isPickup ? 'Pickup point' : 'Drop point'}</Text>
          {location?.address ? (
            <Text style={styles.footerAddress} numberOfLines={2}>
              {location.address}
            </Text>
          ) : location ? (
            <Text style={styles.footerAddressMuted}>Location selected on map</Text>
          ) : (
            <Text style={styles.footerAddressPlaceholder}>
              Move the map, search, or use current location to set {isPickup ? 'pickup' : 'drop'}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.confirmButton, !location && styles.confirmDisabled]}
          onPress={handleConfirm}
          disabled={!location}
        >
          <Text style={styles.confirmText}>Confirm {isPickup ? 'Pickup' : 'Drop'} Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 50 : 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  backText: { fontSize: 32, color: COLORS.text, marginTop: -8 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.grayLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchPin: { fontSize: 16 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: COLORS.text },
  clearText: { fontSize: 16, color: COLORS.gray },
  quickActions: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.grayLight,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  quickActionBusy: { opacity: 0.7 },
  quickActionActive: { backgroundColor: COLORS.primary + '18', borderWidth: 1.5, borderColor: COLORS.primary },
  quickIcon: { fontSize: 18 },
  quickText: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },
  quickChevron: { fontSize: 20, color: COLORS.gray },
  toggleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.grayLight,
    borderWidth: 1.5,
    borderColor: COLORS.gray,
  },
  toggleDotActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  suggestionsLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  suggestionsLoadingText: { color: COLORS.gray, fontSize: 14 },
  suggestionsList: { flex: 1, paddingHorizontal: 16 },
  savedTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.gray,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 4,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  suggestionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionIcon: { fontSize: 16, color: COLORS.primary },
  suggestionBody: { flex: 1 },
  suggestionLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  suggestionAddress: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  mapWrap: { flex: 1 },
  map: { flex: 1 },
  centerPinWrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -32,
    marginLeft: -16,
  },
  centerPinActive: { fontSize: 32 },
  selectedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectedBadgeText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  pinHint: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  pinHintText: { fontSize: 13, color: COLORS.text },
  resolvingBadge: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  resolvingText: { fontSize: 13, color: COLORS.text },
  footer: {
    padding: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
  },
  footerAddressWrap: { marginBottom: 12 },
  footerLabel: { fontSize: 12, color: COLORS.gray, fontWeight: '600', textTransform: 'uppercase' },
  footerAddress: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginTop: 2 },
  footerAddressMuted: { fontSize: 14, color: COLORS.textLight, marginTop: 2 },
  footerAddressPlaceholder: { fontSize: 14, color: COLORS.gray, marginTop: 2 },
  confirmButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  confirmDisabled: { backgroundColor: COLORS.gray },
  confirmText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});