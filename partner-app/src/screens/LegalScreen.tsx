import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { COLORS } from '../constants/config';
import {
  TERMS_SECTIONS,
  PRIVACY_SECTIONS,
  LEGAL_VERSION,
  LEGAL_UPDATED,
} from '../constants/legal';

export default function LegalScreen({ navigation, route }: any) {
  const doc = route.params?.doc === 'privacy' ? 'privacy' : 'terms';
  const sections = doc === 'privacy' ? PRIVACY_SECTIONS : TERMS_SECTIONS;
  const title = doc === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.updated}>Version {LEGAL_VERSION} · Updated {LEGAL_UPDATED}</Text>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 55,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  backText: { fontSize: 32, color: COLORS.text, marginTop: -8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.text },
  headerSpacer: { width: 24 },
  content: { padding: 20, paddingBottom: 40 },
  updated: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 20,
    textAlign: 'center',
  },
  section: { marginBottom: 22 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 6,
  },
  sectionBody: { fontSize: 15, color: COLORS.text, lineHeight: 22 },
});