import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { COLORS } from '../constants/config';
import rideService from '../services/rideService';

export default function SOSScreen({ navigation, route }: any) {
  const rideId = route.params?.rideId;

  const triggerSOS = () => {
    Alert.alert(
      'Emergency SOS',
      'Contact your emergency contact and share your live location?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'SOS sent',
              'Your emergency contact has been notified with your live location. Local authorities may be contacted if needed.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const cancelRide = () => {
    if (!rideId) {
      Alert.alert('No active ride', 'There is no active ride to cancel.');
      return;
    }
    Alert.alert('Cancel ride', 'Cancel the current ride?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancel Ride',
        style: 'destructive',
        onPress: async () => {
          try {
            await rideService.cancelRide(rideId, 'Emergency cancellation');
            Alert.alert('Ride cancelled', 'The ride has been cancelled.', [
              { text: 'OK', onPress: () => navigation.navigate('Home' as never) },
            ]);
          } catch (err) {
            Alert.alert('Error', 'Could not cancel the ride.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency SOS</Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.sosCircle, styles.sosCircleOuter]}>
          <View style={[styles.sosCircle, styles.sosCircleInner]}>
            <Text style={styles.sosText}>SOS</Text>
          </View>
        </View>

        <Text style={styles.instruction}>Tap SOS in an emergency to alert</Text>
        <Text style={styles.subInstruction}>your emergency contacts with your live location</Text>

        <TouchableOpacity style={styles.sosButton} onPress={triggerSOS}>
          <Text style={styles.sosButtonText}>SEND SOS</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={cancelRide}>
          <Text style={styles.cancelButtonText}>Cancel Current Ride</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>What happens when you tap SOS?</Text>
          <Text style={styles.infoText}>
            • Your live location is shared with emergency contacts
          </Text>
          <Text style={styles.infoText}>
            • Ride details are sent with your location
          </Text>
          <Text style={styles.infoText}>
            • Local emergency services may be contacted
          </Text>
        </View>
      </View>
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
  content: { flex: 1, alignItems: 'center', padding: 24 },
  sosCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosCircleOuter: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fdeaea',
    marginTop: 40,
    marginBottom: 28,
  },
  sosCircleInner: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
  },
  sosText: { color: COLORS.white, fontSize: 32, fontWeight: 'bold', letterSpacing: 2 },
  instruction: { fontSize: 17, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
  subInstruction: { fontSize: 13, color: COLORS.gray, textAlign: 'center', marginTop: 6 },
  sosButton: {
    marginTop: 28,
    backgroundColor: COLORS.danger,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
  },
  sosButtonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  cancelButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: 16,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: { color: COLORS.danger, fontSize: 16, fontWeight: 'bold' },
  infoBox: {
    marginTop: 30,
    backgroundColor: COLORS.grayLight,
    borderRadius: 12,
    padding: 16,
    alignSelf: 'stretch',
  },
  infoTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  infoText: { fontSize: 13, color: COLORS.textLight, lineHeight: 20 },
});