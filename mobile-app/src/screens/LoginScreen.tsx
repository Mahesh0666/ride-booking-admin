import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/config';

export default function LoginScreen({ navigation }: any) {
  const { otpLogin } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp' | 'name'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const otpRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);

  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => otpRef.current?.focus(), 100);
    } else if (step === 'name') {
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [step]);

  const sendOtp = async () => {
    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    setIsLoading(true);
    try {
      await otpLogin.requestOtp(phone);
      setStep('otp');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Could not send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }
    setIsLoading(true);
    try {
      const res = await otpLogin.verifyOtp(phone, otp);
      if (res.isNewUser) {
        setStep('name');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Could not verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const createAccount = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    if (!agreed) {
      Alert.alert('Please confirm', 'Please accept the Terms & Conditions and Privacy Policy to continue.');
      return;
    }
    setIsLoading(true);
    try {
      await otpLogin.registerNew(phone, name);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Could not create account');
    } finally {
      setIsLoading(false);
    }
  };

  const backToPhone = () => {
    setStep('phone');
    setOtp('');
    setName('');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoGlyph}>🚕</Text>
          </View>
          <Text style={styles.title}>Ride-Book</Text>
          <Text style={styles.tagline}>Move around, your way</Text>
        </View>

        <View style={styles.card}>
          {step === 'phone' && (
            <>
              <Text style={styles.stepTitle}>Login with your phone</Text>
              <View style={styles.form}>
                <View style={styles.phoneRow}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <TextInput
                    placeholder="Phone number"
                    style={styles.input}
                    value={phone}
                    onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, '').slice(0, 10))}
                    keyboardType="phone-pad"
                    placeholderTextColor={COLORS.gray}
                    maxLength={10}
                  />
                </View>
                <TouchableOpacity style={styles.button} onPress={sendOtp} disabled={isLoading || phone.length !== 10}>
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.buttonText}>Send OTP</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'otp' && (
            <>
              <Text style={styles.stepTitle}>Enter the code</Text>
              <View style={styles.form}>
                <Text style={styles.otpSentText}>OTP sent to +91 {phone}</Text>
                <TextInput
                  placeholder="Enter OTP"
                  style={styles.input}
                  value={otp}
                  onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, '').slice(0, 9))}
                  keyboardType="number-pad"
                  placeholderTextColor={COLORS.gray}
                  maxLength={9}
                  ref={otpRef}
                />
                <TouchableOpacity style={styles.button} onPress={verifyOtp} disabled={isLoading || otp.length < 4}>
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.buttonText}>Verify & Continue</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={backToPhone}>
                  <Text style={styles.link}>Change phone number</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 'name' && (
            <>
              <Text style={styles.stepTitle}>Looks like you're new here!</Text>
              <Text style={styles.newUserHint}>Tell us your name to get started.</Text>
              <View style={styles.form}>
                <TextInput
                  placeholder="Full name"
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor={COLORS.gray}
                  autoCapitalize="words"
                  ref={nameRef}
                />
                <TouchableOpacity style={styles.agreeRow} onPress={() => setAgreed((v) => !v)}>
                  <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                    {agreed && <Text style={styles.checkboxMark}>✓</Text>}
                  </View>
                  <Text style={styles.agreeText}>
                    I agree to the{' '}
                    <Text style={styles.agreeLink} onPress={() => navigation.navigate('Legal', { doc: 'terms' })}>
                      Terms & Conditions
                    </Text>{' '}
                    and{' '}
                    <Text style={styles.agreeLink} onPress={() => navigation.navigate('Legal', { doc: 'privacy' })}>
                      Privacy Policy
                    </Text>
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={createAccount} disabled={isLoading || !name.trim() || !agreed}>
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.buttonText}>Continue</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={backToPhone}>
                  <Text style={styles.link}>Use a different number</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <Text style={styles.privacyNote}>
          We use your data only to provide our ride service. Your location is used only when you book a ride.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brand: { alignItems: 'center', marginBottom: 28 },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoGlyph: { fontSize: 34 },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    color: COLORS.text,
  },
  tagline: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 20,
    padding: 20,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  form: { gap: 14 },
  phoneRow: { flexDirection: 'row', gap: 10 },
  countryCode: {
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderRadius: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
  countryCodeText: { fontSize: 16, color: COLORS.text, fontWeight: '600' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: 'bold',
  },
  link: {
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 4,
    fontSize: 15,
  },
  otpSentText: { fontSize: 15, color: COLORS.gray, textAlign: 'center', marginTop: -4 },
  newUserHint: { fontSize: 13, color: COLORS.gray, marginTop: -10, marginBottom: 14 },
  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: COLORS.primary },
  checkboxMark: { color: COLORS.white, fontSize: 13, fontWeight: 'bold' },
  agreeText: { flex: 1, fontSize: 13, color: COLORS.text, lineHeight: 19 },
  agreeLink: { color: COLORS.primary, fontWeight: '600' },
  privacyNote: {
    textAlign: 'center',
    color: COLORS.gray,
    fontSize: 12,
    marginTop: 20,
    paddingHorizontal: 20,
    lineHeight: 17,
  },
});