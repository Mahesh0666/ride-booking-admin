import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RIDER_STATUS_COLORS } from '../constants/config';
import rideService from '../services/rideService';

interface Ride {
  _id: string;
  status: string;
  isScheduled?: boolean;
  scheduledAt?: string;
  pickupLocation?: { address?: string };
  dropoffLocation?: { address?: string };
  fare?: number;
  vehicleType?: string;
  createdAt: string;
  driver?: { name?: string; rating?: number };
}

interface CabBookingItem {
  _id: string;
  type: 'cab';
  status: string;
  pickup?: { address?: string };
  dropoff?: { address?: string };
  fare?: number;
  vehicleType?: string;
  travelDate?: string;
  createdAt: string;
  assignedDriver?: {
    name?: string;
    phone?: string;
    vehicleNumber?: string;
    vehicleModel?: string;
  };
}

export default function BookingsScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadAllBookings();
    }, [])
  );

  const loadAllBookings = async () => {
    try {
      const [ridesRes, cabsRes] = await Promise.all([
        rideService.getMyRides().catch(() => ({ rides: [] })),
        rideService.getMyCabBookings().catch(() => ({ bookings: [] })),
      ]);

      const rides = (ridesRes.rides || []).map((r: any) => ({ ...r, type: 'ride' }));
      const cabs = (cabsRes.bookings || []).map((c: any) => ({ ...c, type: 'cab' }));

      const combined = [...rides, ...cabs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setItems(combined);
    } catch (err) {
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAllBookings();
  };

  const getStatusColor = (status: string) => RIDER_STATUS_COLORS[status] || COLORS.primary;

  const getStatusLabel = (item: any) => {
    if (item.type === 'cab') {
      if (item.status === 'pending') return 'Pending Admin Assignment';
      if (item.status === 'confirmed' || item.status === 'assigned') return 'Cab Driver Assigned';
      if (item.status === 'completed') return 'Completed';
      if (item.status === 'cancelled') return 'Cancelled';
      return item.status;
    }

    if (item.isScheduled && item.status === 'scheduled') {
      return 'Scheduled';
    }
    const labels: Record<string, string> = {
      requested: 'Searching driver',
      accepted: 'Driver on the way',
      arriving: 'Driver arriving',
      in_progress: 'In progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return labels[item.status] || item.status;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openRide = (item: any) => {
    if (item.type === 'cab') return;
    if (['scheduled'].includes(item.status)) {
      Alert.alert(
        'Scheduled ride',
        item.scheduledAt
          ? `Scheduled for ${new Date(item.scheduledAt).toLocaleString()}`
          : 'Scheduled ride',
        [{ text: 'OK' }]
      );
      return;
    }
    navigation.navigate('RideStatus', { rideId: item._id });
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Bookings</Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>☰</Text>
          <Text style={styles.emptyText}>No rides yet</Text>
          <Text style={styles.emptySubtext}>Your ride & cab booking history will appear here</Text>
          <TouchableOpacity style={styles.bookButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.bookButtonText}>Book a ride</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => openRide(item)} activeOpacity={item.type === 'cab' ? 1 : 0.7}>
              <View style={styles.cardHeader}>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {item.type === 'cab' ? `[CAB] ${getStatusLabel(item)}` : getStatusLabel(item)}
                  </Text>
                </View>
                {item.fare != null && (
                  <Text style={styles.fare}>₹{item.fare.toFixed(2)}</Text>
                )}
              </View>

              <Text style={styles.route}>
                {item.type === 'cab'
                  ? `${item.pickup?.address || 'Pickup'} → ${item.dropoff?.address || 'Dropoff'}`
                  : `${item.pickupLocation?.address || 'Pickup'} → ${item.dropoffLocation?.address || 'Dropoff'}`}
              </Text>

              {item.type === 'cab' && item.assignedDriver && item.assignedDriver.name ? (
                <View style={styles.driverBox}>
                  <Text style={styles.driverBoxTitle}>Assigned Cab Driver:</Text>
                  <Text style={styles.driverDetailText}>👤 Name: {item.assignedDriver.name}</Text>
                  <Text style={styles.driverDetailText}>📞 Phone: {item.assignedDriver.phone}</Text>
                  {item.assignedDriver.vehicleNumber ? (
                    <Text style={styles.driverDetailText}>🚗 Vehicle: {item.assignedDriver.vehicleNumber} {item.assignedDriver.vehicleModel ? `(${item.assignedDriver.vehicleModel})` : ''}</Text>
                  ) : null}
                </View>
              ) : item.type === 'cab' ? (
                <Text style={styles.pendingText}>⏳ Details sent to admin. Admin will assign a cab driver shortly.</Text>
              ) : null}

              <Text style={styles.meta}>
                {formatDate(item.createdAt)} · {formatTime(item.createdAt)}
                {item.isScheduled && item.scheduledAt
                  ? ` · Scheduled ${formatTime(item.scheduledAt)}`
                  : ''}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
  header: {
    padding: 20,
    paddingTop: 55,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 14, fontWeight: '600' },
  fare: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  route: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
    marginBottom: 6,
  },
  meta: { fontSize: 13, color: COLORS.gray },
  driverBox: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginVertical: 8,
  },
  driverBoxTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 4,
  },
  driverDetailText: {
    fontSize: 13,
    color: '#15803D',
    marginTop: 2,
    fontWeight: '500',
  },
  pendingText: {
    fontSize: 13,
    color: '#D97706',
    fontStyle: 'italic',
    marginVertical: 6,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: { fontSize: 48, color: COLORS.grayLight, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  emptySubtext: { fontSize: 14, color: COLORS.gray, marginTop: 4, marginBottom: 20, textAlign: 'center' },
  bookButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  bookButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});