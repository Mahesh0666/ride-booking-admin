import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDriverAuth } from '../context/AuthContext';
import { COLORS } from '../constants/config';
import { API_BASE_URL } from '../constants/config';

export default function ReviewStatusScreen({ navigation }: any) {
  const { driver, token, updateDriver, logout } = useDriverAuth();
  const [status, setStatus] = useState(driver?.onboardingStatus || 'submitted');
  const [rejectionReason, setRejectionReason] = useState(driver?.rejectionReason || '');
  const [isPolling, setIsPolling] = useState(false);
  const pollRef = useRef<any>(null);

  const checkStatus = useCallback(async () => {
    try {
      const authToken = token || driver?.token || (await AsyncStorage.getItem('driver_token'));
      if (!authToken) return;
      const res = await axios.get(`${API_BASE_URL}/auth/driver/onboarding-status`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = res.data;
      setStatus(data.status);
      setRejectionReason(data.rejectionReason || '');
      if (data.status === 'approved') {
        updateDriver({
          isVerified: true,
          onboardingStatus: 'approved',
          rejectionReason: undefined,
        });
        navigation.replace('App');
      }
    } catch (err) {
      // token may be invalid — ignore while polling
    }
  }, [token, navigation, updateDriver]);

  useFocusEffect(
    useCallback(() => {
      checkStatus();
      pollRef.current = setInterval(checkStatus, 5000);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }, [checkStatus])
  );

  const handleReApply = () => {
    Alert.alert('Re-apply', 'You can update your details and re-submit them for review.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Continue', onPress: () => navigation.navigate('Onboarding') },
    ]);
  };

  if (status === 'approved') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Approved! Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.iconWrap}>
        {status === 'submitted' ? (
          <>
            <View style={styles.clockRing}>
              <Text style={styles.clockIcon}>⏳</Text>
            </View>
            <Text style={styles.title}>Profile under review</Text>
            <Text style={styles.subtitle}>
              Your details and documents have been submitted. An admin is reviewing them.
              {'\n\n'}You'll be notified as soon as your profile is approved. Check back in a few minutes.
            </Text>
          </>
        ) : (
          <>
            <View style={styles.rejectRing}>
              <Text style={styles.rejectIcon}>✕</Text>
            </View>
            <Text style={styles.title}>Profile rejected</Text>
            <Text style={styles.subtitle}>
              {rejectionReason || 'Your documents did not meet our requirements.'}
              {'\n\n'}Please update your details and re-submit.
            </Text>
            <TouchableOpacity style={styles.reapplyButton} onPress={handleReApply}>
              <Text style={styles.reapplyText}>Update & Re-submit</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.steps}>
        <View style={styles.step}>
          <Text style={styles.stepDone}>✓</Text>
          <Text style={styles.stepText}>Details submitted</Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepDone}>✓</Text>
          <Text style={styles.stepText}>Documents uploaded</Text>
        </View>
        <View style={[styles.step, status === 'submitted' && styles.stepPulse]}>
          <Text style={styles.stepWait}>{status === 'submitted' ? '…' : '✕'}</Text>
          <Text style={styles.stepText}>Admin approval</Text>
        </View>
        <View style={styles.step}>
          <Text style={styles.stepPending}>○</Text>
          <Text style={styles.stepText}>Go online & earn</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: 24, paddingTop: 90, alignItems: 'center', flexGrow: 1 },
  iconWrap: { alignItems: 'center', marginBottom: 40 },
  clockRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#fff7e6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  rejectRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#fdeaea',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  clockIcon: { fontSize: 42 },
  rejectIcon: { fontSize: 36, color: COLORS.danger, fontWeight: 'bold' },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.gray, textAlign: 'center', marginTop: 12, lineHeight: 22 },
  reapplyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 20,
  },
  reapplyText: { color: COLORS.white, fontSize: 15, fontWeight: 'bold' },
  steps: {
    alignSelf: 'stretch',
    backgroundColor: COLORS.grayLight,
    borderRadius: 16,
    padding: 18,
    gap: 14,
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepDone: { fontSize: 16, color: COLORS.success, fontWeight: 'bold', width: 20 },
  stepWait: { fontSize: 16, color: COLORS.warning, fontWeight: 'bold', width: 20 },
  stepPending: { fontSize: 16, color: COLORS.gray, width: 20 },
  stepText: { fontSize: 14, color: COLORS.text },
  stepPulse: {},
  loadingText: { fontSize: 16, color: COLORS.gray, marginTop: 12 },
  logoutButton: {
    marginTop: 'auto',
    paddingTop: 40,
    alignSelf: 'stretch',
  },
  logoutText: { textAlign: 'center', color: COLORS.danger, fontSize: 15, fontWeight: '600' },
});