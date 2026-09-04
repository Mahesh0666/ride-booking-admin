import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../constants/config';
import driverService from '../services/driverService';

interface Ride {
  _id: string;
  status: string;
  fare?: number;
  completedAt?: string;
  createdAt: string;
  pickupLocation?: { address?: string };
  dropoffLocation?: { address?: string };
}

const DRIVER_COMMISSION = 0.9;

export default function EarningsScreen({ navigation }: any) {
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadRides = useCallback(async () => {
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
      loadRides();
    }, [loadRides])
  );

  const completed = rides.filter((r) => r.status === 'completed');
  const netFare = (r: Ride) => (r.fare || 0) * DRIVER_COMMISSION;

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const sumSince = (from: Date) =>
    completed
      .filter((r) => {
        const d = new Date(r.completedAt || r.createdAt);
        return d >= from;
      })
      .reduce((acc, r) => acc + netFare(r), 0);

  const todayEarnings = sumSince(startOfToday);
  const weekEarnings = sumSince(startOfWeek);
  const totalEarnings = completed.reduce((acc, r) => acc + netFare(r), 0);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadRides(); }} />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings</Text>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Total Earnings</Text>
        <Text style={styles.heroValue}>₹{totalEarnings.toFixed(2)}</Text>
        <Text style={styles.heroSub}>{completed.length} completed trips</Text>
      </View>

      <View style={styles.breakdownRow}>
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownValue}>₹{todayEarnings.toFixed(2)}</Text>
          <Text style={styles.breakdownLabel}>Today</Text>
        </View>
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownValue}>₹{weekEarnings.toFixed(2)}</Text>
          <Text style={styles.breakdownLabel}>This Week</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Trips</Text>
      {completed.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💰</Text>
          <Text style={styles.emptyText}>No earnings yet</Text>
          <Text style={styles.emptySub}>Completed trips will appear here</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {completed.slice(0, 10).map((r) => (
            <View key={r._id} style={styles.tripCard}>
              <View style={styles.tripHeader}>
                <Text style={styles.tripRoute} numberOfLines={1}>
                  {r.pickupLocation?.address || 'Pickup'} → {r.dropoffLocation?.address || 'Drop'}
                </Text>
                <Text style={styles.tripFare}>₹{netFare(r).toFixed(2)}</Text>
              </View>
              <Text style={styles.tripDate}>
                {new Date(r.completedAt || r.createdAt).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <Text style={styles.tripBreakdown}>
                Fare ₹{(r.fare || 0).toFixed(2)} · Commission ₹{((r.fare || 0) * 0.25).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
  content: { paddingBottom: 40 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  heroCard: {
    marginHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
  },
  heroLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  heroValue: { color: COLORS.white, fontSize: 34, fontWeight: 'bold', marginTop: 4 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 4 },
  breakdownRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 14 },
  breakdownCard: {
    flex: 1,
    backgroundColor: COLORS.grayLight,
    borderRadius: 16,
    padding: 16,
  },
  breakdownValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  breakdownLabel: { fontSize: 12, color: COLORS.gray, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, margin: 16, marginBottom: 8 },
  empty: { alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, color: COLORS.grayLight, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  emptySub: { fontSize: 14, color: COLORS.gray, marginTop: 4 },
  list: { paddingHorizontal: 16, gap: 12 },
  tripCard: {
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderRadius: 14,
    padding: 14,
  },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  tripRoute: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text },
  tripFare: { fontSize: 16, fontWeight: 'bold', color: COLORS.success },
  tripDate: { fontSize: 12, color: COLORS.gray, marginTop: 6 },
  tripBreakdown: { fontSize: 11, color: COLORS.textLight, marginTop: 4 },
});
