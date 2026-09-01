import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, ScrollView,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { useTransactionStore } from '../store/useTransactionStore';
import { Button, Badge, Toast, useToast, POSStatusBar } from '../components/ui';

interface Props {
  onShiftClosed: () => void;
  onBack: () => void;
}

const formatRp = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;

export const ClosingShiftScreen: React.FC<Props> = ({ onShiftClosed, onBack }) => {
  const { user, shift, closeShift } = useAuthStore();
  const { transactions, cashMovements } = useTransactionStore();
  const { toast, show, hide } = useToast();

  const [actualCash, setActualCash] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Calculations ──────────────────────────────────
  const shiftTx = useMemo(() =>
    transactions.filter((t) => t.shiftId === shift?.id && t.status !== 'VOIDED'),
    [transactions, shift]
  );

  const shiftMovements = useMemo(() =>
    cashMovements.filter((m) => m.shiftId === shift?.id),
    [cashMovements, shift]
  );

  const cashSales = shiftTx.reduce((sum, tx) => {
    const cashPayment = tx.payments.filter((p) => p.method === 'CASH').reduce((s, p) => s + p.amount, 0);
    return sum + cashPayment;
  }, 0);

  const nonCashSales = shiftTx.reduce((sum, tx) => {
    const nc = tx.payments.filter((p) => p.method !== 'CASH').reduce((s, p) => s + p.amount, 0);
    return sum + nc;
  }, 0);

  const cashIn  = shiftMovements.filter((m) => m.type === 'CASH_IN').reduce((s, m)  => s + m.amount, 0);
  const cashOut = shiftMovements.filter((m) => m.type === 'CASH_OUT').reduce((s, m) => s + m.amount, 0);

  const cashRefund = 0; // would come from approved return refunds
  const totalSales = shiftTx.reduce((sum, tx) => sum + tx.total, 0);
  const voidCount  = transactions.filter((t) => t.shiftId === shift?.id && t.status === 'VOIDED').length;

  const expectedCash = (shift?.openingCash ?? 0) + cashSales + cashIn - cashOut - cashRefund;
  const actualCashNum = parseInt(actualCash.replace(/\D/g, ''), 10) || 0;
  const variance = actualCashNum - expectedCash;
  const hasActual = actualCashNum > 0;
  const VARIANCE_THRESHOLD = 50000;
  const hasVarianceAlert = hasActual && Math.abs(variance) > VARIANCE_THRESHOLD;

  const openingTime = shift?.openingTime
    ? new Date(shift.openingTime).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '-';

  const handleClose = async () => {
    if (!hasActual) { show('Masukkan jumlah kas aktual.', 'error'); return; }
    if (hasVarianceAlert && !showConfirm) {
      setShowConfirm(true);
      return;
    }
    setLoading(true);
    const result = await closeShift(actualCashNum);
    setLoading(false);
    if (result.success) {
      show('Shift berhasil ditutup.', 'success');
      setTimeout(onShiftClosed, 1000);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <POSStatusBar />
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hide} />

      <View style={styles.body}>

        {/* ── Left: Shift Summary ── */}
        <ScrollView style={styles.leftPanel} showsVerticalScrollIndicator={false}>
          <View style={styles.panelHeader}>
            <TouchableOpacity style={styles.backBtn} onPress={onBack}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.panelTitle}>Ringkasan Shift</Text>
          </View>

          {/* Shift info */}
          <View style={styles.shiftInfoCard}>
            <View style={styles.shiftInfoRow}>
              <Text style={styles.siLabel}>Kasir</Text>
              <Text style={styles.siVal}>{user?.name}</Text>
            </View>
            <View style={styles.shiftInfoRow}>
              <Text style={styles.siLabel}>Terminal</Text>
              <Text style={styles.siVal}>{user?.terminalId}</Text>
            </View>
            <View style={styles.shiftInfoRow}>
              <Text style={styles.siLabel}>Mulai Shift</Text>
              <Text style={styles.siVal}>{openingTime}</Text>
            </View>
            <View style={styles.shiftInfoRow}>
              <Text style={styles.siLabel}>Total Transaksi</Text>
              <Text style={styles.siVal}>{shiftTx.length} transaksi</Text>
            </View>
            <View style={styles.shiftInfoRow}>
              <Text style={styles.siLabel}>Void</Text>
              <Text style={[styles.siVal, voidCount > 0 && { color: Colors.danger }]}>{voidCount}</Text>
            </View>
          </View>

          {/* Sales breakdown */}
          <Text style={styles.sectionTitle}>Penjualan</Text>
          <View style={styles.summaryCard}>
            <SummaryRow label="Total Penjualan" value={formatRp(totalSales)} bold />
            <SummaryRow label="Tunai" value={formatRp(cashSales)} />
            <SummaryRow label="Non-Tunai" value={formatRp(nonCashSales)} />
          </View>

          {/* Cash flow */}
          <Text style={styles.sectionTitle}>Arus Kas</Text>
          <View style={styles.summaryCard}>
            <SummaryRow label="Kas Awal" value={formatRp(shift?.openingCash ?? 0)} />
            <SummaryRow label="+ Penjualan Tunai" value={`+${formatRp(cashSales)}`} color={Colors.success} />
            <SummaryRow label="+ Cash In" value={`+${formatRp(cashIn)}`} color={Colors.success} />
            <SummaryRow label="- Cash Out" value={`-${formatRp(cashOut)}`} color={Colors.danger} />
            {cashRefund > 0 && (
              <SummaryRow label="- Refund Kas" value={`-${formatRp(cashRefund)}`} color={Colors.danger} />
            )}
            <View style={styles.divider} />
            <SummaryRow label="Estimasi Kas" value={formatRp(expectedCash)} bold highlight />
          </View>
        </ScrollView>

        {/* ── Right: Cash Count ── */}
        <View style={styles.rightPanel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Hitung Kas Penutup</Text>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {/* Expected cash display */}
            <View style={styles.expectedBox}>
              <Text style={styles.expectedLabel}>Estimasi Kas</Text>
              <Text style={styles.expectedValue}>{formatRp(expectedCash)}</Text>
              <Text style={styles.expectedHint}>Berdasarkan transaksi shift ini</Text>
            </View>

            {/* Actual cash input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Kas Aktual (Rp)</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputPrefix}>Rp</Text>
                <TextInput
                  style={styles.input}
                  value={actualCash}
                  onChangeText={(t) => {
                    setActualCash(t.replace(/\D/g, ''));
                    setShowConfirm(false);
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            {/* Variance display */}
            {hasActual && (
              <View style={[
                styles.varianceBox,
                {
                  backgroundColor: Math.abs(variance) <= VARIANCE_THRESHOLD
                    ? Colors.successBg
                    : Colors.dangerBg,
                  borderColor: Math.abs(variance) <= VARIANCE_THRESHOLD
                    ? Colors.success
                    : Colors.danger,
                },
              ]}>
                <Text style={styles.varianceLabel}>Selisih (Variance)</Text>
                <Text style={[
                  styles.varianceValue,
                  { color: Math.abs(variance) <= VARIANCE_THRESHOLD ? Colors.success : Colors.danger },
                ]}>
                  {variance >= 0 ? '+' : ''}{formatRp(variance)}
                </Text>
                <Text style={styles.varianceHint}>
                  {Math.abs(variance) <= VARIANCE_THRESHOLD
                    ? '✓ Selisih dalam batas wajar'
                    : `⚠️ Selisih melebihi threshold Rp ${VARIANCE_THRESHOLD.toLocaleString('id-ID')}`
                  }
                </Text>
              </View>
            )}

            {/* Manager alert */}
            {hasVarianceAlert && (
              <View style={styles.alertBox}>
                <Text style={styles.alertTitle}>⚠️ Perlu Review Manager</Text>
                <Text style={styles.alertText}>
                  Selisih kas melebihi batas. Transaksi closing akan membutuhkan review oleh manager.
                </Text>
              </View>
            )}

            {/* Confirmation for variance */}
            {showConfirm && (
              <View style={styles.confirmBox}>
                <Text style={styles.confirmTitle}>Konfirmasi Closing Shift</Text>
                <Text style={styles.confirmText}>
                  Ada selisih kas sebesar {formatRp(Math.abs(variance))}. Yakin tutup shift?
                </Text>
                <View style={styles.confirmBtns}>
                  <Button label="Batal" variant="secondary" size="sm" onPress={() => setShowConfirm(false)} />
                  <Button
                    label="Tetap Tutup Shift"
                    variant="danger"
                    size="sm"
                    loading={loading}
                    onPress={async () => {
                      setLoading(true);
                      const result = await closeShift(actualCashNum);
                      setLoading(false);
                      if (result.success) {
                        show('Shift berhasil ditutup.', 'success');
                        setTimeout(onShiftClosed, 1000);
                      }
                    }}
                  />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Close shift button */}
          <View style={styles.closeBtnWrap}>
            <Button
              label={loading ? 'Menutup Shift...' : 'Tutup Shift'}
              onPress={handleClose}
              loading={loading}
              disabled={!hasActual || showConfirm}
              fullWidth
              size="xl"
              variant="danger"
            />
            <Text style={styles.closeHint}>
              Pastikan uang kas sudah dihitung sebelum menutup shift.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const SummaryRow: React.FC<{ label: string; value: string; bold?: boolean; color?: string; highlight?: boolean }> = ({
  label, value, bold, color, highlight,
}) => (
  <View style={[srStyles.row, highlight && srStyles.rowHighlight]}>
    <Text style={[srStyles.label, bold && { fontWeight: FontWeight.bold, color: Colors.textPrimary }]}>
      {label}
    </Text>
    <Text style={[srStyles.value, bold && { fontWeight: FontWeight.bold }, color ? { color } : undefined]}>
      {value}
    </Text>
  </View>
);

const srStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  rowHighlight: {
    borderBottomWidth: 0,
    marginTop: 4,
    paddingTop: 8,
  },
  label: { fontSize: FontSize.body, color: Colors.textSecondary },
  value: { fontSize: FontSize.body, fontWeight: FontWeight.medium, color: Colors.textPrimary },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  body: { flex: 1, flexDirection: 'row' },
  panelHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.md,
  },
  panelTitle: { fontSize: FontSize.h4, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  backBtn: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: FontSize.h4, color: Colors.textSecondary },

  // Left
  leftPanel: { flex: 1, borderRightWidth: 1, borderRightColor: Colors.border },
  shiftInfoCard: { margin: Spacing.lg, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  shiftInfoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  siLabel: { fontSize: FontSize.body, color: Colors.textSecondary },
  siVal: { fontSize: FontSize.body, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  sectionTitle: { fontSize: FontSize.caption, fontWeight: FontWeight.semiBold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  summaryCard: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },

  // Right
  rightPanel: { flex: 1, backgroundColor: Colors.white },
  expectedBox: { backgroundColor: Colors.sky900, margin: Spacing.lg, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center' },
  expectedLabel: { fontSize: FontSize.caption, color: Colors.sky300, textTransform: 'uppercase', letterSpacing: 1 },
  expectedValue: { fontSize: 36, fontWeight: FontWeight.bold, color: Colors.white, marginTop: 4 },
  expectedHint: { fontSize: FontSize.caption, color: Colors.sky400, marginTop: 4 },
  inputSection: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  inputLabel: { fontSize: FontSize.body, fontWeight: FontWeight.medium, color: Colors.gray700, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.gray300, borderRadius: Radius.sm, height: 56, overflow: 'hidden' },
  inputPrefix: { paddingHorizontal: Spacing.md, fontSize: FontSize.h4, fontWeight: FontWeight.bold, color: Colors.textSecondary, backgroundColor: Colors.gray50, height: '100%', lineHeight: 56, borderRightWidth: 1, borderRightColor: Colors.border },
  input: { flex: 1, paddingHorizontal: Spacing.md, fontSize: FontSize.h2, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  varianceBox: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, alignItems: 'center' },
  varianceLabel: { fontSize: FontSize.caption, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  varianceValue: { fontSize: FontSize.h1, fontWeight: FontWeight.bold, marginTop: 4 },
  varianceHint: { fontSize: FontSize.caption, color: Colors.textSecondary, marginTop: 4 },
  alertBox: { marginHorizontal: Spacing.lg, backgroundColor: Colors.warningBg, borderRadius: Radius.sm, padding: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.warning, marginBottom: Spacing.lg },
  alertTitle: { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.warningText, marginBottom: 4 },
  alertText: { fontSize: FontSize.caption, color: Colors.warningText, lineHeight: 18 },
  confirmBox: { marginHorizontal: Spacing.lg, backgroundColor: Colors.dangerBg, borderRadius: Radius.sm, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.danger + '40', marginBottom: Spacing.lg },
  confirmTitle: { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.danger, marginBottom: 4 },
  confirmText: { fontSize: FontSize.caption, color: Colors.dangerText, marginBottom: Spacing.md, lineHeight: 18 },
  confirmBtns: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'flex-end' },
  closeBtnWrap: { padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  closeHint: { textAlign: 'center', fontSize: FontSize.caption, color: Colors.textMuted, marginTop: 6 },
});
