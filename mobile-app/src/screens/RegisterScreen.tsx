import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/config';

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in required fields');
      return;
    }
    if (!agreed) {
      Alert.alert('Please confirm', 'Please accept the Terms & Conditions and Privacy Policy to continue.');
      return;
    }
    setIsLoading(true);
    try {
      await register(name, email, password, phone);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        <View style={styles.form}>
          <TextInput
            placeholder="Full Name"
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholderTextColor={COLORS.gray}
          />
          <TextInput
            placeholder="Email"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={COLORS.gray}
          />
          <TextInput
            placeholder="Phone"
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor={COLORS.gray}
          />
          <TextInput
            placeholder="Password"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={COLORS.gray}
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
          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={isLoading || !agreed}>
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Already have an account? Login</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 28,
    color: COLORS.text,
  },
  form: { gap: 14 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderRadius: 14,
    padding: 15,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
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
    marginTop: 20,
    fontSize: 15,
  },
  privacyNote: {
    textAlign: 'center',
    color: COLORS.gray,
    fontSize: 12,
    marginTop: 16,
    lineHeight: 17,
  },
});