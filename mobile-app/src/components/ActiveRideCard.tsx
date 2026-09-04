import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useRide } from '../context/RideContext';
import { COLORS } from '../constants/config';
import rideService from '../services/rideService';

const STATUS_TEXT: Record<string, string> = {
  scheduled: 'Scheduled ride',
  requested: 'Looking for a driver…',
  accepted: 'Driver on the way',
  arriving: 'Driver has arrived',
  in_progress: 'Ride in progress',
};

export default function ActiveRideCard() {
  const navigation = useNavigation<any>();
  const { activeRide, minimized, driverPosition, clearActiveRide, expandRide } = useRide();
  const [cancelling, setCancelling] = useState(false);

  if (!activeRide?._id) return null;

  const status = activeRide.status;
  if (!STATUS_TEXT[status]) return null;

  const isSearching = status === 'requested' || status === 'scheduled';
  const driverAssigned = ['accepted', 'arriving', 'in_progress'].includes(status);
  const canCancel = ['scheduled', 'requested', 'accepted', 'arriving'].includes(status);
  const label = minimized && isSearching ? 'Looking for a driver…' : STATUS_TEXT[status];
  const pickup = activeRide.pickupLocation?.address || 'Your location';
  const dropoff = activeRide.dropoffLocation?.address || 'Dropoff';
  const vehicle = (activeRide.vehicleType || 'auto').toUpperCase();
  const fare = activeRide.fare != null ? `₹${Number(activeRide.fare).toFixed(2)}` : null;

  const open = () => {
    if (!activeRide?._id) return;
    expandRide();
    navigation.navigate('RideStatus', { rideId: activeRide._id });
  };

  const handleClear = () => {
    if (!activeRide?._id || !canCancel) return;
    Alert.alert(
      'Stop looking for a ride?',
      'This will cancel your current booking. You can start a fresh ride anytime.',
      [
        { text: 'Keep searching', style: 'cancel' },
        {
          text: 'Cancel this ride',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await rideService.cancelRide(activeRide._id, 'User dismissed booking');
              clearActiveRide();
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error?.message || 'Could not cancel the ride');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.card, minimized && styles.cardCollapsed]}
      activeOpacity={0.92}
      onPress={open}
    >
      <View style={[styles.ridedot, isSearching && styles.ridedotPulse, STATUS_TEXT[status] === 'Ride in progress' && styles.ridedotActive]} />

      <View style={styles.info}>
         <Text style={styles.statusText}>
           {label}
           {driverAssigned && activeRide.driver?.name ? ` · ${activeRide.driver.name}` : ''}
         </Text>
         {driverAssigned && activeRide.driver?.phone ? (
           <Text style={styles.driverPhone}>{activeRide.driver.phone}</Text>
         ) : null}
        <Text style={styles.routeText} numberOfLines={1}>
          {pickup} → {dropoff}
        </Text>
        <Text style={styles.metaText}>
          {vehicle}
          {fare ? ` · ${fare}` : ''}
        </Text>
      </View>

      {activeRide.status === 'requested' && driverPosition && (
        <View style={styles.liveWrap}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      )}

      <TouchableOpacity style={styles.openBtn} onPress={open}>
        <Text style={styles.openBtnText}>{minimized ? 'Open' : activeRide.status === 'in_progress' ? 'Track' : 'View'}</Text>
      </TouchableOpacity>

      {canCancel && (
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={handleClear}
          disabled={cancelling}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {cancelling ? <ActivityIndicator size="small" color={COLORS.gray} /> : <Text style={styles.closeBtnText}>✕</Text>}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 70,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    zIndex: 50,
  },
  cardCollapsed: {
    paddingVertical: 12,
  },
  ridedot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    marginRight: 12,
  },
  ridedotPulse: {
    backgroundColor: COLORS.warning,
  },
  ridedotActive: {
    backgroundColor: COLORS.success,
  },
  info: { flex: 1 },
  statusText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  routeText: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 3,
  },
  driverPhone: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 1,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 2,
  },
  liveWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  openBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginLeft: 8,
  },
  openBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    backgroundColor: COLORS.grayLight,
  },
  closeBtnText: {
    color: COLORS.gray,
    fontSize: 16,
    fontWeight: 'bold',
  },
});