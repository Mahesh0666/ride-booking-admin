import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/config';
import api from '../services/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MENU_ITEMS = [
  { key: 'SavedAddresses', icon: '📍', label: 'Saved Addresses', nav: 'SavedAddresses' },
  { key: 'Notifications', icon: '🔔', label: 'Notifications', nav: 'Notifications' },
  { key: 'RideHistory', icon: '🧾', label: 'My Rides', nav: 'RideHistory' },
  { key: 'HelpSupport', icon: '❓', label: 'Help & Support', nav: 'HelpSupport' },
  { key: 'SOS', icon: '🆘', label: 'Emergency SOS', nav: 'SOS' },
];

const LEGAL_ITEMS = [
  { key: 'Terms', icon: '📜', label: 'Terms & Conditions', nav: 'Legal', params: { doc: 'terms' } },
  { key: 'Privacy', icon: '🔒', label: 'Privacy Policy', nav: 'Legal', params: { doc: 'privacy' } },
];

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const [deleting, setDeleting] = React.useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account, ride history and all personal data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.delete('/auth/account');
              await AsyncStorage.multiRemove(['token', 'terms_accepted']);
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <TouchableOpacity
        style={styles.userCard}
        onPress={() => Alert.alert('Profile', 'Rider profile', [{ text: 'OK' }])}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) || '?'}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userPhone}>{user?.phone || user?.email}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingStar}>★</Text>
            <Text style={styles.ratingText}>{user?.rating?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.ratingSep}>·</Text>
            <Text style={styles.ratingText}>{user?.totalRides || 0} rides</Text>
          </View>
        </View>
      </TouchableOpacity>

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

      <Text style={styles.version}>Ride-Book v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight },
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
  },
  avatarText: { color: COLORS.white, fontSize: 26, fontWeight: 'bold' },
  userInfo: { flex: 1 },
  userName: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  userPhone: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  ratingStar: { color: '#fca311', fontSize: 14 },
  ratingText: { fontSize: 13, color: COLORS.text },
  ratingSep: { color: COLORS.grayLight, fontSize: 13 },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
  },
  walletLeft: {},
  walletLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  walletValue: { color: COLORS.white, fontSize: 24, fontWeight: 'bold', marginTop: 2 },
  walletRight: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  walletCta: { color: COLORS.primary, fontSize: 13, fontWeight: 'bold' },
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