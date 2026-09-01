import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, SafeAreaView,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '../theme';
import { useTransactionStore } from '../store/useTransactionStore';
import { useAuthStore } from '../store/useAuthStore';
import { CashMovement, CashMovementType } from '../types';
import { Button, Badge, Modal, Toast, useToast, POSStatusBar } from '../components/ui';

interface Props {
  onBack: () => void;
}

const formatRp = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const CASH_IN_REASONS = ['Tambahan kas', 'Deposit awal', 'Pinjaman kas', 'Lainnya'];
const CASH_OUT_REASONS = ['Pembelian barang', 'Pengeluaran operasional', 'Pembayaran supplier', 'Pengembalian uang', 'Lainnya'];

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000];

export const CashManagementScreen: React.FC<Props> = ({ onBack }) => {
  const { cashMovements, addCashMovement } = useTransactionStore();
  const { user, shift, hasPermission } = useAuthStore();
  const { toast, show, hide } = useToast();

  const canCashIn  = hasPermission('cash.in');
  const canCashOut = hasPermission('cash.out');

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<CashMovementType>('CASH_IN');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);

  const shiftMovements = useMemo(() =>
    cashMovements.filter((m) => m.shiftId === shift?.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [cashMovements, shift]
  );

  const totalIn  = shiftMovements.filter((m) => m.type === 'CASH_IN').reduce((s, m) => s + m.amount, 0);
  const totalOut = shiftMovements.filter((m) => m.type === 'CASH_OUT').reduce((s, m) => s + m.amount, 0);
  const netCash  = (shift?.openingCash ?? 0) + totalIn - totalOut;

  const openModal = (type: CashMovementType) => {
    setModalType(type);
    setAmount('');
    setReason('');
    setCustomReason('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const numAmt = parseInt(amount.replace(/\D/g, ''), 10) || 0;
    if (numAmt <= 0) { show('Masukkan jumlah yang valid.', 'error'); return; }
    const finalReason = reason === 'Lainnya' ? customReason : reason;
    if (!finalReason.trim()) { show('Masukkan alasan.', 'error'); return; }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    addCashMovement({
      shiftId: shift?.id ?? '',
      type: modalType,
      amount: numAmt,
      reason: finalReason,
      userId: user?.id ?? '',
    });
    setLoading(false);
    setShowModal(false);
    show(
      `${modalType === 'CASH_IN' ? 'Cash In' : 'Cash Out'} ${formatRp(numAmt)} berhasil dicatat.`,
      'success'
    );
  };

  const reasons = modalType === 'CASH_IN' ? CASH_IN_REASONS : CASH_OUT_REASONS;

  const renderMovement = ({ item }: { item: CashMovement }) => (
    <View style={styles.movRow}>
      <View style={[
        styles.movType,
        { backgroundColor: item.type === 'CASH_IN' ? Colors.successBg : Colors.dangerBg },
      ]}>
        <Text style={{ fontSize: 18 }}>{item.type === 'CASH_IN' ? '↓' : '↑'}</Text>
      </View>
      <View style={styles.movInfo}>
        <Text style={styles.movTypeLabel}>
          {item.type === 'CASH_IN' ? 'Cash In' : 'Cash Out'}
        </Text>
        <Text style={styles.movReason}>{item.reason}</Text>
        <Text style={styles.movDate}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={[
        styles.movAmount,
        { color: item.type === 'CASH_IN' ? Colors.success : Colors.danger },
      ]}>
        {item.type === 'CASH_IN' ? '+' : '-'}{formatRp(item.amount)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <POSStatusBar />
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hide} />

      {/* Modal */}
      <Modal
        visible={showModal}
        onClose={() => setShowModal(false)}
        title={modalType === 'CASH_IN' ? '💰 Cash In' : '💸 Cash Out'}
        width={440}
        footer={
          <>
            <Button label="Batal" variant="secondary" size="md" onPress={() => setShowModal(false)} />
            <Button
              label={modalType === 'CASH_IN' ? 'Catat Cash In' : 'Catat Cash Out'}
              variant={modalType === 'CASH_IN' ? 'primary' : 'danger'}
              size="md"
              onPress={handleSubmit}
              loading={loading}
            />
          </>
        }
      >
        <View>
          <Text style={styles.modalLabel}>Jumlah (Rp)</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountPrefix}>Rp</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/\D/g, ''))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
            />
          </View>
          <View style={styles.quickRow}>
            {QUICK_AMOUNTS.map((a) => (
              <TouchableOpacity
                key={a}
                style={[styles.quickChip, parseInt(amount, 10) === a && styles.quickChipActive]}
                onPress={() => setAmount(a.toString())}
              >
                <Text style={[styles.quickText, parseInt(amount, 10) === a && { color: Colors.white }]}>
                  {a >= 1000000 ? `${a / 1000000}jt` : `${a / 1000}K`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.modalLabel}>Alasan</Text>
          <View style={styles.reasonGrid}>
            {reasons.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.reasonChip, reason === r && styles.reasonActive]}
                onPress={() => setReason(r)}
              >
                <Text style={[styles.reasonText, reason === r && styles.reasonTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {reason === 'Lainnya' && (
            <TextInput
              style={styles.customInput}
              value={customReason}
              onChangeText={setCustomReason}
              placeholder="Tulis alasan..."
              placeholderTextColor={Colors.textMuted}
            />
          )}
        </View>
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Manajemen Kas</Text>
      </View>

      {/* KPI cards */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { borderTopColor: Colors.primary }]}>
          <Text style={styles.kpiLabel}>Kas Awal</Text>
          <Text style={styles.kpiValue}>{formatRp(shift?.openingCash ?? 0)}</Text>
        </View>
        <View style={[styles.kpiCard, { borderTopColor: Colors.success }]}>
          <Text style={styles.kpiLabel}>Total Cash In</Text>
          <Text style={[styles.kpiValue, { color: Colors.success }]}>+{formatRp(totalIn)}</Text>
        </View>
        <View style={[styles.kpiCard, { borderTopColor: Colors.danger }]}>
          <Text style={styles.kpiLabel}>Total Cash Out</Text>
          <Text style={[styles.kpiValue, { color: Colors.danger }]}>-{formatRp(totalOut)}</Text>
        </View>
        <View style={[styles.kpiCard, { borderTopColor: Colors.sky900, backgroundColor: Colors.sky900 }]}>
          <Text style={[styles.kpiLabel, { color: Colors.sky300 }]}>Kas Saat Ini</Text>
          <Text style={[styles.kpiValue, { color: Colors.white }]}>{formatRp(netCash)}</Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.cashInBtn, !canCashIn && styles.actionBtnDisabled]}
          onPress={() => canCashIn ? openModal('CASH_IN') : show('Tidak memiliki izin Cash In.', 'error')}
        >
          <Text style={styles.actionBtnIcon}>↓</Text>
          <Text style={styles.actionBtnLabel}>Cash In</Text>
          {!canCashIn && <Badge label="Perlu Izin" variant="warning" style={{ marginTop: 4 }} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.cashOutBtn, !canCashOut && styles.actionBtnDisabled]}
          onPress={() => canCashOut ? openModal('CASH_OUT') : show('Tidak memiliki izin Cash Out.', 'error')}
        >
          <Text style={styles.actionBtnIcon}>↑</Text>
          <Text style={styles.actionBtnLabel}>Cash Out</Text>
          {!canCashOut && <Badge label="Perlu Izin" variant="warning" style={{ marginTop: 4 }} />}
        </TouchableOpacity>
      </View>

      {/* Movement list */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Riwayat Pergerakan Kas</Text>
        <Text style={styles.listCount}>{shiftMovements.length} entri</Text>
      </View>

      {shiftMovements.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>💰</Text>
          <Text style={styles.emptyTitle}>Belum ada pergerakan kas</Text>
          <Text style={styles.emptyDesc}>Cash In / Out akan muncul di sini.</Text>
        </View>
      ) : (
        <FlatList
          data={shiftMovements}
          keyExtractor={(item) => item.id}
          renderItem={renderMovement}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Spacing.xxl }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.md },
  backBtn: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: FontSize.h4, color: Colors.textSecondary },
  title: { fontSize: FontSize.h4, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  kpiRow: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg },
  kpiCard: { flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg, padding: Spacing.lg, borderTopWidth: 3, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  kpiLabel: { fontSize: FontSize.caption, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiValue: { fontSize: FontSize.h4, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: Spacing.lg, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  actionBtn: { flex: 1, borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', ...Shadow.sm },
  cashInBtn: { backgroundColor: Colors.successBg, borderWidth: 1, borderColor: Colors.success + '40' },
  cashOutBtn: { backgroundColor: Colors.dangerBg, borderWidth: 1, borderColor: Colors.danger + '40' },
  actionBtnDisabled: { opacity: 0.5 },
  actionBtnIcon: { fontSize: 32, marginBottom: 4 },
  actionBtnLabel: { fontSize: FontSize.h4, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  listTitle: { fontSize: FontSize.body, fontWeight: FontWeight.semiBold, color: Colors.textPrimary },
  listCount: { fontSize: FontSize.caption, color: Colors.textMuted },
  movRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.gray100, gap: Spacing.md },
  movType: { width: 44, height: 44, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  movInfo: { flex: 1 },
  movTypeLabel: { fontSize: FontSize.body, fontWeight: FontWeight.semiBold, color: Colors.textPrimary },
  movReason: { fontSize: FontSize.caption, color: Colors.textSecondary },
  movDate: { fontSize: FontSize.caption, color: Colors.textMuted, marginTop: 1 },
  movAmount: { fontSize: FontSize.h4, fontWeight: FontWeight.bold },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 48 },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.h4, fontWeight: FontWeight.semiBold, color: Colors.textPrimary, marginBottom: 4 },
  emptyDesc: { fontSize: FontSize.body, color: Colors.textSecondary },
  // Modal
  modalLabel: { fontSize: FontSize.caption, fontWeight: FontWeight.semiBold, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: Spacing.sm, marginTop: Spacing.sm },
  amountRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.gray300, borderRadius: Radius.sm, height: 52, overflow: 'hidden', marginBottom: Spacing.sm },
  amountPrefix: { paddingHorizontal: Spacing.md, fontSize: FontSize.h4, fontWeight: FontWeight.bold, color: Colors.textSecondary, backgroundColor: Colors.gray50, height: '100%', lineHeight: 52, borderRightWidth: 1, borderRightColor: Colors.border },
  amountInput: { flex: 1, paddingHorizontal: Spacing.md, fontSize: FontSize.h3, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  quickRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  quickChip: { flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.gray50 },
  quickChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  quickText: { fontSize: FontSize.caption, fontWeight: FontWeight.semiBold, color: Colors.textSecondary },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  reasonChip: { paddingVertical: 6, paddingHorizontal: Spacing.md, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.gray50 },
  reasonActive: { backgroundColor: Colors.sky100, borderColor: Colors.primary },
  reasonText: { fontSize: FontSize.caption, color: Colors.textSecondary },
  reasonTextActive: { color: Colors.primary, fontWeight: FontWeight.semiBold },
  customInput: { borderWidth: 1, borderColor: Colors.gray300, borderRadius: Radius.sm, padding: Spacing.md, fontSize: FontSize.body, color: Colors.textPrimary },
});
