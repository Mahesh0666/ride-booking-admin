import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDriverAuth } from '../context/AuthContext';
import { COLORS, VEHICLE_ICONS } from '../constants/config';
import driverService from '../services/driverService';
import api from '../services/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MENU_ITEMS = [
  { key: 'Earnings', icon: '💰', label: 'Earnings & Trips', nav: 'Earnings' },
  { key: 'Trips', icon: '🛺', label: 'My Trips', nav: 'Trips' },
  { key: 'EditProfile', icon: '✏️', label: 'Edit Profile', nav: 'EditProfile' },
  { key: 'Documents', icon: '📄', label: 'Documents & Verification', nav: 'Documents' },
  { key: 'Support', icon: '❓', label: 'Help & Support', nav: 'Support' },
];

const LEGAL_ITEMS = [
  { key: 'Terms', icon: '📜', label: 'Terms & Conditions', nav: 'Legal', params: { doc: 'terms' } },
  { key: 'Privacy', icon: '🔒', label: 'Privacy Policy', nav: 'Legal', params: { doc: 'privacy' } },
];

const DOC_META: Array<{ key: string; label: string }> = [
  { key: 'licenseImage', label: 'Driving License' },
  { key: 'registrationImage', label: 'Vehicle Registration' },
  { key: 'insuranceImage', label: 'Insurance' },
  { key: 'profileImage', label: 'Profile Photo' },
];

export default function ProfileScreen({ navigation }: any) {
  const { driver, logout, refreshProfile } = useDriverAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account, vehicle details, documents and all data. Your earnings ledger will also be removed. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete('/auth/account');
              await AsyncStorage.multiRemove(['driver_token', 'driver_terms_accepted']);
              await logout();
            } catch (err: any) {
              Alert.alert(
                'Delete Failed',
                err?.response?.data?.error?.message || 'Please try again.',
                [{ text: 'OK' }]
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const vehicle = driver?.vehicle as any;
  const docKeys = driver?.documents as Record<string, string> | undefined;

  const renderStats = () => {
    const stats = [
      { label: 'Total Earnings', value: `₹${driver?.earnings?.toFixed(2) || '0.00'}` },
      { label: 'Rides Done', value: `${driver?.totalRides || 0}` },
      { label: 'Rating', value: `${driver?.rating?.toFixed(1) || '0.0'} ★` },
    ];
    return (
      <View style={styles.statsRow}>
        {stats.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderVehicleCard = () => {
    if (!vehicle) return null;
    return (
      <View style={styles.vehicleCard}>
        <View style={styles.vehicleIconWrap}>
          <Text style={styles.vehicleIcon}>{VEHICLE_ICONS[vehicle.vehicleType] || '🛺'}</Text>
        </View>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleTitle}>
            {vehicle.make} {vehicle.model} · {vehicle.year}
          </Text>
          <Text style={styles.vehiclePlate}>{vehicle.licensePlate}</Text>
          <Text style={styles.vehicleSub}>
            {vehicle.color} · {String(vehicle.vehicleType || 'auto').toUpperCase()}
          </Text>
        </View>
      </View>
    );
  };

  const renderDocsCard = () => {
    const uploaded = DOC_META.filter((d) => docKeys?.[d.key]).length;
    return (
      <View style={styles.docsCard}>
        <View style={styles.docsHeader}>
          <View>
            <Text style={styles.docsTitle}>Documents & Verification</Text>
            <Text style={styles.docsSub}>
              {uploaded}/{DOC_META.length} uploaded
            </Text>
          </View>
          <View style={[styles.verifyBadge, driver?.onboardingStatus === 'approved' && styles.verifyBadgeOk]}>
            <Text
              style={[styles.verifyBadgeText, driver?.onboardingStatus === 'approved' && styles.verifyBadgeTextOk]}
            >
              {driver?.onboardingStatus === 'approved' ? 'VERIFIED' : driver?.onboardingStatus === 'submitted' ? 'UNDER REVIEW' : 'NOT SUBMITTED'}
            </Text>
          </View>
        </View>
        <View style={styles.docChips}>
          {DOC_META.map((d) => (
            <View key={d.key} style={[styles.docChip, docKeys?.[d.key] && styles.docChipOk]}>
              <Text style={styles.docChipDot}>{docKeys?.[d.key] ? '✓' : '○'}</Text>
              <Text style={[styles.docChipText, docKeys?.[d.key] && styles.docChipTextOk]} numberOfLines={1}>
                {d.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.userCard}>
        <View style={styles.avatar}>
          {driver?.documents?.profileImage ? (
            <Image source={{ uri: driver.documents.profileImage }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{driver?.name?.charAt(0) || '?'}</Text>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{driver?.name}</Text>
          <Text style={styles.userPhone}>{driver?.phone || driver?.email}</Text>
          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusText}>{driver?.isOnline ? 'Online' : 'Offline'}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {renderStats()}
      {renderVehicleCard()}
      {renderDocsCard()}

      <View style={styles.menu}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.nav)}
          >
            <View style={styles.menuIconWrap}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.menu}>
        {LEGAL_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.nav, item.params)}
          >
            <View style={styles.menuIconWrap}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.logoutButton, styles.deleteButton]}
        onPress={handleDeleteAccount}
        disabled={deleting}
      >
        {deleting ? (
          <ActivityIndicator color={COLORS.danger} />
        ) : (
          <Text style={styles.deleteText}>Delete My Account</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.version}>Ride-Book Partner v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight },
  content: { paddingBottom: 40 },
  header: { padding: 20, paddingTop: 55 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 64, height: 64 },
  avatarText: { color: COLORS.white, fontSize: 26, fontWeight: 'bold' },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  userPhone: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  statusText: { fontSize: 12, color: COLORS.gray, fontWeight: '600' },
  editButton: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  editButtonText: { color: COLORS.primary, fontSize: 13, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginTop: 14 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  statValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.gray, marginTop: 4, textAlign: 'center' },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
  },
  vehicleIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleIcon: { fontSize: 28 },
  vehicleInfo: { flex: 1 },
  vehicleTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  vehiclePlate: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginTop: 2 },
  vehicleSub: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  docsCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
  },
  docsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  docsTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  docsSub: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  verifyBadge: {
    backgroundColor: COLORS.warning + '22',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  verifyBadgeOk: { backgroundColor: COLORS.success + '22' },
  verifyBadgeText: { fontSize: 10, color: COLORS.warning, fontWeight: 'bold' },
  verifyBadgeTextOk: { color: COLORS.success },
  docChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  docChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.grayLight,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  docChipOk: { backgroundColor: COLORS.success + '18' },
  docChipDot: { fontSize: 12, color: COLORS.gray },
  docChipText: { fontSize: 12, color: COLORS.gray },
  docChipTextOk: { color: COLORS.success, fontWeight: '600' },
  menu: {
    margin: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuIcon: { fontSize: 18 },
  menuLabel: { flex: 1, fontSize: 16, color: COLORS.text, fontWeight: '600' },
  menuChevron: { fontSize: 24, color: COLORS.gray },
  logoutButton: {
    marginHorizontal: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: { color: COLORS.danger, fontSize: 16, fontWeight: 'bold' },
  deleteButton: { borderWidth: 1, borderColor: 'rgba(230,57,70,0.35)', marginTop: 10 },
  deleteText: { color: COLORS.danger, fontSize: 15, fontWeight: '600' },
  version: { textAlign: 'center', color: COLORS.gray, fontSize: 12, margin: 24 },
});
