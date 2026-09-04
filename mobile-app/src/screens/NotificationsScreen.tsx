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
import notificationService from '../services/notificationService';

const TYPE_ICONS: Record<string, string> = {
  ride: '🛺',
  payment: '💰',
  offer: '🏷️',
  account: '👤',
  system: '⚙️',
};

interface AppNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsScreen({ navigation }: any) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const load = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const markAll = async () => {
    setIsMarking(true);
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      Alert.alert('Error', 'Could not mark as read');
    } finally {
      setIsMarking(false);
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAll} disabled={isMarking}>
          <Text style={styles.markAllText}>{isMarking ? '…' : 'Read all'}</Text>
        </TouchableOpacity>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySub}>Ride updates and offers will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.item, !item.isRead && styles.itemUnread]}
              onPress={async () => {
                if (!item.isRead) {
                  try {
                    await notificationService.markAsRead(item._id);
                    setNotifications((prev) => prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n)));
                  } catch {}
                }
              }}
            >
              <View style={styles.iconWrap}>
                <Text style={styles.icon}>{TYPE_ICONS[item.type] || '📩'}</Text>
                {!item.isRead && <View style={styles.unreadDot} />}
              </View>
              <View style={styles.body}>
                <Text style={[styles.title, !item.isRead && styles.titleUnread]}>{item.title}</Text>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.time}>
                  {new Date(item.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.grayLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 12,
  },
  backText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  markAllText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  emptySub: { fontSize: 14, color: COLORS.gray, marginTop: 4 },
  list: { padding: 16, gap: 10 },
  item: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  itemUnread: { borderLeftWidth: 3, borderLeftColor: COLORS.primary },
  iconWrap: { position: 'relative', paddingTop: 2 },
  icon: { fontSize: 22 },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.secondary,
  },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  titleUnread: { fontWeight: 'bold' },
  message: { fontSize: 13, color: COLORS.textLight, marginTop: 2, lineHeight: 18 },
  time: { fontSize: 11, color: COLORS.gray, marginTop: 4 },
});