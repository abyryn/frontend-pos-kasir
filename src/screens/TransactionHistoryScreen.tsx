import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, SafeAreaView, ScrollView,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '../theme';
import { useTransactionStore } from '../store/useTransactionStore';
import { useAuthStore } from '../store/useAuthStore';
import { Transaction, TransactionStatus, PaymentMethod } from '../types';
import { Badge, Button, Modal, POSStatusBar } from '../components/ui';

interface Props {
  onBack: () => void;
  onReprintPress: (txId: string) => void;
  onReturnPress: (txId: string) => void;
}

const formatRp = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const statusVariant = (s: TransactionStatus) => {
  const map: Record<TransactionStatus, 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'pending'> = {
    COMPLETED: 'success',
    PENDING_SYNC: 'warning',
    SYNCED: 'success',
    VOIDED: 'danger',
    RETURNED: 'neutral',
    PARTIALLY_RETURNED: 'warning',
  };
  return map[s] ?? 'neutral';
};

const statusLabel = (s: TransactionStatus) => {
  const map: Record<TransactionStatus, string> = {
    COMPLETED: 'Selesai',
    PENDING_SYNC: 'Pending Sync',
    SYNCED: 'Tersinkron',
    VOIDED: 'Void',
    RETURNED: 'Retur',
    PARTIALLY_RETURNED: 'Partial Retur',
  };
  return map[s] ?? s;
};

const payMethodLabel = (m: PaymentMethod) => {
  const map: Record<PaymentMethod, string> = {
    CASH: 'Tunai', QRIS: 'QRIS', DEBIT: 'Debit',
    CREDIT: 'Kredit', EWALLET: 'E-Wallet', TRANSFER: 'Transfer',
  };
  return map[m] ?? m;
};

type FilterStatus = 'ALL' | TransactionStatus;

const STATUS_FILTERS: { key: FilterStatus; label: string }[] = [
  { key: 'ALL', label: 'Semua' },
  { key: 'COMPLETED', label: 'Selesai' },
  { key: 'PENDING_SYNC', label: 'Pending' },
  { key: 'SYNCED', label: 'Sync' },
  { key: 'VOIDED', label: 'Void' },
  { key: 'RETURNED', label: 'Retur' },
];

export const TransactionHistoryScreen: React.FC<Props> = ({
  onBack, onReprintPress, onReturnPress,
}) => {
  const { transactions } = useTransactionStore();
  const { hasPermission } = useAuthStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    let list = [...transactions];
    if (statusFilter !== 'ALL') {
      list = list.filter((t) => t.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          (t.customerName ?? '').toLowerCase().includes(q) ||
          t.cashierName.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [transactions, search, statusFilter]);

  const renderItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={() => setSelectedTx(item)}
      activeOpacity={0.75}
    >
      <View style={styles.rowLeft}>
        <Text style={styles.txId}>{item.id}</Text>
        <Text style={styles.txDate}>{formatDate(item.createdAt)}</Text>
        <View style={styles.txMeta}>
          <Text style={styles.txCashier}>👤 {item.cashierName}</Text>
          {item.customerName && (
            <Text style={styles.txCustomer}>• 🏷 {item.customerName}</Text>
          )}
          <Text style={styles.txPayment}>
            • {item.payments.map((p) => payMethodLabel(p.method)).join(' + ')}
          </Text>
        </View>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.txTotal}>{formatRp(item.total)}</Text>
        <Badge label={statusLabel(item.status)} variant={statusVariant(item.status)} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <POSStatusBar />

      {/* Transaction Detail Modal */}
      <Modal
        visible={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        title={`Detail Transaksi`}
        width={560}
        footer={
          <View style={styles.modalFooter}>
            {hasPermission('pos.reprint') && (
              <Button
                label="🖨 Cetak Ulang"
                variant="secondary"
                size="md"
                onPress={() => { onReprintPress(selectedTx!.id); setSelectedTx(null); }}
              />
            )}
            {hasPermission('return.create') &&
              selectedTx?.status === 'COMPLETED' || selectedTx?.status === 'SYNCED' ? (
              <Button
                label="↩ Retur"
                variant="outline"
                size="md"
                onPress={() => { onReturnPress(selectedTx!.id); setSelectedTx(null); }}
              />
            ) : null}
            <Button label="Tutup" variant="primary" size="md" onPress={() => setSelectedTx(null)} />
          </View>
        }
      >
        {selectedTx && <TransactionDetail tx={selectedTx} />}
      </Modal>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Riwayat Transaksi</Text>
        <Text style={styles.count}>{filtered.length} transaksi</Text>
      </View>

      {/* Search & Filter */}
      <View style={styles.toolbar}>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Cari ID transaksi, nama kasir, member..."
            placeholderTextColor={Colors.textMuted}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {STATUS_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, statusFilter === f.key && styles.filterChipActive]}
              onPress={() => setStatusFilter(f.key)}
            >
              <Text style={[styles.filterChipText, statusFilter === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Table header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.th, { flex: 2 }]}>ID Transaksi</Text>
        <Text style={[styles.th, { flex: 1.5 }]}>Waktu</Text>
        <Text style={[styles.th, { flex: 1 }]}>Kasir</Text>
        <Text style={[styles.th, { flex: 1 }]}>Pembayaran</Text>
        <Text style={[styles.th, { flex: 1, textAlign: 'right' }]}>Total</Text>
        <Text style={[styles.th, { width: 100, textAlign: 'center' }]}>Status</Text>
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🧾</Text>
          <Text style={styles.emptyTitle}>Tidak ada transaksi</Text>
          <Text style={styles.emptyDesc}>Coba ubah filter atau kata kunci pencarian.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Spacing.xxl }}
        />
      )}
    </SafeAreaView>
  );
};

