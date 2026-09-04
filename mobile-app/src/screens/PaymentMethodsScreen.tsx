import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../constants/config';
import walletService from '../services/walletService';

const METHODS = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'upi', label: 'UPI', icon: '📱' },
  { value: 'card', label: 'Card', icon: '💳' },
];

export default function PaymentMethodsScreen({ navigation }: any) {
  const [selected, setSelected] = useState('cash');
  const [saved, setSaved] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const load = async () => {
    try {
      const data = await walletService.getPaymentMethods();
      const valid = ['cash', 'upi', 'card'];
      const current = valid.includes(data.defaultMethod) ? data.defaultMethod : 'cash';
      setSelected(current);
      setSaved(current);
    } catch (err) {
      // fallback to cash
    } finally {
      setIsLoading(false);
    }
  };

  const save = async () => {
    setIsSaving(true);
    try {
      await walletService.setDefaultPaymentMethod(selected);
      setSaved(selected);
      Alert.alert('Saved', `Default payment set to ${selected.toUpperCase()}`);
    } catch (err) {
      Alert.alert('Error', 'Could not save payment method');
    } finally {
      setIsSaving(false);
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
        <Text style={styles.headerTitle}>Payment Methods</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Choose default payment method</Text>
        {METHODS.map((m) => (
          <TouchableOpacity
            key={m.value}
            style={[styles.method, selected === m.value && styles.methodActive]}
            onPress={() => setSelected(m.value)}
          >
            <Text style={styles.methodIcon}>{m.icon}</Text>
            <Text style={styles.methodLabel}>{m.label}</Text>
            {saved === m.value && <Text style={styles.savedBadge}>DEFAULT</Text>}
            <View style={[styles.radio, selected === m.value && styles.radioActive]}>
              {selected === m.value && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={save} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.saveButtonText}>Save Default Payment</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.white },
  header: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  content: { padding: 16, gap: 12 },
  sectionLabel: { fontSize: 14, color: COLORS.gray, marginBottom: 4 },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.grayLight,
    gap: 12,
  },
  methodActive: { borderColor: COLORS.primary, backgroundColor: '#f8f9ff' },
  methodIcon: { fontSize: 22 },
  methodLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: COLORS.text },
  savedBadge: {
    backgroundColor: COLORS.grayLight,
    color: COLORS.gray,
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.gray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: COLORS.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary },
  footer: { padding: 16, paddingBottom: 32 },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});