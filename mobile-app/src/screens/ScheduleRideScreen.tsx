import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS, VEHICLE_ICONS } from '../constants/config';
import rideService from '../services/rideService';
import { useRide } from '../context/RideContext';

const TIME_SLOTS = ['07:30', '09:00', '12:00', '14:30', '17:00', '19:30'];

export default function ScheduleRideScreen({ navigation, route }: any) {
  const { pickup, dropoff, vehicleType } = route.params;
  const { setActiveRide } = useRide();
  const [selectedSlot, setSelectedSlot] = useState('09:00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const computeScheduledAt = () => {
    const d = new Date();
    const [h, m] = selectedSlot.split(':').map(Number);
    d.setHours(h, m, 0, 0);
    if (d <= new Date()) d.setDate(d.getDate() + 1);
    return d.toISOString();
  };

  const handleSchedule = async () => {
    setIsSubmitting(true);
    try {
      const response = await rideService.requestRide(pickup, dropoff, vehicleType, {
        scheduledAt: computeScheduledAt(),
      });
      if (response?.ride) setActiveRide(response.ride);
      Alert.alert('Ride scheduled!', `Your auto is booked for ${selectedSlot}${selectedSlot < '12:00' ? ' AM' : ' PM'}\nA captain will be assigned at that time.`, [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Home' as never),
        },
      ]);
    } catch (err) {
      Alert.alert('Error', 'Could not schedule the ride. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTomorrow = () => {
    const [h, m] = selectedSlot.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d <= new Date();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book for Later</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={styles.dotPickup} />
            <Text style={styles.routeText}>{pickup?.address || 'Pickup location'}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <View style={styles.dotDropoff} />
            <Text style={styles.routeText}>{dropoff?.address || 'Destination'}</Text>
          </View>
        </View>

        <View style={styles.vehicleCard}>
          <Text style={styles.vehicleIcon}>{VEHICLE_ICONS[vehicleType] || '🛺'}</Text>
          <Text style={styles.vehicleName}>Auto</Text>
        </View>

        <Text style={styles.sectionTitle}>Pick a time</Text>
        {isTomorrow() && (
          <Text style={styles.tomorrowNote}>Tomorrow from {selectedSlot} (selected time already passed today)</Text>
        )}
        <View style={styles.slotsWrap}>
          {TIME_SLOTS.map((slot) => (
            <TouchableOpacity
              key={slot}
              style={[styles.slot, selectedSlot === slot && styles.slotActive]}
              onPress={() => setSelectedSlot(slot)}
            >
              <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextActive]}>
                {slot}
              </Text>
              <Text style={[styles.slotAm, selectedSlot === slot && styles.slotTextActive]}>
                {slot < '12:00' ? 'AM' : 'PM'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>How scheduling works</Text>
          <Text style={styles.infoText}>
            Your ride is reserved for the chosen time. A captain is assigned when the scheduled time
            arrives, and you'll get a notification. You can cancel anytime before the captain is assigned.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.scheduleButton, isSubmitting && styles.disabled]}
          onPress={handleSchedule}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.scheduleButtonText}>
              Book {vehicleType === 'auto' ? 'Auto' : 'Ride'} at {selectedSlot}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  backText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  content: { padding: 16, paddingBottom: 40 },
  routeCard: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 14,
    padding: 16,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dotPickup: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.success },
  dotDropoff: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.danger },
  routeLine: { width: 2, height: 16, backgroundColor: COLORS.gray, marginLeft: 4 },
  routeText: { flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500' },
  vehicleCard: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.grayLight,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  vehicleIcon: { fontSize: 28 },
  vehicleName: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginTop: 24, marginBottom: 12 },
  tomorrowNote: {
    fontSize: 12,
    color: COLORS.warning,
    marginBottom: 8,
  },
  slotsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slot: {
    width: '30%',
    borderWidth: 1.5,
    borderColor: COLORS.grayLight,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  slotActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  slotText: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  slotAm: { fontSize: 10, color: COLORS.gray, marginTop: 2 },
  slotTextActive: { color: COLORS.white },
  infoBox: {
    marginTop: 24,
    backgroundColor: COLORS.grayLight,
    borderRadius: 12,
    padding: 14,
  },
  infoTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 6 },
  infoText: { fontSize: 13, color: COLORS.textLight, lineHeight: 19 },
  scheduleButton: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  scheduleButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  disabled: { opacity: 0.6 },
});