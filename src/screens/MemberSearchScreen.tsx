import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, SafeAreaView,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '../theme';
import { MOCK_CUSTOMERS } from '../data/mockData';
import { useCartStore } from '../store/useCartStore';
import { Customer } from '../types';
import { Badge, Button, POSStatusBar } from '../components/ui';

interface Props {
  onBack: () => void;
  onMemberSelected: () => void;
}

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  PLATINUM: { bg: '#F5F0FF', text: '#7C3AED' },
  GOLD:     { bg: '#FFFBEB', text: '#D97706' },
  SILVER:   { bg: Colors.gray100, text: Colors.gray600 },
  BRONZE:   { bg: '#FFF7ED', text: '#C2410C' },
};

const LEVEL_ICONS: Record<string, string> = {
  PLATINUM: '💎', GOLD: '🥇', SILVER: '🥈', BRONZE: '🥉',
};

export const MemberSearchScreen: React.FC<Props> = ({ onBack, onMemberSelected }) => {
  const [search, setSearch] = useState('');
  const { setCustomer, customer: activeCustomer } = useCartStore();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MOCK_CUSTOMERS;
    return MOCK_CUSTOMERS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  }, [search]);

  const handleSelect = (customer: Customer) => {
    setCustomer(customer);
    onMemberSelected();
  };

  const handleRemove = () => {
    setCustomer(null);
    onBack();
  };

  const renderMember = ({ item }: { item: Customer }) => {
    const isActive = activeCustomer?.id === item.id;
    const lc = LEVEL_COLORS[item.memberLevel] ?? LEVEL_COLORS.BRONZE;

    return (
      <TouchableOpacity
        style={[styles.memberCard, isActive && styles.memberCardActive]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.75}
      >
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: lc.bg }]}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>

        {/* Info */}
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberName}>{item.name}</Text>
            <View style={[styles.levelBadge, { backgroundColor: lc.bg }]}>
              <Text style={{ fontSize: 12 }}>{LEVEL_ICONS[item.memberLevel]}</Text>
              <Text style={[styles.levelText, { color: lc.text }]}>{item.memberLevel}</Text>
            </View>
          </View>
          <Text style={styles.memberPhone}>📱 {item.phone}</Text>
          <View style={styles.memberStats}>
            <View style={styles.statChip}>
              <Text style={styles.statValue}>{item.point.toLocaleString('id-ID')}</Text>
              <Text style={styles.statLabel}>Poin</Text>
            </View>
            {item.vouchers.length > 0 && (
              <View style={[styles.statChip, { backgroundColor: Colors.successBg }]}>
                <Text style={[styles.statValue, { color: Colors.success }]}>{item.vouchers.length}</Text>
                <Text style={[styles.statLabel, { color: Colors.success }]}>Voucher</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action */}
        <View style={styles.memberAction}>
          {isActive ? (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>✓ Aktif</Text>
            </View>
          ) : (
            <View style={styles.selectBtn}>
              <Text style={styles.selectBtnText}>Pilih</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <POSStatusBar />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Cari Member</Text>
          <Text style={styles.subtitle}>{MOCK_CUSTOMERS.length} member terdaftar</Text>
        </View>
        {activeCustomer && (
          <TouchableOpacity style={styles.removeBtn} onPress={handleRemove}>
            <Text style={styles.removeBtnText}>Hapus Member</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Active member banner */}
      {activeCustomer && (
        <View style={styles.activeBanner}>
          <Text style={styles.activeBannerIcon}>👤</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.activeBannerName}>{activeCustomer.name}</Text>
            <Text style={styles.activeBannerInfo}>
              {activeCustomer.memberLevel} • {activeCustomer.point} poin
              {activeCustomer.vouchers.length > 0 && ` • ${activeCustomer.vouchers.length} voucher aktif`}
            </Text>
          </View>
          <Badge label="Member Aktif" variant="success" />
        </View>
      )}

      {/* Search */}
      <View style={styles.searchBar}>
        <View style={styles.searchWrap}>
          <Text>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Cari nama, nomor HP, atau ID member..."
            placeholderTextColor={Colors.textMuted}
            autoFocus
          />
        </View>
      </View>

      {/* Results */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>👤</Text>
          <Text style={styles.emptyTitle}>Member tidak ditemukan</Text>
          <Text style={styles.emptyDesc}>Coba dengan nama atau nomor HP yang berbeda.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderMember}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}

      {/* Voucher detail for active member */}
      {activeCustomer && activeCustomer.vouchers.length > 0 && (
        <View style={styles.voucherPanel}>
          <Text style={styles.voucherTitle}>🎟 Voucher Tersedia</Text>
          {activeCustomer.vouchers.map((v) => (
            <View key={v.id} style={styles.voucherRow}>
              <View>
                <Text style={styles.voucherCode}>{v.code}</Text>
                <Text style={styles.voucherExp}>Berlaku s/d {v.expiryDate}</Text>
              </View>
              <Text style={styles.voucherValue}>
                {v.type === 'percentage' ? `${v.value}%` : `Rp ${v.value.toLocaleString('id-ID')}`}
              </Text>
            </View>
          ))}
        </View>
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
  subtitle: { fontSize: FontSize.caption, color: Colors.textMuted, marginTop: 1 },
  removeBtn: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.danger + '50', backgroundColor: Colors.dangerBg },
  removeBtnText: { fontSize: FontSize.caption, color: Colors.danger, fontWeight: FontWeight.medium },
  activeBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md, backgroundColor: Colors.sky50, borderBottomWidth: 1, borderBottomColor: Colors.sky200 },
  activeBannerIcon: { fontSize: 24 },
  activeBannerName: { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.sky800 },
  activeBannerInfo: { fontSize: FontSize.caption, color: Colors.primary },
  searchBar: { backgroundColor: Colors.white, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchWrap: { flexDirection: 'row', alignItems: 'center', height: 42, backgroundColor: Colors.gray50, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, gap: Spacing.sm },
  searchInput: { flex: 1, fontSize: FontSize.body, color: Colors.textPrimary },
  listContent: { padding: Spacing.lg, paddingBottom: 100 },
  columnWrapper: { gap: Spacing.lg },
  memberCard: { flex: 1, backgroundColor: Colors.white, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, marginBottom: Spacing.lg, flexDirection: 'row', gap: Spacing.md, ...Shadow.sm },
  memberCardActive: { borderColor: Colors.primary, backgroundColor: Colors.sky50 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: FontSize.h3, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  memberInfo: { flex: 1 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4, flexWrap: 'wrap' },
  memberName: { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  levelBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 2, paddingHorizontal: 6, borderRadius: Radius.full },
  levelText: { fontSize: 10, fontWeight: FontWeight.bold },
  memberPhone: { fontSize: FontSize.caption, color: Colors.textSecondary, marginBottom: Spacing.sm },
  memberStats: { flexDirection: 'row', gap: Spacing.sm },
  statChip: { backgroundColor: Colors.gray50, borderRadius: Radius.sm, paddingVertical: 4, paddingHorizontal: Spacing.sm, alignItems: 'center' },
  statValue: { fontSize: FontSize.bodySmall, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  statLabel: { fontSize: 10, color: Colors.textMuted },
  memberAction: { justifyContent: 'center' },
  activeBadge: { backgroundColor: Colors.successBg, paddingVertical: 4, paddingHorizontal: Spacing.sm, borderRadius: Radius.full },
  activeBadgeText: { fontSize: FontSize.caption, color: Colors.success, fontWeight: FontWeight.bold },
  selectBtn: { backgroundColor: Colors.sky100, paddingVertical: 4, paddingHorizontal: Spacing.md, borderRadius: Radius.full },
  selectBtnText: { fontSize: FontSize.caption, color: Colors.primary, fontWeight: FontWeight.semiBold },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 48 },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.h4, fontWeight: FontWeight.semiBold, color: Colors.textPrimary, marginBottom: 4 },
  emptyDesc: { fontSize: FontSize.body, color: Colors.textSecondary },
  voucherPanel: { backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border, padding: Spacing.lg },
  voucherTitle: { fontSize: FontSize.body, fontWeight: FontWeight.semiBold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  voucherRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  voucherCode: { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.primary, fontFamily: 'monospace' },
  voucherExp: { fontSize: FontSize.caption, color: Colors.textMuted },
  voucherValue: { fontSize: FontSize.h4, fontWeight: FontWeight.bold, color: Colors.success },
});
