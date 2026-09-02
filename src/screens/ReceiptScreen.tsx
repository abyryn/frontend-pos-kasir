import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  ScrollView, TouchableOpacity,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '../theme';
import { useTransactionStore } from '../store/useTransactionStore';
import { useAuthStore } from '../store/useAuthStore';
import { Button, POSStatusBar } from '../components/ui';

interface Props {
  transactionId: string;
  onNewTransaction: () => void;
  onClose: () => void;
}

const formatRp = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;
const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const payLabel: Record<string, string> = {
  CASH: 'Tunai', QRIS: 'QRIS', DEBIT: 'Debit',
  CREDIT: 'Kredit', EWALLET: 'E-Wallet', TRANSFER: 'Transfer',
};

export const ReceiptScreen: React.FC<Props> = ({
  transactionId, onNewTransaction, onClose,
}) => {
  const { getTransactionById } = useTransactionStore();
  const { user } = useAuthStore();
  const tx = getTransactionById(transactionId);

  if (!tx) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Transaksi tidak ditemukan.</Text>
          <Button label="Kembali" variant="primary" size="md" onPress={onClose} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <POSStatusBar />

      <View style={styles.body}>

        {/* ── Left: Success state ── */}
        <View style={styles.leftPanel}>
          <View style={styles.successCircle}>
            <Text style={styles.successCheck}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Transaksi Berhasil!</Text>
          <Text style={styles.successSubtitle}>Pembayaran telah dikonfirmasi</Text>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total Dibayar</Text>
            <Text style={styles.summaryAmount}>{formatRp(tx.total)}</Text>
            {tx.change > 0 && (
              <>
                <Text style={styles.changeLabel}>Kembalian</Text>
                <Text style={styles.changeAmount}>{formatRp(tx.change)}</Text>
              </>
            )}
          </View>

          <View style={styles.txIdBox}>
            <Text style={styles.txIdLabel}>ID Transaksi</Text>
            <Text style={styles.txIdValue}>{tx.id}</Text>
          </View>

          <View style={styles.actionRow}>
            <Button
              label="Cetak Struk"
              variant="secondary"
              size="lg"
              onPress={() => {/* Trigger print */}}
              style={{ flex: 1 }}
            />
            <Button
              label="Transaksi Baru"
              variant="primary"
              size="lg"
              onPress={onNewTransaction}
              style={{ flex: 1 }}
            />
          </View>
        </View>

        {/* ── Right: Receipt preview ── */}
        <ScrollView style={styles.rightPanel} showsVerticalScrollIndicator={false}>
          <View style={styles.receipt}>
            {/* Store header */}
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptStoreName}>{user?.storeName?.toUpperCase() ?? 'TOKO'}</Text>
              <Text style={styles.receiptStoreAddress}>Jl. Contoh No. 1, Kota</Text>
              <Text style={styles.receiptStorePhone}>Telp: (021) 123-4567</Text>
            </View>

            <View style={styles.receiptDividerDot} />

            {/* Transaction info */}
            <View style={styles.receiptSection}>
              <ReceiptRow label="No. Transaksi" value={tx.id.slice(-12)} />
              <ReceiptRow label="Tanggal" value={formatDate(tx.createdAt)} />
              <ReceiptRow label="Kasir" value={tx.cashierName} />
              <ReceiptRow label="Terminal" value={tx.terminalId} />
            </View>

            <View style={styles.receiptDividerDot} />

            {/* Items */}
            <View style={styles.receiptSection}>
              {tx.items.map((item, i) => (
                <View key={i} style={styles.receiptItem}>
                  <Text style={styles.receiptItemName}>{item.productName}</Text>
                  <View style={styles.receiptItemRow}>
                    <Text style={styles.receiptItemQty}>
                      {item.quantity} × {formatRp(item.price)}
                    </Text>
                    <Text style={styles.receiptItemSubtotal}>{formatRp(item.subtotal)}</Text>
                  </View>
                  {item.discount > 0 && (
                    <Text style={styles.receiptItemDiscount}>
                      Disc: -{item.discountType === 'percentage'
                        ? `${item.discount}%`
                        : formatRp(item.discount)
                      }
                    </Text>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.receiptDividerLine} />

            {/* Totals */}
            <View style={styles.receiptSection}>
              <ReceiptRow label="Subtotal" value={formatRp(tx.subtotal)} />
              {tx.discountTotal > 0 && (
                <ReceiptRow label="Diskon" value={`-${formatRp(tx.discountTotal)}`} />
              )}
              <View style={styles.receiptTotalRow}>
                <Text style={styles.receiptTotalLabel}>TOTAL</Text>
                <Text style={styles.receiptTotalValue}>{formatRp(tx.total)}</Text>
              </View>
            </View>

            <View style={styles.receiptDividerLine} />

            {/* Payments */}
            <View style={styles.receiptSection}>
              {tx.payments.map((p, i) => (
                <ReceiptRow
                  key={i}
                  label={payLabel[p.method] ?? p.method}
                  value={formatRp(p.amount)}
                />
              ))}
              {tx.change > 0 && (
                <ReceiptRow label="Kembalian" value={formatRp(tx.change)} />
              )}
            </View>

            {/* Member */}
            {tx.customerName && (
              <>
                <View style={styles.receiptDividerDot} />
                <View style={styles.receiptSection}>
                  <ReceiptRow label="Member" value={tx.customerName} />
                </View>
              </>
            )}

            <View style={styles.receiptDividerDot} />

            {/* Footer */}
            <View style={styles.receiptFooter}>
              <Text style={styles.receiptThanks}>Terima Kasih</Text>
              <Text style={styles.receiptThanksSubtitle}>Atas kunjungan Anda</Text>
              <Text style={styles.receiptBarcode}>||||| || ||||||| ||| || |||||</Text>
              <Text style={styles.receiptBarcodeText}>{tx.id.slice(-10)}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const ReceiptRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={receiptRowStyles.row}>
    <Text style={receiptRowStyles.label}>{label}</Text>
    <Text style={receiptRowStyles.value}>{value}</Text>
  </View>
);

const receiptRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  label: { fontSize: 11, color: Colors.gray600 },
  value: { fontSize: 11, color: Colors.gray800, fontWeight: FontWeight.medium, textAlign: 'right', flex: 1, marginLeft: Spacing.sm },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  errorText: { fontSize: FontSize.body, color: Colors.danger },
  body: { flex: 1, flexDirection: 'row' },

  // ── Left ──
  leftPanel: {
    flex: 1,
    backgroundColor: Colors.sky900,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    gap: Spacing.xl,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
  successCheck: { fontSize: 40, color: Colors.white, fontWeight: FontWeight.bold, lineHeight: 48 },
  successTitle: { fontSize: FontSize.h2, fontWeight: FontWeight.bold, color: Colors.white, textAlign: 'center' },
  successSubtitle: { fontSize: FontSize.body, color: Colors.sky300, textAlign: 'center' },
  summaryBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  summaryLabel: { fontSize: FontSize.caption, color: Colors.sky300, textTransform: 'uppercase', letterSpacing: 1 },
  summaryAmount: { fontSize: 44, fontWeight: FontWeight.bold, color: Colors.white, marginTop: 4 },
  changeLabel: { fontSize: FontSize.caption, color: Colors.sky400, marginTop: Spacing.md, textTransform: 'uppercase' },
  changeAmount: { fontSize: FontSize.h3, fontWeight: FontWeight.bold, color: Colors.sky200 },
  txIdBox: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    width: '100%',
    alignItems: 'center',
  },
  txIdLabel: { fontSize: 10, color: Colors.sky400, textTransform: 'uppercase', letterSpacing: 0.8 },
  txIdValue: { fontSize: 11, color: Colors.sky200, fontFamily: 'monospace', marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: Spacing.md, width: '100%' },

  // ── Right — Receipt ──
  rightPanel: {
    width: 320,
    backgroundColor: Colors.gray100,
  },
  receipt: {
    margin: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    ...Shadow.md,
  },
  receiptHeader: { alignItems: 'center', marginBottom: Spacing.md },
  receiptStoreName: { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.textPrimary, letterSpacing: 1 },
  receiptStoreAddress: { fontSize: 11, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },
  receiptStorePhone: { fontSize: 11, color: Colors.textSecondary },
  receiptDividerDot: { borderTopWidth: 1, borderTopColor: Colors.gray300, borderStyle: 'dashed', marginVertical: Spacing.md },
  receiptDividerLine: { borderTopWidth: 1, borderTopColor: Colors.gray300, marginVertical: Spacing.md },
  receiptSection: { marginBottom: 4 },
  receiptItem: { marginBottom: Spacing.sm },
  receiptItemName: { fontSize: 12, fontWeight: FontWeight.semiBold, color: Colors.textPrimary },
  receiptItemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  receiptItemQty: { fontSize: 11, color: Colors.textSecondary },
  receiptItemSubtotal: { fontSize: 11, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  receiptItemDiscount: { fontSize: 10, color: Colors.success },
  receiptTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  receiptTotalLabel: { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  receiptTotalValue: { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  receiptFooter: { alignItems: 'center', marginTop: Spacing.md },
  receiptThanks: { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  receiptThanksSubtitle: { fontSize: 11, color: Colors.textSecondary, marginBottom: Spacing.md },
  receiptBarcode: { fontSize: 18, letterSpacing: 2, color: Colors.textPrimary },
  receiptBarcodeText: { fontSize: 10, color: Colors.textSecondary, fontFamily: 'monospace', marginTop: 2 },
});
