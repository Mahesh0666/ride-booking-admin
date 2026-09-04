import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../constants/config';
import walletService from '../services/walletService';

interface Transaction {
  _id: string;
  amount: number;
  type: 'credit' | 'debit';
  source: string;
  description?: string;
  createdAt: string;
}

export default function WalletScreen({ navigation }: any) {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addAmount, setAddAmount] = useState('10');
  const [isAdding, setIsAdding] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadWallet();
    }, [])
  );

  const loadWallet = async () => {
    try {
      const data = await walletService.getWallet();
      setBalance(data.balance || 0);
      setTransactions(data.transactions || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load wallet');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const addFunds = async () => {
    const amount = parseFloat(addAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid amount', 'Enter a valid amount');
      return;
    }
    setIsAdding(true);
    try {
      await walletService.addFunds(amount, 'upi');
      Alert.alert('Success', `₹${amount.toFixed(2)} added to wallet`, [
        {
          text: 'OK',
          onPress: () => {
            setAddAmount('10');
            loadWallet();
          },
        },
      ]);
    } catch (err) {
      Alert.alert('Error', 'Could not add funds');
    } finally {
      setIsAdding(false);
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
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadWallet(); }} />}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Wallet Balance</Text>
        <Text style={styles.balanceValue}>₹{balance.toFixed(2)}</Text>
      </View>

      <View style={styles.addSection}>
        <Text style={styles.sectionTitle}>Add money</Text>
        <View style={styles.quickRow}>
          {['10', '20', '50', '100'].map((amt) => (
            <TouchableOpacity
              key={amt}
              style={[styles.quickChip, addAmount === amt && styles.quickChipActive]}
              onPress={() => setAddAmount(amt)}
            >
              <Text style={[styles.quickChipText, addAmount === amt && styles.quickChipTextActive]}>
                ₹{amt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.inputRow}>
          <View style={styles.inputBox}>
            <Text style={styles.inputPrefix}>₹</Text>
            <TextInput
              style={styles.input}
              value={addAmount}
              onChangeText={setAddAmount}
              keyboardType="numeric"
              placeholder="Amount"
              placeholderTextColor={COLORS.gray}
            />
          </View>
          <TouchableOpacity
            style={[styles.addButton, isAdding && styles.disabled]}
            onPress={addFunds}
            disabled={isAdding}
          >
            {isAdding ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.addButtonText}>Add via UPI</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.shortcutsRow}>
        <TouchableOpacity
          style={styles.shortcut}
          onPress={() => navigation.navigate('PaymentMethods')}
        >
          <Text style={styles.shortcutIcon}>💳</Text>
          <Text style={styles.shortcutText}>Payment methods</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shortcut}
          onPress={() => navigation.navigate('Receipts')}
        >
          <Text style={styles.shortcutIcon}>🧾</Text>
          <Text style={styles.shortcutText}>Receipts</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Recent transactions</Text>
      {transactions.length === 0 ? (
        <Text style={styles.emptyText}>No transactions yet</Text>
      ) : (
        <View style={styles.txnList}>
          {transactions.map((txn) => (
            <View key={txn._id} style={styles.txn}>
              <View style={[styles.txnIcon, txn.type === 'credit' ? styles.creditIcon : styles.debitIcon]}>
                <Text style={styles.txnIconText}>{txn.type === 'credit' ? '+' : '–'}</Text>
              </View>
              <View style={styles.txnBody}>
                <Text style={styles.txnTitle}>
                  {txn.source === 'recharge' ? 'Added money' : txn.source}
                </Text>
                <Text style={styles.txnDate}>
                  {new Date(txn.createdAt).toLocaleDateString()} · {new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text style={[styles.txnAmount, txn.type === 'credit' ? styles.creditAmount : styles.debitAmount]}>
                {txn.type === 'credit' ? '+' : '–'}₹{txn.amount.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
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
    gap: 16,
  },
  backText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  balanceCard: {
    marginHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 24,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  balanceValue: { color: COLORS.white, fontSize: 38, fontWeight: 'bold', marginTop: 4 },
  addSection: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  quickChip: {
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  quickChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  quickChipText: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  quickChipTextActive: { color: COLORS.white },
  inputRow: { flexDirection: 'row', gap: 10 },
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.grayLight,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputPrefix: { fontSize: 18, color: COLORS.gray, marginRight: 4 },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: COLORS.text },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  addButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 14 },
  disabled: { opacity: 0.6 },
  shortcutsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  shortcut: {
    flex: 1,
    backgroundColor: COLORS.grayLight,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  shortcutIcon: { fontSize: 22, marginBottom: 6 },
  shortcutText: { fontSize: 12, color: COLORS.text, fontWeight: '600' },
  emptyText: { color: COLORS.gray, paddingHorizontal: 16, paddingBottom: 20 },
  txnList: { paddingHorizontal: 16, gap: 12, paddingBottom: 40 },
  txn: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  txnIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditIcon: { backgroundColor: '#e6f7f0' },
  debitIcon: { backgroundColor: '#fdeaea' },
  txnIconText: { fontSize: 18, fontWeight: 'bold' },
  creditIconText: { color: COLORS.success },
  txnBody: { flex: 1 },
  txnTitle: { fontSize: 15, color: COLORS.text, fontWeight: '600' },
  txnDate: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  txnAmount: { fontSize: 15, fontWeight: 'bold' },
  creditAmount: { color: COLORS.success },
  debitAmount: { color: COLORS.danger },
});