import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, SafeAreaView, ScrollView,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '../theme';
import { useTransactionStore } from '../store/useTransactionStore';
import { useAuthStore } from '../store/useAuthStore';
import { Transaction, CartItem, PaymentMethod } from '../types';
import { Button, Badge, Modal, Toast, useToast, POSStatusBar } from '../components/ui';

interface Props {
  onBack: () => void;
  initialTransactionId?: string;
}

const formatRp = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const RETURN_REASONS = [
  'Produk rusak',
  'Salah produk',
  'Produk kadaluarsa',
  'Pelanggan tidak jadi beli',
  'Produk tidak sesuai deskripsi',
  'Lainnya',
];

const REFUND_METHODS: { method: PaymentMethod; label: string }[] = [
  { method: 'CASH', label: 'Tunai' },
  { method: 'QRIS', label: 'QRIS' },
  { method: 'DEBIT', label: 'Debit' },
];

type ReturnItem = { productId: string; productName: string; maxQty: number; returnQty: number };

export const ReturnScreen: React.FC<Props> = ({ onBack, initialTransactionId }) => {
  const { transactions, requestReturn } = useTransactionStore();
  const { user, hasPermission } = useAuthStore();
  const { toast, show, hide } = useToast();

  const canReturn = hasPermission('return.create');
  const needsApproval = !hasPermission('return.approve');

  const [search, setSearch] = useState(initialTransactionId ?? '');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('CASH');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const returnableTx = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = transactions.filter(
      (t) => t.status === 'COMPLETED' || t.status === 'SYNCED'
    );
    if (q) {
      list = list.filter(
        (t) => t.id.toLowerCase().includes(q) || t.cashierName.toLowerCase().includes(q)
      );
    }
    return list.slice(0, 20);
  }, [transactions, search]);

  const handleSelectTx = (tx: Transaction) => {
    setSelectedTx(tx);
    setReturnItems(
      tx.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        maxQty: item.quantity,
        returnQty: 0,
      }))
    );
    setShowModal(true);
  };

  const updateReturnQty = (productId: string, qty: number) => {
    setReturnItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, returnQty: Math.max(0, Math.min(qty, i.maxQty)) }
          : i
      )
    );
  };

  const selectedItems = returnItems.filter((i) => i.returnQty > 0);
  const refundAmount = selectedTx
    ? selectedItems.reduce((sum, ri) => {
        const orig = selectedTx.items.find((i) => i.productId === ri.productId);
        if (!orig) return sum;
        const unitPrice = orig.subtotal / orig.quantity;
        return sum + unitPrice * ri.returnQty;
      }, 0)
    : 0;

  const handleSubmit = async () => {
    if (selectedItems.length === 0) { show('Pilih minimal 1 item untuk diretur.', 'error'); return; }
    const finalReason = reason === 'Lainnya' ? customReason : reason;
    if (!finalReason.trim()) { show('Masukkan alasan retur.', 'error'); return; }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    requestReturn({
      originalTransactionId: selectedTx!.id,
      items: selectedItems.map((i) => ({ productId: i.productId, productName: i.productName, quantity: i.returnQty })),
      reason: finalReason,
      refundAmount,
      refundMethod,
      cashierId: user?.id ?? '',
      status: needsApproval ? 'PENDING_APPROVAL' : 'APPROVED',
    });

    setLoading(false);
    setShowModal(false);
    setReason('');
    setSelectedTx(null);

    if (needsApproval) {
      show('Permintaan retur dikirim. Menunggu persetujuan manager.', 'warning');
    } else {
      show('Retur berhasil diproses.', 'success');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <POSStatusBar />
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hide} />

      {/* Return Modal */}
      <Modal
        visible={showModal}
        onClose={() => { setShowModal(false); setReason(''); }}
        title="Proses Retur"
        width={560}
        footer={
          <>
            <Button label="Batal" variant="secondary" size="md" onPress={() => { setShowModal(false); setReason(''); }} />
            <Button
              label={needsApproval ? 'Kirim ke Manager' : 'Proses Retur'}
              variant="primary"
              size="md"
              onPress={handleSubmit}
              loading={loading}
            />
          </>
        }
      >
        {selectedTx && (
          <View>
            {needsApproval && (
              <View style={styles.approvalBanner}>
                <Text style={styles.approvalText}>
                  ⚠️ Permintaan retur membutuhkan persetujuan manager.
                </Text>
              </View>
            )}

            {/* Transaction info */}
            <View style={styles.txInfo}>
              <Text style={styles.txInfoId}>{selectedTx.id}</Text>
              <Text style={styles.txInfoDate}>{formatDate(selectedTx.createdAt)}</Text>
            </View>

            {/* Item selection */}
            <Text style={styles.sectionLabel}>Pilih Item yang Diretur</Text>
            {returnItems.map((ri) => (
              <View key={ri.productId} style={styles.returnItemRow}>
                <View style={styles.returnItemInfo}>
                  <Text style={styles.returnItemName}>{ri.productName}</Text>
                  <Text style={styles.returnItemMax}>Maks: {ri.maxQty}</Text>
                </View>
                <View style={styles.qtyControl}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateReturnQty(ri.productId, ri.returnQty - 1)}
                  >
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.qtyVal, ri.returnQty > 0 && { color: Colors.primary, fontWeight: FontWeight.bold }]}>
                    {ri.returnQty}
                  </Text>
                  <TouchableOpacity
                    style={[styles.qtyBtn, ri.returnQty >= ri.maxQty && styles.qtyBtnDisabled]}
                    onPress={() => updateReturnQty(ri.productId, ri.returnQty + 1)}
                    disabled={ri.returnQty >= ri.maxQty}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Reason */}
            <Text style={styles.sectionLabel}>Alasan Retur</Text>
            <View style={styles.reasonGrid}>
              {RETURN_REASONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.reasonChip, reason === r && styles.reasonChipActive]}
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
                placeholder="Tulis alasan retur..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={2}
              />
            )}

            {/* Refund method */}
            <Text style={styles.sectionLabel}>Metode Pengembalian Dana</Text>
            <View style={styles.refundMethods}>
              {REFUND_METHODS.map((m) => (
                <TouchableOpacity
                  key={m.method}
                  style={[styles.refundChip, refundMethod === m.method && styles.refundChipActive]}
                  onPress={() => setRefundMethod(m.method)}
                >
                  <Text style={[styles.refundText, refundMethod === m.method && { color: Colors.white }]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Summary */}
            <View style={styles.refundSummary}>
              <Text style={styles.refundSummaryLabel}>Total Pengembalian Dana</Text>
              <Text style={styles.refundSummaryAmount}>{formatRp(refundAmount)}</Text>
            </View>
          </View>
        )}
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Retur Produk</Text>
          <Text style={styles.subtitle}>{needsApproval ? 'Butuh persetujuan manager' : 'Izin retur aktif'}</Text>
        </View>
        {needsApproval && <Badge label="Approval Required" variant="warning" />}
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <View style={styles.searchWrap}>
          <Text>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Cari ID transaksi atau kasir..."
            placeholderTextColor={Colors.textMuted}
          />
        </View>
      </View>

      {/* Table header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 2 }]}>ID Transaksi</Text>
        <Text style={[styles.th, { flex: 1 }]}>Waktu</Text>
        <Text style={[styles.th, { flex: 1 }]}>Item</Text>
        <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Total</Text>
      </View>

      <FlatList
        data={returnableTx}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>↩</Text>
            <Text style={styles.emptyTitle}>Tidak ada transaksi</Text>
            <Text style={styles.emptyDesc}>Cari berdasarkan ID transaksi.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => handleSelectTx(item)}
            activeOpacity={0.75}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.txId}>{item.id}</Text>
              <Text style={styles.txDate}>{formatDate(item.createdAt)} • {item.cashierName}</Text>
            </View>
            <Text style={styles.txCount}>{item.items.length} item</Text>
            <Text style={styles.txTotal}>{formatRp(item.total)}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.md },
  backBtn: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: FontSize.h4, color: Colors.textSecondary },
  title: { fontSize: FontSize.h4, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.caption, color: Colors.textMuted, marginTop: 1 },
  searchBar: { backgroundColor: Colors.white, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchWrap: { flexDirection: 'row', alignItems: 'center', height: 40, backgroundColor: Colors.gray50, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, gap: Spacing.sm },
  searchInput: { flex: 1, fontSize: FontSize.body, color: Colors.textPrimary },
  tableHeader: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, backgroundColor: Colors.gray100, borderBottomWidth: 1, borderBottomColor: Colors.border },
  th: { fontSize: FontSize.caption, fontWeight: FontWeight.semiBold, color: Colors.textMuted, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  rowLeft: { flex: 1 },
  txId: { fontSize: FontSize.body, fontWeight: FontWeight.semiBold, color: Colors.textPrimary, fontFamily: 'monospace' },
  txDate: { fontSize: FontSize.caption, color: Colors.textMuted, marginTop: 2 },
  txCount: { width: 60, fontSize: FontSize.body, color: Colors.textSecondary, textAlign: 'center' },
  txTotal: { width: 120, fontSize: FontSize.h4, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 48 },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.h4, fontWeight: FontWeight.semiBold, color: Colors.textPrimary, marginBottom: 4 },
  emptyDesc: { fontSize: FontSize.body, color: Colors.textSecondary },
  // Modal
  approvalBanner: { backgroundColor: Colors.warningBg, borderRadius: Radius.sm, padding: Spacing.md, marginBottom: Spacing.lg, borderLeftWidth: 3, borderLeftColor: Colors.warning },
  approvalText: { fontSize: FontSize.caption, color: Colors.warningText },
  txInfo: { backgroundColor: Colors.gray50, borderRadius: Radius.sm, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
  txInfoId: { fontSize: FontSize.caption, color: Colors.textMuted, fontFamily: 'monospace' },
  txInfoDate: { fontSize: FontSize.body, color: Colors.textSecondary, marginTop: 2 },
  sectionLabel: { fontSize: FontSize.caption, fontWeight: FontWeight.semiBold, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: Spacing.sm, marginTop: Spacing.sm },
  returnItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  returnItemInfo: { flex: 1 },
  returnItemName: { fontSize: FontSize.body, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  returnItemMax: { fontSize: FontSize.caption, color: Colors.textMuted },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  qtyBtn: { width: 28, height: 28, borderRadius: Radius.sm, backgroundColor: Colors.sky100, alignItems: 'center', justifyContent: 'center' },
  qtyBtnDisabled: { backgroundColor: Colors.gray100 },
  qtyBtnText: { fontSize: FontSize.h4, fontWeight: FontWeight.bold, color: Colors.primary, lineHeight: 20 },
  qtyVal: { width: 32, textAlign: 'center', fontSize: FontSize.body, color: Colors.textSecondary },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  reasonChip: { paddingVertical: 6, paddingHorizontal: Spacing.md, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.gray50 },
  reasonChipActive: { backgroundColor: Colors.sky100, borderColor: Colors.primary },
  reasonText: { fontSize: FontSize.caption, color: Colors.textSecondary },
  reasonTextActive: { color: Colors.primary, fontWeight: FontWeight.semiBold },
  customInput: { borderWidth: 1, borderColor: Colors.gray300, borderRadius: Radius.sm, padding: Spacing.md, fontSize: FontSize.body, color: Colors.textPrimary, marginBottom: Spacing.md, textAlignVertical: 'top' },
  refundMethods: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  refundChip: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.gray50 },
  refundChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  refundText: { fontSize: FontSize.body, color: Colors.textSecondary },
  refundSummary: { backgroundColor: Colors.sky900, borderRadius: Radius.sm, padding: Spacing.lg, alignItems: 'center' },
  refundSummaryLabel: { fontSize: FontSize.caption, color: Colors.sky300, textTransform: 'uppercase', letterSpacing: 1 },
  refundSummaryAmount: { fontSize: FontSize.h2, fontWeight: FontWeight.bold, color: Colors.white, marginTop: 4 },
});
