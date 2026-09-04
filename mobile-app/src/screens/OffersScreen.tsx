import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS } from '../constants/config';

const offers = [
  {
    id: '1',
    title: 'First Ride Free',
    subtitle: 'Get 100% off up to\n$2 on your first auto ride',
    code: 'FIRST',
    badge: 'NEW',
  },
  {
    id: '2',
    title: 'Monday Mania',
    subtitle: 'Flat 20% off on\nall rides every Monday',
    code: 'MONDAY20',
    badge: 'TRENDING',
  },
  {
    id: '3',
    title: 'Wallet Bonus',
    subtitle: 'Add $10 & get $1\nextra wallet balance',
    code: 'WALLET10',
    badge: 'BEST VALUE',
  },
];

export default function OffersScreen() {
  const couponStyle = ['#f43f5e', '#8b5cf6', '#0ea5e9'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Offers</Text>
      </View>

      {offers.map((offer, i) => (
        <TouchableOpacity key={offer.id} style={styles.card}>
          <View style={[styles.fold, { backgroundColor: couponStyle[i % couponStyle.length] }]}>
            <Text style={styles.foldIcon}>⟠</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.offerTitle}>{offer.title}</Text>
            <Text style={styles.offerSubtitle}>{offer.subtitle}</Text>
          </View>
          <View style={styles.cardRight}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{offer.badge}</Text>
            </View>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{offer.code}</Text>
            </View>
            <Text style={styles.applyText}>APPLY</Text>
          </View>
        </TouchableOpacity>
      ))}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>How offers work</Text>
        <Text style={styles.infoText}>
          Apply an offer code before confirming your ride. Offers are auto-applied when eligible.
          Limited period offers — terms & conditions apply.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  content: { paddingBottom: 40 },
  header: { padding: 20, paddingTop: 55 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  card: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.grayLight,
  },
  fold: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foldIcon: { fontSize: 30, color: COLORS.white },
  cardBody: { flex: 1, padding: 14, justifyContent: 'center' },
  offerTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text },
  offerSubtitle: { fontSize: 12, color: COLORS.textLight, marginTop: 4 },
  cardRight: { padding: 12, justifyContent: 'center', alignItems: 'flex-end', gap: 4 },
  badge: {
    backgroundColor: COLORS.warning,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 9, color: COLORS.white, fontWeight: 'bold' },
  codeBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
  },
  codeText: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
  applyText: { fontSize: 10, color: COLORS.secondary, fontWeight: 'bold' },
  infoBox: {
    marginHorizontal: 16,
    backgroundColor: COLORS.grayLight,
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.text },
  infoText: { fontSize: 12, color: COLORS.textLight, marginTop: 6, lineHeight: 18 },
});