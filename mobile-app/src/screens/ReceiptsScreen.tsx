import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../constants/config';
import rideService from '../services/rideService';

interface Receipt {
  _id: string;
  status: string;
  fare?: number;
  vehicleType?: string;
  createdAt: string;
  completedAt?: string;
  pickupLocation?: { address?: string };
  dropoffLocation?: { address?: string };
  driver?: { name?: string };
  distance?: number;
  duration?: number;
}

export default function ReceiptsScreen({ navigation }: any) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadReceipts();
    }, [])
  );

  const loadReceipts = async () => {
    try {
      const data = await rideService.getMyRides();
      setReceipts((data.rides || []).filter((r: Receipt) => r.status === 'completed'));
    } catch (err) {
      Alert.alert('Error', 'Failed to load receipts');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receipts</Text>
      </View>

      {receipts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🧾</Text>
          <Text style={styles.emptyText}>No receipts yet</Text>
          <Text style={styles.emptySub}>Completed rides will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={receipts}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadReceipts(); }} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>RideNow Auto</Text>
                <Text style={styles.cardAmount}>₹{item.fare?.toFixed(2) || '0.00'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Route</Text>
                <Text style={styles.rowValue}>
                  {item.pickupLocation?.address || 'Pickup'} → {item.dropoffLocation?.address || 'Dropoff'}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Date</Text>
                <Text style={styles.rowValue}>
                  {new Date(item.createdAt).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              {item.driver?.name ? (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Captain</Text>
                  <Text style={styles.rowValue}>{item.driver.name}</Text>
                </View>
              ) : null}
              {item.distance ? (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Distance</Text>
                  <Text style={styles.rowValue}>{item.distance.toFixed(1)} km</Text>
                </View>
              ) : null}
              <Text style={styles.paid}>✓ Paid</Text>
            </View>
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
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  emptySub: { fontSize: 14, color: COLORS.gray, marginTop: 4 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    padding: 16,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  cardAmount: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  divider: { height: 1, backgroundColor: COLORS.grayLight, marginVertical: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, gap: 12 },
  rowLabel: { fontSize: 13, color: COLORS.gray, width: 70 },
  rowValue: { flex: 1, fontSize: 13, color: COLORS.text, textAlign: 'right', fontWeight: '500' },
  paid: {
    alignSelf: 'flex-end',
    color: COLORS.success,
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 8,
  },
});