import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import socketService from './socketService';

export const LOCATION_TASK_NAME = 'driver-background-location-task';

export interface Coordinates {
  latitude: number;
  longitude: number;
  address?: string;
}

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }
  if (data) {
    const { locations } = data as { locations?: { coords?: { latitude: number; longitude: number } }[] };
    const latest = locations?.[locations.length - 1];
    if (latest?.coords) {
      const coords = {
        latitude: latest.coords.latitude,
        longitude: latest.coords.longitude,
      };
      socketService.reportLocation(coords.latitude, coords.longitude);
    }
  }
});

export const requestLocationPermission = async (): Promise<boolean> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission required', 'Please enable location permissions');
    return false;
  }
  if (bgStatus !== 'granted') {
    Alert.alert(
      'Background location required',
      'Please allow "Allow all the time" so the app can keep sharing your position for ride requests.'
    );
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
        timeInterval: 2000,
        distanceInterval: 5,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Location timeout')), timeoutMs)
      ),
    ])) as { coords: { latitude: number; longitude: number } };

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (err) {
    console.error('Error getting location:', err);
    return null;
  }
};

export const watchDriverLocation = (
  callback: (location: Coordinates) => void,
  errorCallback?: (error: string) => void
) => {
  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 3000,
      distanceInterval: 10,
    },
    (location) => {
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      socketService.reportLocation(coords.latitude, coords.longitude);
      callback(coords);
    }
  ).catch((err) => {
    errorCallback?.(err.message);
  });
};

export const startBackgroundLocationUpdates = async (): Promise<boolean> => {
  try {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return false;

    const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (alreadyStarted) return true;

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      timeInterval: 10000,
      distanceInterval: 10,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Ride Booking Driver',
        notificationBody: 'Sharing your live location to receive ride requests',
        notificationColor: '#4F46E5',
      },
    });
    return true;
  } catch (err) {
    console.warn('Background location updates unavailable:', err);
    return false;
  }
};

export const stopBackgroundLocationUpdates = async () => {
  try {
    const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (started) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  } catch (err) {
    console.warn('Failed to stop background location updates:', err);
  }
};

import { Linking, Platform } from 'react-native';

export const openDirections = (latitude: number, longitude: number) => {
  const url = Platform.select({
    ios: `http://maps.apple.com/?ll=${latitude},${longitude}&dirflg=d&daddr=${latitude},${longitude}`,
    android: `google.navigation:q=${latitude},${longitude}`,
  });
  if (url) {
    Linking.openURL(url);
  }
};