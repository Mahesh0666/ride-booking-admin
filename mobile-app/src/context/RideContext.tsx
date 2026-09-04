import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import socketService from '../services/socketService';
import rideService from '../services/rideService';
import { navigationRef } from '../navigation/navigationRef';

const ACTIVE_STATUSES = ['scheduled', 'requested', 'accepted', 'arriving', 'in_progress'];

interface RideContextValue {
  activeRide: any | null;
  minimized: boolean;
  driverPosition: { latitude: number; longitude: number } | null;
  highDemand: { rideId: string; suggestedTip: number } | null;
  setActiveRide: (ride: any) => void;
  updateActiveRide: (patch: any) => void;
  clearActiveRide: () => void;
  minimizeRide: () => void;
  expandRide: () => void;
  subscribeToRide: (rideId: string) => void;
  clearHighDemand: () => void;
}

const RideContext = createContext<RideContextValue>({
  activeRide: null,
  minimized: false,
  driverPosition: null,
  highDemand: null,
  setActiveRide: () => {},
  updateActiveRide: () => {},
  clearActiveRide: () => {},
  minimizeRide: () => {},
  expandRide: () => {},
  subscribeToRide: () => {},
  clearHighDemand: () => {},
});

export function RideProvider({ children }: any) {
  const { user } = useAuth();
  const [activeRide, setActiveRideState] = useState<any>(null);
  const [minimized, setMinimized] = useState(false);
  const [highDemand, setHighDemand] = useState<{ rideId: string; suggestedTip: number } | null>(null);
  const [driverPosition, setDriverPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const activeRideRef = useRef<any>(null);
  activeRideRef.current = activeRide;
  const completedNavRef = useRef<Record<string, boolean>>({});

  const setActiveRide = (ride: any) => {
    setHighDemand(null);
    setActiveRideState((prev: any) => (prev && ride && prev._id === ride._id ? { ...prev, ...ride } : ride));
    if (ride?._id) socketService.subscribeToRideUpdates(ride._id);
  };

  const updateActiveRide = (patch: any) => {
    setActiveRideState((prev: any) => (prev ? { ...prev, ...patch } : patch));
  };

  const clearActiveRide = () => {
    setActiveRideState(null);
    setDriverPosition(null);
    setMinimized(false);
    setHighDemand(null);
  };

  const minimizeRide = () => setMinimized(true);
  const expandRide = () => setMinimized(false);

  const clearHighDemand = () => setHighDemand(null);

  const subscribeToRide = (rideId: string) => {
    socketService.subscribeToRideUpdates(rideId);
  };

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      if (!user) {
        socketService.disconnect();
        clearActiveRide();
        return;
      }

      const authToken = (user as any).token || (await AsyncStorage.getItem('token'));
      await socketService.connect(authToken);

      // Rehydrate an active ride on app start / login so a running ride
      // stays visible even after the app was killed.
      if (mounted) {
        try {
          const data = await rideService.getMyRides();
          const rides = data?.rides || [];
          const running = rides.find(
            (r: any) => r.status && ACTIVE_STATUSES.includes(r.status)
          );
          if (running) setActiveRide(running);
        } catch (e) {
          // ignore — no network/active ride
        }
      }

      socketService.on('ride_accepted', (updatedRide: any) => {
        if (updatedRide?._id) {
          setActiveRideState((prev: any) =>
            prev && prev._id === updatedRide._id ? { ...prev, ...updatedRide } : updatedRide
          );
        }
      });

      socketService.on('ride_status_updated', (updatedRide: any) => {
        const rideId = updatedRide?.rideId || updatedRide?._id;
        const status = updatedRide?.status;
        setActiveRideState((prev: any) => {
          if (!prev) return updatedRide?._id ? updatedRide : prev;
          if (updatedRide?.rideId && !updatedRide.pickupLocation) {
            return prev._id === rideId ? { ...prev, status } : prev;
          }
          return prev ? (prev._id === updatedRide._id ? { ...prev, ...updatedRide } : prev) : updatedRide;
        });

        if (status === 'completed' && rideId) {
          if (!completedNavRef.current[rideId]) {
            completedNavRef.current[rideId] = true;
            setTimeout(() => {
              if (navigationRef.isReady()) {
                navigationRef.navigate('Rating', { rideId });
              }
            }, 1500);
          }
        } else if (status === 'cancelled' && rideId) {
          clearActiveRide();
        }
      });

      socketService.on('ride_cancelled', (data: any) => {
        const rideId = data?.rideId || data?._id;
        if (rideId && activeRideRef.current?._id === rideId) {
          clearActiveRide();
        }
      });

      socketService.on('driver_position_update', (data: any) => {
        if (data?.location) setDriverPosition(data.location);
      });

      socketService.on('ride_high_demand', (data: any) => {
        const rideId = data?.rideId;
        if (rideId && activeRideRef.current?._id === rideId) {
          setActiveRideState(null);
          setDriverPosition(null);
          setMinimized(false);
          setHighDemand({ rideId, suggestedTip: data?.suggestedTip || 0 });
          Alert.alert('High demand', data?.message || 'No driver available right now. Try again with an extra tip.');
        }
      });
    };

    setup();

    return () => {
      mounted = false;
      socketService.off('ride_accepted');
      socketService.off('ride_status_updated');
      socketService.off('ride_cancelled');
      socketService.off('driver_position_update');
      socketService.off('ride_high_demand');
    };
  }, [user?._id]);

  return (
    <RideContext.Provider
       value={{
         activeRide,
         minimized,
         driverPosition,
         highDemand,
         setActiveRide,
         updateActiveRide,
         clearActiveRide,
         minimizeRide,
         expandRide,
         subscribeToRide,
         clearHighDemand,
       }}
    >
      {children}
    </RideContext.Provider>
  );
}

export function useRide() {
  return useContext(RideContext);
}