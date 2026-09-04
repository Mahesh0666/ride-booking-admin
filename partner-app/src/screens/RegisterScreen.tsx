import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useDriverAuth } from '../context/AuthContext';
import { COLORS } from '../constants/config';

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { registerAndOnboard } = useDriverAuth();

  const handleRegister = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (!agreed) {
      Alert.alert('Please confirm', 'Please accept the Terms & Conditions and Privacy Policy to continue.');
      return;
    }
    setIsLoading(true);
    try {
      await registerAndOnboard(name, email, password, phone);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>‹ Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Join as Captain</Text>
      <Text style={styles.subtitle}>
        Register with your details, then upload your documents to start earning.
      </Text>

      <View style={styles.form}>
        <TextInput
          placeholder="Full name"
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
          placeholder="Phone number"
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholderTextColor={COLORS.gray}
        />
        <TextInput
          placeholder="Password (min 6 chars)"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor={COLORS.gray}
        />
        <TextInput
          placeholder="Confirm password"
          style={styles.input}
          value={confirm}
          onChangeText={setConfirm}
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
            <Text style={styles.buttonText}>Register & Continue</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Already registered? Login</Text>
        </TouchableOpacity>
        <Text style={styles.privacyNote}>
          We use your data only to provide our service. Your location is used while you're online to receive nearby ride requests.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: 24, paddingTop: 60 },
  backText: { fontSize: 16, color: COLORS.primary, fontWeight: '600', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: COLORS.primary, marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', color: COLORS.gray, marginBottom: 32, lineHeight: 20 },
  form: { gap: 14 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderRadius: 12,
    padding: 16,
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
  privacyNote: { textAlign: 'center', color: COLORS.gray, fontSize: 12, marginTop: 16, lineHeight: 17 },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  link: { textAlign: 'center', color: COLORS.primary, fontSize: 14, marginTop: 12 },
});