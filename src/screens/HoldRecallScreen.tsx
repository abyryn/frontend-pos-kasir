import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, SafeAreaView,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '../theme';
import { useCartStore } from '../store/useCartStore';
import { Button, POSStatusBar } from '../components/ui';
import { HoldTransaction } from '../types';

interface Props {
  onBack: () => void;
  onRecall: () => void;
}

const formatRp = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;
const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

export const HoldRecallScreen: React.FC<Props> = ({ onBack, onRecall }) => {
  const { holdTransactions, recallTransaction, removeHold, items } = useCartStore();

  const hasActiveCart = items.length > 0;

  const handleRecall = (holdId: string) => {
    if (hasActiveCart) {
      // In production, would show confirmation alert
    }
    recallTransaction(holdId);
    onRecall();
  };

  const renderHold = ({ item, index }: { item: HoldTransaction; index: number }) => {
    const holdTotal = item.items.reduce((sum, i) => sum + i.subtotal, 0);
    const itemCount = item.items.reduce((sum, i) => sum + i.quantity, 0);

    return (
      <View style={styles.holdCard}>
        {/* Hold number badge */}
        <View style={styles.holdBadge}>
          <Text style={styles.holdBadgeText}>#{String(index + 1).padStart(3, '0')}</Text>
        </View>

        {/* Info */}
        <View style={styles.holdInfo}>
          <Text style={styles.holdLabel}>{item.label}</Text>
          <Text style={styles.holdTime}>{formatTime(item.createdAt)}</Text>

          {/* Item preview */}
          <View style={styles.holdItems}>
            {item.items.slice(0, 3).map((ci, i) => (
              <Text key={i} style={styles.holdItemText} numberOfLines={1}>
                • {ci.productName} × {ci.quantity}
              </Text>
            ))}
            {item.items.length > 3 && (
              <Text style={styles.holdItemMore}>+{item.items.length - 3} item lainnya</Text>
            )}
          </View>

          {item.customer && (
            <View style={styles.holdCustomer}>
              <Text style={styles.holdCustomerText}>Member: {item.customer.name}</Text>
            </View>
          )}
        </View>

        {/* Total & actions */}
        <View style={styles.holdActions}>
          <View style={styles.holdTotals}>
            <Text style={styles.holdItemCount}>{itemCount} item</Text>
            <Text style={styles.holdTotal}>{formatRp(holdTotal)}</Text>
          </View>
          <View style={styles.holdBtns}>
            <Button
              label="Lanjutkan"
              variant="primary"
              size="sm"
              onPress={() => handleRecall(item.id)}
            />
            <Button
              label="Hapus"
              variant="danger"
              size="sm"
              onPress={() => removeHold(item.id)}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <POSStatusBar />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Hold / Recall Transaksi</Text>
          <Text style={styles.subtitle}>{holdTransactions.length} transaksi ditunda</Text>
        </View>
      </View>

      {holdTransactions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Tidak ada transaksi yang di-hold</Text>
          <Text style={styles.emptyDesc}>
            Gunakan tombol Hold di layar utama untuk menunda transaksi yang sedang berjalan.
          </Text>
          <Button label="Kembali ke Kasir" variant="primary" size="md" onPress={onBack} style={{ marginTop: Spacing.xl }} />
        </View>
      ) : (
        <FlatList
          data={holdTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderHold}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}

      {/* Bottom info */}
      {hasActiveCart && holdTransactions.length > 0 && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            Perhatian: Anda memiliki keranjang aktif. Memanggil transaksi hold akan menggantikan keranjang saat ini.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

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
  title: { fontSize: FontSize.h4, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.caption, color: Colors.textMuted, marginTop: 1 },
  listContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  columnWrapper: { gap: Spacing.lg },
  holdCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  holdBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.sky100,
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
  },
  holdBadgeText: { fontSize: FontSize.caption, fontWeight: FontWeight.bold, color: Colors.primary },
  holdInfo: { flex: 1, marginBottom: Spacing.md },
  holdLabel: { fontSize: FontSize.h4, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 2 },
  holdTime: { fontSize: FontSize.caption, color: Colors.textMuted, marginBottom: Spacing.sm },
  holdItems: { gap: 2, marginBottom: Spacing.sm },
  holdItemText: { fontSize: FontSize.caption, color: Colors.textSecondary },
  holdItemMore: { fontSize: FontSize.caption, color: Colors.textMuted, fontStyle: 'italic' },
  holdCustomer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.sky50,
    borderRadius: Radius.sm,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    alignSelf: 'flex-start',
  },
  holdCustomerText: { fontSize: FontSize.caption, color: Colors.primary, fontWeight: FontWeight.medium },
  holdActions: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray100,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  holdTotals: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  holdItemCount: { fontSize: FontSize.caption, color: Colors.textMuted },
  holdTotal: { fontSize: FontSize.h4, fontWeight: FontWeight.bold, color: Colors.posTotalDark },
  holdBtns: { flexDirection: 'row', gap: Spacing.sm },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 48 },
  emptyEmoji: { fontSize: 56, marginBottom: Spacing.lg },
  emptyTitle: { fontSize: FontSize.h4, fontWeight: FontWeight.semiBold, color: Colors.textPrimary, marginBottom: 8 },
  emptyDesc: { fontSize: FontSize.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, maxWidth: 360 },
  warningBanner: {
    backgroundColor: Colors.warningBg,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.warning + '40',
  },
  warningText: { fontSize: FontSize.caption, color: Colors.warningText, textAlign: 'center' },
});
