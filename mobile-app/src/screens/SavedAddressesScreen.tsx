import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../constants/config';
import addressService, { SavedAddress } from '../services/addressService';

const LABEL_ICONS: Record<string, string> = {
  Home: '🏠',
  Work: '💼',
  Other: '📍',
};

export default function SavedAddressesScreen({ navigation }: any) {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const load = async () => {
    try {
      const data = await addressService.getAddresses();
      setAddresses(data.addresses || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load saved addresses');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const remove = (item: SavedAddress) => {
    Alert.alert('Delete address', `Remove "${item.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await addressService.deleteAddress(item._id);
            setAddresses((prev) => prev.filter((a) => a._id !== item._id));
          } catch (err) {
            Alert.alert('Error', 'Could not delete address');
          }
        },
      },
    ]);
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
        <Text style={styles.headerTitle}>Saved Addresses</Text>
      </View>

      <FlatList
        data={addresses}
        keyExtractor={(item) => item._id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text style={styles.emptyText}>No saved addresses</Text>
            <Text style={styles.emptySub}>Save addresses for faster booking</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{LABEL_ICONS[item.label] || '📍'}</Text>
            </View>
            <View style={styles.body}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{item.label}</Text>
                {item.isFavorite && <Text style={styles.fav}>★</Text>}
              </View>
              <Text style={styles.address}>{item.address}</Text>
            </View>
            <TouchableOpacity onPress={() => remove(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.delete}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => Alert.alert('Add address', 'Saving a new address from the map is available on the Home screen after selecting a destination.', [{ text: 'OK' }])}
      >
        <Text style={styles.addButtonText}>+ ADD NEW ADDRESS</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 12,
  },
  backText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  list: { padding: 16, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 20 },
  body: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  label: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  fav: { color: '#fca311', fontSize: 13 },
  address: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  delete: { fontSize: 18, color: COLORS.gray, padding: 4 },
  empty: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyText: { fontSize: 17, fontWeight: 'bold', color: COLORS.text },
  emptySub: { fontSize: 13, color: COLORS.gray, marginTop: 4 },
  addButton: {
    margin: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  addButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});