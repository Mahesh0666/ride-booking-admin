import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, DRIVER_STATUS_COLORS } from '../constants/config';
import driverService from '../services/driverService';

interface Ride {
  _id: string;
  status: string;
  fare?: number;
  createdAt: string;
  pickupLocation?: { address?: string };
  dropoffLocation?: { address?: string };
  rider?: { name?: string; rating?: number };
}

const STATUS_LABELS: Record<string, string> = {
  requested: 'Requested',
  accepted: 'Accepted',
  arriving: 'Arriving',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  scheduled: 'Scheduled',
};

export default function TripsScreen({ navigation }: any) {
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTrips = useCallback(async () => {
    try {
      const data = await driverService.getMyRides();
      setRides(data.rides || []);
    } catch (err) {
      // keep previous data
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips])
  );

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Trips</Text>
      </View>

      {rides.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🛺</Text>
          <Text style={styles.emptyText}>No trips yet</Text>
          <Text style={styles.emptySub}>Your accepted rides will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTrips(); }} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const statusColor = DRIVER_STATUS_COLORS[item.status] || COLORS.gray;
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {STATUS_LABELS[item.status] || item.status}
                    </Text>
                  </View>
                  {item.fare != null && (
                    <Text style={styles.fare}>₹{(item.fare * 0.75).toFixed(2)}</Text>
                  )}
                </View>

                <Text style={styles.route} numberOfLines={1}>
                  {item.pickupLocation?.address || 'Pickup'} → {item.dropoffLocation?.address || 'Drop'}
                </Text>

                {item.rider?.name && (
                  <Text style={styles.rider}>
                    Rider: {item.rider.name}
                    {item.rider.rating ? ` · ${item.rider.rating.toFixed(1)} ★` : ''}
                  </Text>
                )}

                <Text style={styles.meta}>
                  {formatDate(item.createdAt)} · {formatTime(item.createdAt)}
                </Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
  header: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  backText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, color: COLORS.grayLight, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  emptySub: { fontSize: 14, color: COLORS.gray, marginTop: 4 },
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
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 14, fontWeight: '600' },
  fare: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  route: { fontSize: 15, color: COLORS.text, fontWeight: '500', marginBottom: 6 },
  rider: { fontSize: 13, color: COLORS.textLight, marginBottom: 4 },
  meta: { fontSize: 13, color: COLORS.gray },
});
