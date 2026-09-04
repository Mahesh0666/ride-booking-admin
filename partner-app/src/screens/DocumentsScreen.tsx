import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useDriverAuth } from '../context/AuthContext';
import { COLORS } from '../constants/config';

const DOC_META: Array<{ key: string; label: string; hint: string }> = [
  { key: 'licenseImage', label: 'Driving License', hint: 'Front view of your license' },
  { key: 'registrationImage', label: 'Vehicle Registration (RC)', hint: 'Registration certificate of your auto' },
  { key: 'insuranceImage', label: 'Vehicle Insurance', hint: 'Valid insurance policy document' },
  { key: 'profileImage', label: 'Profile Photo', hint: 'A clear photo of your face' },
];

export default function DocumentsScreen({ navigation }: any) {
  const { driver } = useDriverAuth();
  const docs = (driver?.documents || {}) as Record<string, string>;
  const status = driver?.onboardingStatus || 'not_started';

  const statusLabel = () => {
    if (status === 'approved') return { text: 'VERIFIED', color: COLORS.success, bg: COLORS.success + '18' };
    if (status === 'submitted') return { text: 'UNDER REVIEW', color: COLORS.warning, bg: COLORS.warning + '18' };
    if (status === 'rejected') return { text: 'REJECTED', color: COLORS.danger, bg: COLORS.danger + '18' };
    return { text: 'NOT SUBMITTED', color: COLORS.gray, bg: COLORS.grayLight };
  };

  const meta = statusLabel();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Documents & Verification</Text>
      </View>

      <View style={[styles.statusBanner, { backgroundColor: meta.bg }]}>
        <Text style={[styles.statusText, { color: meta.color }]}>{meta.text}</Text>
        {status === 'submitted' && (
          <Text style={styles.statusHint}>Your documents are being reviewed by the admin.</Text>
        )}
        {status === 'rejected' && (
          <Text style={styles.statusHint}>
            Rejected: {driver?.rejectionReason || 'Please contact support.'}
          </Text>
        )}
      </View>

      {DOC_META.map((doc) => {
        const uploaded = Boolean(docs[doc.key]);
        return (
          <View key={doc.key} style={styles.docCard}>
            <View style={styles.docBody}>
              <Text style={styles.docLabel}>{doc.label}</Text>
              <Text style={styles.docHint}>{uploaded ? 'Uploaded ✓' : doc.hint}</Text>
            </View>
            {uploaded ? (
              <TouchableOpacity onPress={() => Alert.alert(doc.label, 'Document uploaded', [{ text: 'OK' }])}>
                <Image source={{ uri: docs[doc.key] }} style={styles.docThumb} />
              </TouchableOpacity>
            ) : (
              <View style={styles.docMissing}>
                <Text style={styles.docMissingText}>Not uploaded</Text>
              </View>
            )}
          </View>
        );
      })}

      <TouchableOpacity style={styles.historyButton} onPress={() => navigation.goBack()}>
        <Text style={styles.historyText}>Back to Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: 20, paddingTop: 55, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  backText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  statusBanner: { borderRadius: 16, padding: 16, marginBottom: 20 },
  statusText: { fontSize: 18, fontWeight: 'bold' },
  statusHint: { fontSize: 13, color: COLORS.textLight, marginTop: 6, lineHeight: 18 },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.grayLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  docBody: { flex: 1, paddingRight: 12 },
  docLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  docHint: { fontSize: 12, color: COLORS.gray, marginTop: 3 },
  docThumb: { width: 56, height: 56, borderRadius: 10 },
  docMissing: {
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  docMissingText: { fontSize: 12, color: COLORS.gray },
  historyButton: {
    marginTop: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  historyText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
});
