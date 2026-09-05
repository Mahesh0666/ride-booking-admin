import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { COLORS } from '../constants/config';

const FAQS = [
  {
    q: 'How do I go online to receive rides?',
    a: 'Tap the Online/Offline toggle on the home screen. You must be approved and have a verified vehicle.',
  },
  {
    q: 'How are my earnings calculated?',
    a: 'You earn 75% of the ride fare. The 25% commission covers platform fees. See Earnings & Trips for a full breakdown.',
  },
  {
    q: 'Why was my application rejected?',
    a: 'Documents may be unclear, expired, or mismatched. Check Documents & Verification, then update and re-submit.',
  },
  {
    q: 'What do I do if a rider cancels?',
    a: 'You will be notified and returned to the home screen. No fare is charged for cancelled rides.',
  },
  {
    q: 'How do I get paid?',
    a: 'Earnings accrue on every completed ride and appear under Earnings & Trips.',
  },
];

export default function SupportScreen({ navigation }: any) {
  const callSupport = () => {
    Alert.alert('Call Support', 'Would you like to call driver support?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: () => Linking.openURL('tel:18001234567') },
    ]);
  };

  const emailSupport = () => {
    Linking.openURL('mailto:maheshbabuv57@gmail.com?subject=Driver%20Support');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
      </View>

      <View style={styles.contactRow}>
        <TouchableOpacity style={styles.contactCard} onPress={callSupport}>
          <Text style={styles.contactIcon}>📞</Text>
          <Text style={styles.contactLabel}>Call Support</Text>
          <Text style={styles.contactValue}>1800-123-4567</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactCard} onPress={emailSupport}>
          <Text style={styles.contactIcon}>✉️</Text>
          <Text style={styles.contactLabel}>Email</Text>
          <Text style={styles.contactValue}>maheshbabuv57@gmail.com</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
      {FAQS.map((faq, i) => (
        <View key={i} style={styles.faqCard}>
          <Text style={styles.faqQ}>{faq.q}</Text>
          <Text style={styles.faqA}>{faq.a}</Text>
        </View>
      ))}

      <Text style={styles.version}>Ride Booking Partner v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: 20, paddingTop: 55, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  backText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  contactRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  contactCard: {
    flex: 1,
    backgroundColor: COLORS.grayLight,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  contactIcon: { fontSize: 26, marginBottom: 8 },
  contactLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  contactValue: { fontSize: 11, color: COLORS.gray, marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  faqCard: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  faqQ: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  faqA: { fontSize: 13, color: COLORS.textLight, marginTop: 6, lineHeight: 19 },
  version: { textAlign: 'center', color: COLORS.gray, fontSize: 12, marginTop: 24 },
});