// ── Transaction Detail sub-component ──────────────────────
const TransactionDetail: React.FC<{ tx: Transaction }> = ({ tx }) => (
  <View>
    <View style={detailStyles.section}>
      <Row label="ID Transaksi" value={tx.id} mono />
      <Row label="Waktu" value={formatDate(tx.createdAt)} />
      <Row label="Kasir" value={tx.cashierName} />
      {tx.customerName && <Row label="Member" value={tx.customerName} />}
      <Row label="Terminal" value={tx.terminalId} />
      <Row label="Status" value={statusLabel(tx.status)} highlight={statusVariant(tx.status)} />
    </View>

    <Text style={detailStyles.sectionTitle}>Item Produk</Text>
    <View style={detailStyles.section}>
      {tx.items.map((item, i) => (
        <View key={i} style={detailStyles.itemRow}>
          <View style={{ flex: 1 }}>
            <Text style={detailStyles.itemName}>{item.productName}</Text>
            <Text style={detailStyles.itemSku}>{item.sku}</Text>
          </View>
          <Text style={detailStyles.itemQty}>{item.quantity}×</Text>
          <View style={detailStyles.itemPrices}>
            <Text style={detailStyles.itemSubtotal}>{formatRp(item.subtotal)}</Text>
            {item.discount > 0 && (
              <Text style={detailStyles.itemDiscount}>
                -{item.discountType === 'percentage' ? `${item.discount}%` : formatRp(item.discount)}
              </Text>
            )}
          </View>
        </View>
      ))}
    </View>

    <Text style={detailStyles.sectionTitle}>Ringkasan</Text>
    <View style={detailStyles.section}>
      <Row label="Subtotal" value={formatRp(tx.subtotal)} />
      {tx.discountTotal > 0 && <Row label="Diskon" value={`-${formatRp(tx.discountTotal)}`} />}
      <Row label="Total" value={formatRp(tx.total)} bold />
    </View>

    <Text style={detailStyles.sectionTitle}>Pembayaran</Text>
    <View style={detailStyles.section}>
      {tx.payments.map((p, i) => (
        <Row key={i} label={payMethodLabel(p.method)} value={formatRp(p.amount)} />
      ))}
      {tx.change > 0 && <Row label="Kembalian" value={formatRp(tx.change)} />}
    </View>
  </View>
);

const Row: React.FC<{
  label: string; value: string; mono?: boolean; bold?: boolean;
  highlight?: string;
}> = ({ label, value, mono, bold, highlight }) => (
  <View style={detailStyles.row}>
    <Text style={detailStyles.rowLabel}>{label}</Text>
    <Text style={[
      detailStyles.rowValue,
      mono && { fontFamily: 'monospace', fontSize: FontSize.caption },
      bold && { fontWeight: FontWeight.bold, color: Colors.textPrimary },
    ]}>
      {value}
    </Text>
  </View>
);

const detailStyles = StyleSheet.create({
  section: {
    backgroundColor: Colors.gray50,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semiBold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  rowLabel: { fontSize: FontSize.body, color: Colors.textSecondary },
  rowValue: { fontSize: FontSize.body, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    gap: Spacing.sm,
  },
  itemName: { fontSize: FontSize.body, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  itemSku: { fontSize: FontSize.caption, color: Colors.textMuted },
  itemQty: { fontSize: FontSize.body, color: Colors.textSecondary, minWidth: 28, textAlign: 'center' },
  itemPrices: { alignItems: 'flex-end', minWidth: 80 },
  itemSubtotal: { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  itemDiscount: { fontSize: FontSize.caption, color: Colors.success },
});

// ── Main styles ────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: Radius.sm,
    backgroundColor: Colors.gray100, alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: FontSize.h4, color: Colors.textSecondary },
  title: { flex: 1, fontSize: FontSize.h4, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  count: { fontSize: FontSize.body, color: Colors.textMuted },
  toolbar: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    backgroundColor: Colors.gray50,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, fontSize: FontSize.body, color: Colors.textPrimary },
  filterScroll: { maxHeight: 40 },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    marginRight: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.gray50,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: FontSize.caption, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  filterChipTextActive: { color: Colors.white },
  tableHeader: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.gray50,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  th: { fontSize: FontSize.caption, fontWeight: FontWeight.semiBold, color: Colors.textMuted, textTransform: 'uppercase' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  rowLeft: { flex: 1 },
  rowRight: { alignItems: 'flex-end', gap: 6 },
  txId: { fontSize: FontSize.body, fontWeight: FontWeight.semiBold, color: Colors.textPrimary, fontFamily: 'monospace' },
  txDate: { fontSize: FontSize.caption, color: Colors.textMuted, marginTop: 2 },
  txMeta: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginTop: 4 },
  txCashier: { fontSize: FontSize.caption, color: Colors.textSecondary },
  txCustomer: { fontSize: FontSize.caption, color: Colors.textSecondary },
  txPayment: { fontSize: FontSize.caption, color: Colors.textSecondary },
  txTotal: { fontSize: FontSize.h4, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 48 },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.h4, fontWeight: FontWeight.semiBold, color: Colors.textPrimary, marginBottom: 4 },
  emptyDesc: { fontSize: FontSize.body, color: Colors.textSecondary, textAlign: 'center' },
  modalFooter: { flexDirection: 'row', gap: Spacing.sm },
});
