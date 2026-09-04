import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS, VEHICLE_ICONS, RIDER_STATUS_COLORS } from '../constants/config';
import rideService from '../services/rideService';

export default function RideHistoryScreen({ navigation }: any) {
  const [rides, setRides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRides();
  }, []);

  const loadRides = async () => {
    try {
      const response = await rideService.getMyRides();
      setRides(response.rides || []);
    } catch (err) {
      console.error('Failed to load rides:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderRide = ({ item }: { item: any }) => {
    const statusColor = RIDER_STATUS_COLORS[item.status] || COLORS.gray;

    return (
      <TouchableOpacity
        style={styles.rideCard}
        onPress={() => navigation.navigate('RideStatus', { rideId: item._id })}
      >
        <View style={styles.rideHeader}>
          <View style={styles.vehicleBadge}>
            <Text style={styles.vehicleIcon}>{VEHICLE_ICONS.auto}</Text>
          </View>
          <View style={styles.rideInfo}>
            <Text style={styles.rideDate}>{formatDate(item.createdAt)} · {formatTime(item.createdAt)}</Text>
            <Text style={styles.rideRoute}>{item.pickupLocation?.address} → {item.dropoffLocation?.address}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.rideFooter}>
          <Text style={styles.fareLabel}>Total</Text>
          <Text style={styles.fareAmount}>₹{item.fare?.toFixed(2)}</Text>
          {item.rating?.rated && (
            <Text style={styles.rating}>You rated: {item.rating.score} ★</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  if (rides.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🚗</Text>
        <Text style={styles.emptyTitle}>No rides yet</Text>
        <Text style={styles.emptyText}>Your ride history will appear here</Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('Home' as never)}
        >
          <Text style={styles.emptyButtonText}>Book your first ride</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride History</Text>
      </View>

      <FlatList
        data={rides}
        keyExtractor={(item) => item._id}
        renderItem={renderRide}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  backButton: {
    fontSize: 24,
    color: COLORS.text,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  listContainer: { padding: 16 },
  rideCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  rideHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  vehicleBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vehicleIcon: { fontSize: 24 },
  rideInfo: { flex: 1 },
  rideDate: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 2,
  },
  rideRoute: {
    fontSize: 14,
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
    paddingTop: 12,
  },
  fareLabel: {
    fontSize: 12,
    color: COLORS.gray,
  },
  fareAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  rating: {
    fontSize: 12,
    color: COLORS.warning,
  },
});