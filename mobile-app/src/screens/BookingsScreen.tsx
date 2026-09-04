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

export default function BookingsScreen({ navigation }: any) {
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadRides();
    }, [])
  );

  const loadRides = async () => {
    try {
      const data = await rideService.getMyRides();
      setRides(data.rides || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRides();
  };

  const getStatusColor = (status: string) => RIDER_STATUS_COLORS[status] || COLORS.gray;

  const getStatusLabel = (ride: Ride) => {
    if (ride.isScheduled && ride.status === 'scheduled') {
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
    return labels[ride.status] || ride.status;
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

  const openRide = (ride: Ride) => {
    if (['scheduled'].includes(ride.status)) {
      Alert.alert(
        'Scheduled ride',
        ride.scheduledAt
          ? `Scheduled for ${new Date(ride.scheduledAt).toLocaleString()}`
          : 'Scheduled ride',
        [{ text: 'OK' }]
      );
      return;
    }
    navigation.navigate('RideStatus', { rideId: ride._id });
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

      {rides.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>☰</Text>
          <Text style={styles.emptyText}>No rides yet</Text>
          <Text style={styles.emptySubtext}>Your ride history will appear here</Text>
          <TouchableOpacity style={styles.bookButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.bookButtonText}>Book a ride</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => openRide(item)}>
              <View style={styles.cardHeader}>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {getStatusLabel(item)}
                  </Text>
                </View>
                {item.fare != null && (
                  <Text style={styles.fare}>₹{item.fare.toFixed(2)}</Text>
                )}
              </View>

              <Text style={styles.route}>
                {item.pickupLocation?.address || 'Pickup'} → {item.dropoffLocation?.address || 'Dropoff'}
              </Text>

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