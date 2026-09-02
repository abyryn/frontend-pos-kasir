import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, SafeAreaView, Alert,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '../theme';
import { useTransactionStore } from '../store/useTransactionStore';
import { useAuthStore } from '../store/useAuthStore';
import { Transaction } from '../types';
import { Button, Badge, Modal, Toast, useToast, POSStatusBar } from '../components/ui';

interface Props {
  onBack: () => void;
  initialTransactionId?: string;
}

const formatRp = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const VOID_REASONS = [
  'Salah scan produk',
  'Salah input harga',
  'Permintaan pelanggan',
  'Transaksi duplikat',
  'Kesalahan kasir',
  'Lainnya',
];

export const VoidScreen: React.FC<Props> = ({ onBack, initialTransactionId }) => {
  const { transactions, voidTransaction } = useTransactionStore();
  const { user, hasPermission } = useAuthStore();
  const { toast, show, hide } = useToast();

  const [search, setSearch] = useState(initialTransactionId ?? '');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);

  const canVoid = hasPermission('pos.void');
  const needsApproval = !canVoid;

  const filteredTx = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return transactions.slice(0, 20);
    return transactions.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.cashierName.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [transactions, search]);

  const voidableTx = filteredTx.filter((t) => t.status === 'COMPLETED' || t.status === 'SYNCED');

  const handleVoidSubmit = async () => {
    if (!selectedTx) return;
    const finalReason = reason === 'Lainnya' ? customReason : reason;
    if (!finalReason.trim()) { show('Masukkan alasan void.', 'error'); return; }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    voidTransaction(selectedTx.id, finalReason, user?.id ?? '', needsApproval);
    setLoading(false);
    setShowVoidModal(false);
    setSelectedTx(null);
    setReason('');

    if (needsApproval) {
      show('Permintaan void dikirim. Menunggu persetujuan manager.', 'warning');
    } else {
      show('Transaksi berhasil di-void.', 'success');
    }
  };

  const renderItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => {
        setSelectedTx(item);
        setShowVoidModal(true);
      }}
      activeOpacity={0.75}
    >
      <View style={styles.rowLeft}>
        <Text style={styles.txId}>{item.id}</Text>
        <Text style={styles.txDate}>{formatDate(item.createdAt)} • {item.cashierName}</Text>
        <Text style={styles.txItems}>{item.items.length} item produk</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.txTotal}>{formatRp(item.total)}</Text>
        <View style={styles.voidBtn}>
          <Text style={styles.voidBtnText}>Void</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <POSStatusBar />
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hide} />

      {/* Void Confirmation Modal */}
      <Modal
        visible={showVoidModal}
        onClose={() => { setShowVoidModal(false); setReason(''); }}
        title="Void Transaksi"
        width={480}
        footer={
          <>
            <Button label="Batal" variant="secondary" size="md" onPress={() => { setShowVoidModal(false); setReason(''); }} />
            <Button
              label={needsApproval ? 'Kirim ke Manager' : 'Konfirmasi Void'}
              variant="danger"
              size="md"
              onPress={handleVoidSubmit}
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
                  Catatan: Anda tidak memiliki izin void langsung. Permintaan akan dikirim ke manager untuk persetujuan.
                </Text>
              </View>
            )}

            <View style={styles.txPreview}>
              <Text style={styles.txPreviewId}>{selectedTx.id}</Text>
              <Text style={styles.txPreviewDate}>{formatDate(selectedTx.createdAt)}</Text>
              <Text style={styles.txPreviewTotal}>{formatRp(selectedTx.total)}</Text>
            </View>

            <Text style={styles.reasonLabel}>Alasan Void</Text>
            <View style={styles.reasonGrid}>
              {VOID_REASONS.map((r) => (
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
              <View style={styles.customReasonGroup}>
                <Text style={styles.reasonLabel}>Alasan Lainnya</Text>
                <TextInput
                  style={styles.customInput}
                  value={customReason}
                  onChangeText={setCustomReason}
                  placeholder="Tulis alasan void..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}

            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                Peringatan: Tindakan ini tidak dapat dibatalkan. Transaksi akan berstatus VOID dan tetap tercatat di sistem.
              </Text>
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
          <Text style={styles.title}>Void Transaksi</Text>
          <Text style={styles.subtitle}>
            {needsApproval ? 'Butuh persetujuan manager' : 'Izin void aktif'}
          </Text>
        </View>
        {needsApproval && (
          <Badge label="Approval Required" variant="warning" />
        )}
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Cari ID transaksi atau nama kasir..."
            placeholderTextColor={Colors.textMuted}
          />
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          Menampilkan transaksi yang dapat di-void (status: Selesai / Tersinkron)
        </Text>
        <Text style={styles.infoCount}>{voidableTx.length} transaksi</Text>
      </View>

      {/* Table header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 2 }]}>ID Transaksi</Text>
        <Text style={[styles.th, { flex: 1 }]}>Waktu</Text>
        <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Total</Text>
        <Text style={[styles.th, { width: 80, textAlign: 'center' }]}>Aksi</Text>
      </View>

      {voidableTx.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Tidak ada transaksi yang bisa di-void</Text>
          <Text style={styles.emptyDesc}>Cari berdasarkan ID transaksi.</Text>
        </View>
      ) : (
        <FlatList
          data={voidableTx}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.md,
  },
  backBtn: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: FontSize.h4, color: Colors.textSecondary },
  title: { fontSize: FontSize.h4, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.caption, color: Colors.textMuted, marginTop: 1 },
  searchBar: { backgroundColor: Colors.white, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchWrap: { flexDirection: 'row', alignItems: 'center', height: 40, backgroundColor: Colors.gray50, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, gap: Spacing.sm },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: FontSize.body, color: Colors.textPrimary },
  infoBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, backgroundColor: Colors.gray50 },
  infoText: { fontSize: FontSize.caption, color: Colors.textMuted },
  infoCount: { fontSize: FontSize.caption, fontWeight: FontWeight.semiBold, color: Colors.textSecondary },
  tableHeader: { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, backgroundColor: Colors.gray100, borderBottomWidth: 1, borderBottomColor: Colors.border },
  th: { fontSize: FontSize.caption, fontWeight: FontWeight.semiBold, color: Colors.textMuted, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  rowLeft: { flex: 1 },
  rowRight: { alignItems: 'flex-end', gap: 6 },
  txId: { fontSize: FontSize.body, fontWeight: FontWeight.semiBold, color: Colors.textPrimary, fontFamily: 'monospace' },
  txDate: { fontSize: FontSize.caption, color: Colors.textMuted, marginTop: 2 },
  txItems: { fontSize: FontSize.caption, color: Colors.textSecondary, marginTop: 1 },
  txTotal: { fontSize: FontSize.h4, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  voidBtn: { backgroundColor: Colors.dangerBg, paddingVertical: 4, paddingHorizontal: Spacing.md, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.danger + '40' },
  voidBtnText: { fontSize: FontSize.caption, color: Colors.danger, fontWeight: FontWeight.bold },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 48 },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.h4, fontWeight: FontWeight.semiBold, color: Colors.textPrimary, marginBottom: 4 },
  emptyDesc: { fontSize: FontSize.body, color: Colors.textSecondary },
  // Modal styles
  approvalBanner: { backgroundColor: Colors.warningBg, borderRadius: Radius.sm, padding: Spacing.md, marginBottom: Spacing.lg, borderLeftWidth: 3, borderLeftColor: Colors.warning },
  approvalText: { fontSize: FontSize.caption, color: Colors.warningText, lineHeight: 18 },
  txPreview: { backgroundColor: Colors.gray50, borderRadius: Radius.sm, padding: Spacing.md, marginBottom: Spacing.lg, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  txPreviewId: { fontSize: FontSize.caption, color: Colors.textMuted, fontFamily: 'monospace' },
  txPreviewDate: { fontSize: FontSize.caption, color: Colors.textSecondary },
  txPreviewTotal: { fontSize: FontSize.h3, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 4 },
  reasonLabel: { fontSize: FontSize.caption, fontWeight: FontWeight.semiBold, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: Spacing.sm },
  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  reasonChip: { paddingVertical: 6, paddingHorizontal: Spacing.md, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.gray50 },
  reasonChipActive: { backgroundColor: Colors.dangerBg, borderColor: Colors.danger },
  reasonText: { fontSize: FontSize.caption, color: Colors.textSecondary },
  reasonTextActive: { color: Colors.danger, fontWeight: FontWeight.semiBold },
  customReasonGroup: { marginBottom: Spacing.lg },
  customInput: { borderWidth: 1, borderColor: Colors.gray300, borderRadius: Radius.sm, padding: Spacing.md, fontSize: FontSize.body, color: Colors.textPrimary, height: 80, textAlignVertical: 'top' },
  warningBox: { backgroundColor: Colors.dangerBg, borderRadius: Radius.sm, padding: Spacing.md, borderLeftWidth: 3, borderLeftColor: Colors.danger },
  warningText: { fontSize: FontSize.caption, color: Colors.dangerText, lineHeight: 18 },
});
