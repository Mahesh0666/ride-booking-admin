import * as Location from 'expo-location';
import { Platform, Alert } from 'react-native';

export interface Coordinates {
  latitude: number;
  longitude: number;
  address?: string;
}

export const requestLocationPermission = async (): Promise<boolean> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Permission required',
      'Please enable location permissions to use the app',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
};

export const getCurrentLocation = async (timeoutMs = 10000): Promise<Coordinates | null> => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return null;

    const location = (await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Location timeout')), timeoutMs)
      ),
    ])) as { coords: { latitude: number; longitude: number } };

    const coords: Coordinates = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    try {
      const [reverseGeocode] = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      if (reverseGeocode) {
        coords.address = `${reverseGeocode.street || ''} ${reverseGeocode.city || ''}`.trim() ||
          reverseGeocode.formattedAddress;
      }
    } catch (err) {
      console.warn('Reverse geocode failed:', err);
    }

    return coords;
  } catch (err) {
    console.error('Error getting location:', err);
    return null;
  }
};

export const watchLocation = (
  callback: (location: Coordinates) => void,
  errorCallback?: (error: string) => void
) => {
  Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 10,
    },
    (location) => {
      const coords: Coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      callback(coords);
    }
  ).catch((err) => {
    console.error('Location watch error:', err);
    errorCallback?.(err.message);
  });
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const getInitialRegion = (latitude: number, longitude: number, latitudeDelta = 0.0922, longitudeDelta = 0.0421) => ({
  latitude,
  longitude,
  latitudeDelta,
  longitudeDelta,
});