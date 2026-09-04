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
import { COLORS } from '../constants/config';
import { useAuth } from '../context/AuthContext';
import { DATA_USAGE_NOTE } from '../constants/legal';

export default function TermsGateScreen({ navigation }: any) {
  const { acceptTerms } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccept = async () => {
    if (!agreed) {
      Alert.alert('Please confirm', 'Please accept the Terms & Conditions and Privacy Policy to continue.');
      return;
    }
    setIsSubmitting(true);
    await acceptTerms();
    setIsSubmitting(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>TRUST & SAFETY</Text>
        </View>
        <Text style={styles.title}>Welcome to Ride-Book</Text>
        <Text style={styles.subtitle}>
          Before you start, please review and agree to the following.
        </Text>

        <View style={styles.usageCard}>
          <Text style={styles.usageTitle}>
            {DATA_USAGE_NOTE.title}
          </Text>
          <Text style={styles.usageBody}>{DATA_USAGE_NOTE.body}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>What you're agreeing to</Text>
          <Text style={styles.summaryText}>
            • Your data (name, phone, ride locations) is used only to provide and improve your rides.
          </Text>
          <Text style={styles.summaryText}>
            • Your location is only used when you book a ride — never in the background.
          </Text>
          <Text style={styles.summaryText}>
            • We never sell or share your data for advertising.
          </Text>
          <Text style={styles.summaryText}>
            • You can request a copy or deletion of your data at any time.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => navigation.navigate('TermsLegal', { doc: 'terms' })}
        >
          <View style={styles.linkIconWrap}>
            <Text style={styles.linkIcon}>📜</Text>
          </View>
          <View style={styles.linkBody}>
            <Text style={styles.linkTitle}>Terms & Conditions</Text>
            <Text style={styles.linkSub}>Full legal agreement</Text>
          </View>
          <Text style={styles.linkChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => navigation.navigate('TermsLegal', { doc: 'privacy' })}
        >
          <View style={styles.linkIconWrap}>
            <Text style={styles.linkIcon}>🔒</Text>
          </View>
          <View style={styles.linkBody}>
            <Text style={styles.linkTitle}>Privacy Policy</Text>
            <Text style={styles.linkSub}>How we protect your data</Text>
          </View>
          <Text style={styles.linkChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.agreeRow} onPress={() => setAgreed((v) => !v)}>
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <Text style={styles.checkboxMark}>✓</Text>}
          </View>
          <Text style={styles.agreeText}>
            I have read and agree to the Terms & Conditions and Privacy Policy
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, (!agreed || isSubmitting) && styles.primaryButtonDim]}
          onPress={handleAccept}
          disabled={!agreed || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.primaryButtonText}>I Agree — Continue</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          We only use your data to provide you the service.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { padding: 24, paddingTop: 60, paddingBottom: 16 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary + '18',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  badgeText: { color: COLORS.primary, fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  title: { fontSize: 26, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 15, color: COLORS.gray, marginTop: 6, marginBottom: 20 },
  usageCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  usageTitle: { color: COLORS.white, fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  usageBody: { color: 'rgba(255,255,255,0.92)', fontSize: 13, lineHeight: 19 },
  summaryCard: {
    backgroundColor: COLORS.grayLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  summaryText: { fontSize: 13, color: COLORS.textLight, lineHeight: 19, marginBottom: 4 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.grayLight,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  linkIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  linkIcon: { fontSize: 18 },
  linkBody: { flex: 1 },
  linkTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.text },
  linkSub: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  linkChevron: { fontSize: 24, color: COLORS.gray },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: COLORS.primary },
  checkboxMark: { color: COLORS.white, fontSize: 14, fontWeight: 'bold' },
  agreeText: { flex: 1, fontSize: 13, color: COLORS.text, lineHeight: 19 },
  footer: {
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonDim: { opacity: 0.4 },
  primaryButtonText: { color: COLORS.white, fontSize: 17, fontWeight: 'bold' },
  footerNote: {
    textAlign: 'center',
    color: COLORS.gray,
    fontSize: 12,
    marginTop: 12,
  },
});