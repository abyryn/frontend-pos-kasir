import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, SafeAreaView, Alert,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '../theme';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useTransactionStore } from '../store/useTransactionStore';
import { Payment, PaymentMethod, Transaction } from '../types';
import { Button, Badge, Toast, useToast, POSStatusBar } from '../components/ui';

interface Props {
  onSuccess: (transactionId: string) => void;
  onBack: () => void;
}

const formatRp = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;

type PaymentMethodConfig = {
  method: PaymentMethod;
  label: string;
  color: string;
};

const PAYMENT_METHODS: PaymentMethodConfig[] = [
  { method: 'CASH',     label: 'Tunai',   color: Colors.success },
  { method: 'QRIS',     label: 'QRIS',    color: Colors.primary },
  { method: 'DEBIT',    label: 'Debit',   color: Colors.sky700 },
  { method: 'CREDIT',   label: 'Kredit',  color: Colors.warning },
  { method: 'EWALLET',  label: 'E-Wallet',color: Colors.info },
  { method: 'TRANSFER', label: 'Transfer',color: Colors.gray600 },
];

const QUICK_CASH = [50000, 100000, 200000, 500000];

export const PaymentScreen: React.FC<Props> = ({ onSuccess, onBack }) => {
  const { items, customer, subtotal, discountAmount, total, clearCart } = useCartStore();
  const { user, shift } = useAuthStore();
  const { addTransaction } = useTransactionStore();
  const { toast, show, hide } = useToast();

  const grandTotal = total();

  const [splitPayments, setSplitPayments] = useState<{ method: PaymentMethod; amount: string }[]>([
    { method: 'CASH', amount: '' },
  ]);
  const [loading, setLoading] = useState(false);

  const totalPaid = splitPayments.reduce(
    (sum, p) => sum + (parseInt(p.amount.replace(/\D/g, ''), 10) || 0),
    0
  );
  const change = Math.max(0, totalPaid - grandTotal);
  const remaining = Math.max(0, grandTotal - totalPaid);
  const isPaid = totalPaid >= grandTotal;

  const isSplit = splitPayments.length > 1;

  const handleMethodSelect = (method: PaymentMethod, index: number) => {
    setSplitPayments((prev) =>
      prev.map((p, i) => (i === index ? { ...p, method } : p))
    );
  };

  const handleAmountChange = (text: string, index: number) => {
    const clean = text.replace(/\D/g, '');
    setSplitPayments((prev) =>
      prev.map((p, i) => (i === index ? { ...p, amount: clean } : p))
    );
  };

  const handleQuickCash = (amount: number) => {
    setSplitPayments((prev) =>
      prev.map((p, i) => (i === 0 ? { ...p, amount: amount.toString() } : p))
    );
  };

  const addSplitPayment = () => {
    if (splitPayments.length >= 3) return;
    setSplitPayments((prev) => [...prev, { method: 'QRIS', amount: remaining.toString() }]);
  };

  const removeSplitPayment = (index: number) => {
    if (splitPayments.length === 1) return;
    setSplitPayments((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePay = async () => {
    if (!isPaid) { show(`Kurang ${formatRp(remaining)}.`, 'error'); return; }
    setLoading(true);

    // Build transaction
    const now = new Date().toISOString();
    const txId = `TRX-${user?.storeId ?? 'STR'}-${user?.terminalId?.replace('-', '') ?? 'POS'}-${
      new Date().toISOString().slice(0, 10).replace(/-/g, '')
    }-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`;

    const payments: Payment[] = splitPayments.map((p, i) => ({
      id: `pay-${Date.now()}-${i}`,
      transactionId: txId,
      method: p.method,
      amount: parseInt(p.amount.replace(/\D/g, ''), 10) || 0,
      status: 'SUCCESS',
    }));

    const tx: Transaction = {
      id: txId,
      shiftId: shift?.id ?? '',
      storeId: user?.storeId ?? '',
      terminalId: user?.terminalId ?? '',
      cashierId: user?.id ?? '',
      cashierName: user?.name ?? '',
      customerId: customer?.id,
      customerName: customer?.name,
      items: items,
      subtotal: subtotal(),
      discountTotal: discountAmount(),
      taxTotal: 0,
      total: grandTotal,
      payments,
      change,
      status: 'COMPLETED',
      createdAt: now,
      completedAt: now,
      idempotencyKey: `${user?.terminalId}-TRX-${now.slice(0, 10)}-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`,
    };

    addTransaction(tx);

    await new Promise((r) => setTimeout(r, 600)); // simulate processing

    clearCart();
    setLoading(false);
    onSuccess(txId);
  };

  const firstMethod = splitPayments[0]?.method;

  return (
    <SafeAreaView style={styles.safe}>
      <POSStatusBar />
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hide} />

      <View style={styles.body}>

        {/* ── Left: Order Summary ── */}
        <View style={styles.leftPanel}>
          <View style={styles.panelHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={onBack}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.panelTitle}>Ringkasan Pesanan</Text>
          </View>

          <ScrollView style={styles.orderList} showsVerticalScrollIndicator={false}>
            {items.map((item) => (
              <View key={item.productId} style={styles.orderItem}>
                <View style={styles.orderItemLeft}>
                  <Text style={styles.orderItemName}>{item.productName}</Text>
                  <Text style={styles.orderItemDetail}>
                    {formatRp(item.price)} × {item.quantity}
                    {item.discount > 0 && (
                      <Text style={{ color: Colors.success }}>
                        {' '}(-{item.discountType === 'percentage' ? `${item.discount}%` : formatRp(item.discount)})
                      </Text>
                    )}
                  </Text>
                </View>
                <Text style={styles.orderItemSubtotal}>{formatRp(item.subtotal)}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Order totals */}
          <View style={styles.orderTotals}>
            <View style={styles.orderTotalRow}>
              <Text style={styles.orderTotalKey}>Subtotal</Text>
              <Text style={styles.orderTotalVal}>{formatRp(subtotal())}</Text>
            </View>
            {discountAmount() > 0 && (
              <View style={styles.orderTotalRow}>
                <Text style={[styles.orderTotalKey, { color: Colors.success }]}>Diskon</Text>
                <Text style={[styles.orderTotalVal, { color: Colors.success }]}>
                  -{formatRp(discountAmount())}
                </Text>
              </View>
            )}
            <View style={styles.orderDivider} />
            <View style={styles.orderTotalRow}>
              <Text style={styles.orderGrandKey}>TOTAL</Text>
              <Text style={styles.orderGrandVal}>{formatRp(grandTotal)}</Text>
            </View>

            {/* Customer */}
            {customer && (
              <View style={styles.memberChip}>
                <Text style={styles.memberName}>{customer.name}</Text>
                <Badge label={customer.memberLevel} variant="info" />
              </View>
            )}
          </View>
        </View>

        {/* ── Right: Payment ── */}
        <View style={styles.rightPanel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Pembayaran</Text>
            {!isSplit && (
              <TouchableOpacity style={styles.splitBtn} onPress={addSplitPayment}>
                <Text style={styles.splitBtnText}>+ Split Payment</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

            {/* Total display */}
            <View style={styles.totalDisplay}>
              <Text style={styles.totalDisplayLabel}>Total Pembayaran</Text>
              <Text style={styles.totalDisplayAmount}>{formatRp(grandTotal)}</Text>
            </View>

            {/* Payment entries */}
            {splitPayments.map((payment, index) => (
              <View key={index} style={styles.paymentEntry}>
                {isSplit && (
                  <View style={styles.paymentEntryHeader}>
                    <Text style={styles.paymentEntryTitle}>Pembayaran {index + 1}</Text>
                    {index > 0 && (
                      <TouchableOpacity onPress={() => removeSplitPayment(index)}>
                        <Text style={styles.removePayment}>Hapus</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Method selection */}
                <Text style={styles.methodLabel}>Metode Pembayaran</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.methodRow}>
                    {PAYMENT_METHODS.map((m) => (
                      <TouchableOpacity
                        key={m.method}
                        style={[
                          styles.methodChip,
                          payment.method === m.method && {
                            backgroundColor: m.color + '20',
                            borderColor: m.color,
                          },
                        ]}
                        onPress={() => handleMethodSelect(m.method, index)}
                      >
                        <Text style={[
                          styles.methodChipText,
                          payment.method === m.method && { color: m.color, fontWeight: FontWeight.bold },
                        ]}>
                          {m.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {/* Amount input */}
                <View style={styles.amountGroup}>
                  <Text style={styles.methodLabel}>
                    {payment.method === 'CASH' ? 'Uang Diterima' : 'Nominal'}
                  </Text>
                  <View style={styles.amountInputRow}>
                    <Text style={styles.amountPrefix}>Rp</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={payment.amount}
                      onChangeText={(t) => handleAmountChange(t, index)}
                      keyboardType="numeric"
                      placeholder={isSplit && index === splitPayments.length - 1
                        ? remaining.toLocaleString('id-ID')
                        : grandTotal.toLocaleString('id-ID')
                      }
                      placeholderTextColor={Colors.textMuted}
                    />
                  </View>
                </View>

                {/* Quick cash (only for CASH, first payment) */}
                {payment.method === 'CASH' && !isSplit && (
                  <View style={styles.quickCashRow}>
                    {QUICK_CASH.map((amt) => (
                      <TouchableOpacity
                        key={amt}
                        style={[
                          styles.quickCashChip,
                          amt >= grandTotal && { borderColor: Colors.success, backgroundColor: Colors.successBg },
                        ]}
                        onPress={() => handleQuickCash(amt)}
                      >
                        <Text style={styles.quickCashText}>
                          {amt >= 1000000 ? `${amt / 1000000}jt` : `${amt / 1000}K`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={[styles.quickCashChip, { borderColor: Colors.primary, backgroundColor: Colors.sky50 }]}
                      onPress={() => handleQuickCash(grandTotal)}
                    >
                      <Text style={[styles.quickCashText, { color: Colors.primary }]}>Pas</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* QRIS placeholder */}
                {payment.method === 'QRIS' && (
                  <View style={styles.qrisBox}>
                    <Text style={styles.qrisPlaceholder}>■■■■■■■■■</Text>
                    <Text style={styles.qrisLabel}>Scan QR untuk Pembayaran</Text>
                    <Text style={styles.qrisAmount}>{formatRp(parseInt(payment.amount || '0', 10) || grandTotal)}</Text>
                  </View>
                )}
              </View>
            ))}

            {isSplit && (
              <TouchableOpacity style={styles.addSplitBtn} onPress={addSplitPayment} disabled={splitPayments.length >= 3}>
                <Text style={styles.addSplitText}>+ Tambah Metode Pembayaran</Text>
              </TouchableOpacity>
            )}

            {/* Summary */}
            <View style={styles.paymentSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Total Bayar</Text>
                <Text style={[styles.summaryVal, totalPaid > 0 && { color: Colors.primary }]}>
                  {formatRp(totalPaid)}
                </Text>
              </View>
              {change > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryKey, { color: Colors.success }]}>Kembalian</Text>
                  <Text style={[styles.summaryVal, { color: Colors.success, fontSize: FontSize.h4 }]}>
                    {formatRp(change)}
                  </Text>
                </View>
              )}
              {remaining > 0 && totalPaid > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryKey, { color: Colors.danger }]}>Kurang</Text>
                  <Text style={[styles.summaryVal, { color: Colors.danger }]}>{formatRp(remaining)}</Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Pay button */}
          <View style={styles.payBtnWrap}>
            <Button
              label={loading ? 'Memproses...' : `Bayar Sekarang — ${formatRp(grandTotal)}`}
              onPress={handlePay}
              loading={loading}
              disabled={!isPaid}
              fullWidth
              size="xl"
              style={[!isPaid && { backgroundColor: Colors.gray300 }]}
            />
            {!isPaid && totalPaid === 0 && (
              <Text style={styles.payHint}>Masukkan nominal pembayaran</Text>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  body: { flex: 1, flexDirection: 'row' },

  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  panelTitle: { fontSize: FontSize.h4, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  backIcon: { fontSize: FontSize.h4, color: Colors.textSecondary },

  // ── Left Panel ──
  leftPanel: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  orderList: { flex: 1, padding: Spacing.md },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  orderItemLeft: { flex: 1, marginRight: Spacing.md },
  orderItemName: { fontSize: FontSize.body, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  orderItemDetail: { fontSize: FontSize.caption, color: Colors.textSecondary, marginTop: 2 },
  orderItemSubtotal: { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  orderTotals: { padding: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, gap: 6 },
  orderTotalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  orderTotalKey: { fontSize: FontSize.body, color: Colors.textSecondary },
  orderTotalVal: { fontSize: FontSize.body, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  orderDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
  orderGrandKey: { fontSize: FontSize.h4, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  orderGrandVal: { fontSize: FontSize.h2, fontWeight: FontWeight.bold, color: Colors.posTotalDark },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.sky50,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  memberEmoji: { fontSize: 16 },
  memberName: { flex: 1, fontSize: FontSize.body, color: Colors.sky800, fontWeight: FontWeight.medium },

  // ── Right Panel ──
  rightPanel: {
    flex: 1.3,
    backgroundColor: Colors.background,
  },
  splitBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.sky50,
  },
  splitBtnText: { fontSize: FontSize.caption, color: Colors.primary, fontWeight: FontWeight.semiBold },

  totalDisplay: {
    backgroundColor: Colors.sky900,
    margin: Spacing.md,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  totalDisplayLabel: { fontSize: FontSize.caption, color: Colors.sky300, textTransform: 'uppercase', letterSpacing: 1 },
  totalDisplayAmount: { fontSize: 40, fontWeight: FontWeight.bold, color: Colors.white, marginTop: 4 },

  paymentEntry: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  paymentEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  paymentEntryTitle: { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  removePayment: { fontSize: FontSize.caption, color: Colors.danger },

  methodLabel: { fontSize: FontSize.caption, fontWeight: FontWeight.semiBold, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: Spacing.sm },
  methodRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  methodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  methodIcon: { fontSize: 16 },
  methodChipText: { fontSize: FontSize.body, color: Colors.textSecondary },

  amountGroup: { marginTop: Spacing.sm },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: Radius.sm,
    height: 52,
    overflow: 'hidden',
  },
  amountPrefix: {
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.h4,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    backgroundColor: Colors.gray50,
    height: '100%',
    lineHeight: 52,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  amountInput: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },

  quickCashRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md, flexWrap: 'wrap' },
  quickCashChip: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.gray50,
  },
  quickCashText: { fontSize: FontSize.caption, fontWeight: FontWeight.semiBold, color: Colors.textSecondary },

  qrisBox: {
    backgroundColor: Colors.gray50,
    borderRadius: Radius.sm,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  qrisPlaceholder: { fontSize: 64, color: Colors.textPrimary, letterSpacing: 4, marginBottom: Spacing.sm },
  qrisLabel: { fontSize: FontSize.body, color: Colors.textSecondary, marginBottom: 4 },
  qrisAmount: { fontSize: FontSize.h3, fontWeight: FontWeight.bold, color: Colors.primary },

  addSplitBtn: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addSplitText: { fontSize: FontSize.body, color: Colors.primary, fontWeight: FontWeight.semiBold },

  paymentSummary: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryKey: { fontSize: FontSize.body, color: Colors.textSecondary },
  summaryVal: { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.textPrimary },

  payBtnWrap: { padding: Spacing.md, paddingTop: Spacing.sm },
  payHint: { textAlign: 'center', fontSize: FontSize.caption, color: Colors.textMuted, marginTop: 4 },
});
