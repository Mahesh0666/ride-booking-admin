import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { COLORS } from '../constants/config';

const FAQS = [
  { q: 'How do I schedule a ride for later?', a: 'Choose a pickup & destination, then tap "Book later" and pick your preferred time.' },
  { q: 'How do I track my captain?', a: 'Once a captain accepts, you can track their live location on the Home screen.' },
  { q: 'How do I pay for a ride?', a: 'You can pay by cash, UPI, card, or wallet. Set your default in Profile → Payment Methods.' },
  { q: 'How do I cancel a ride?', a: 'Open the active ride from My Bookings and tap Cancel. Cancellation fees may apply after a captain is assigned.' },
  { q: 'How do I get a refund?', a: 'Refunds for eligible cancellations are credited to your wallet automatically.' },
];

export default function HelpSupportScreen({ navigation }: any) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [issue, setIssue] = useState('');
  const [isSending, setIsSending] = useState(false);

  const sendTicket = () => {
    if (!issue.trim()) {
      Alert.alert('Describe the issue', 'Please tell us what happened so we can help.');
      return;
    }
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setIssue('');
      Alert.alert('Ticket submitted', 'Our support team will reach out to you shortly.');
    }, 1200);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.sosBanner}>
          <Text style={styles.sosBannerText}>
            ⚠️ In an emergency, use the{' '}
            <Text style={styles.sosBannerLink} onPress={() => navigation.navigate('SOS')}>
              SOS button
            </Text>{' '}
            or call local emergency services.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Frequently asked questions</Text>
        {FAQS.map((faq, idx) => (
          <View key={idx} style={styles.faqCard}>
            <TouchableOpacity
              style={styles.faqHeader}
              onPress={() => setOpenIndex(openIndex === idx ? null : idx)}
            >
              <Text style={styles.faqQ}>{faq.q}</Text>
              <Text style={styles.faqChevron}>{openIndex === idx ? '−' : '+'}</Text>
            </TouchableOpacity>
            {openIndex === idx && (
              <Text style={styles.faqA}>{faq.a}</Text>
            )}
          </View>
        ))}

        <Text style={styles.sectionTitle}>Contact support</Text>
        <View style={styles.contactCard}>
          <View style={styles.contactRow}>
            <Text style={styles.contactIcon}>📞</Text>
            <TouchableOpacity onPress={() => Alert.alert('Call', '1800-123-4567')}>
              <Text style={styles.contactLink}>1800-123-4567</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.contactRow}>
            <Text style={styles.contactIcon}>💬</Text>
            <TouchableOpacity onPress={() => Alert.alert('Chat', 'Live chat opens here')}>
              <Text style={styles.contactLink}>Live chat with support</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.contactRow}>
            <Text style={styles.contactIcon}>✉️</Text>
            <TouchableOpacity onPress={() => Alert.alert('Email', 'support@ridenow.app')}>
              <Text style={styles.contactLink}>support@ridenow.app</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Report an issue</Text>
        <TextInput
          style={styles.issueBox}
          value={issue}
          onChangeText={setIssue}
          placeholder="Describe your issue..."
          placeholderTextColor={COLORS.gray}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.submitButton, isSending && styles.disabled]}
          onPress={sendTicket}
          disabled={isSending}
        >
          <Text style={styles.submitButtonText}>
            {isSending ? 'Submitting…' : 'Submit Ticket'}
          </Text>
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
  sosBanner: {
    backgroundColor: '#fff3e0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  sosBannerText: { fontSize: 13, color: '#8a4d00', lineHeight: 20 },
  sosBannerLink: { fontWeight: 'bold', color: COLORS.danger, textDecorationLine: 'underline' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 12, marginTop: 4 },
  faqCard: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQ: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text, paddingRight: 8 },
  faqChevron: { fontSize: 18, color: COLORS.primary, fontWeight: 'bold' },
  faqA: { fontSize: 13, color: COLORS.textLight, marginTop: 8, lineHeight: 19 },
  contactCard: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 12,
    padding: 6,
    marginBottom: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  contactIcon: { fontSize: 18 },
  contactLink: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  issueBox: {
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderRadius: 12,
    padding: 14,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 14,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  submitButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  disabled: { opacity: 0.6 },
});