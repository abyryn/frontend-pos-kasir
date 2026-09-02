import React, { useState, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList,
  TouchableOpacity, ScrollView, SafeAreaView, Alert,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '../theme';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { MOCK_PRODUCTS } from '../data/mockData';
import { Product } from '../types';
import { Button, Badge, Toast, useToast, POSStatusBar } from '../components/ui';
import { ProductCard } from '../components/pos/ProductCard';
import { CartItemRow } from '../components/pos/CartItem';
import { DiscountModal } from '../components/pos/DiscountModal';

interface Props {
  onPayPress: () => void;
  onHoldPress: () => void;
  onMenuPress: (screen: string) => void;
}

const formatRp = (v: number) => `Rp ${v.toLocaleString('id-ID')}`;

const CATEGORIES = ['Semua', 'Mie Instan', 'Air Minum', 'Roti', 'Minuman', 'Snack', 'Kopi', 'Kebersihan', 'Daging'];

export const SalesScreen: React.FC<Props> = ({ onPayPress, onHoldPress, onMenuPress }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [showDiscount, setShowDiscount] = useState(false);
  const searchRef = useRef<TextInput>(null);

  const { toast, show, hide } = useToast();
  const { user, shift, hasPermission } = useAuthStore();
  const {
    items, customer,
    subtotal, discountAmount, total,
    addProduct, removeItem, updateQuantity, applyItemDiscount,
    applyCartDiscount, clearCart, holdTransaction,
    discount, discountType,
  } = useCartStore();

  // Filtered products
  const filteredProducts = useMemo(() => {
    let list = MOCK_PRODUCTS;
    if (activeCategory !== 'Semua') {
      list = list.filter((p) => p.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.barcode.includes(q)
      );
    }
    return list;
  }, [search, activeCategory]);

  const handleProductPress = (product: Product) => {
    addProduct(product);
    show(`${product.name} ditambahkan`, 'success');
  };

  const handleBarcodeSubmit = () => {
    const q = search.trim();
    if (!q) return;
    const found = MOCK_PRODUCTS.find(
      (p) => p.barcode === q || p.sku.toLowerCase() === q.toLowerCase()
    );
    if (found) {
      handleProductPress(found);
      setSearch('');
      searchRef.current?.focus();
    } else {
      show(`Produk dengan barcode "${q}" tidak ditemukan.`, 'error');
    }
  };

  const handleHold = () => {
    if (!items.length) { show('Keranjang kosong.', 'warning'); return; }
    holdTransaction();
    show('Transaksi di-hold.', 'info');
    onHoldPress();
  };

  const handleClearCart = () => {
    if (!items.length) return;
    Alert.alert('Hapus Keranjang', 'Yakin ingin menghapus semua item?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: clearCart },
    ]);
  };

  const cartTotal = total();
  const cartSubtotal = subtotal();
  const cartDiscount = discountAmount();
  const cartCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <POSStatusBar />
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hide} />
      <DiscountModal
        visible={showDiscount}
        onClose={() => setShowDiscount(false)}
        onApply={(val, type) => applyCartDiscount(val, type)}
        currentDiscount={discount}
        currentType={discountType}
      />

      <View style={styles.body}>
        {/* ── LEFT: Product Area ── */}
        <View style={styles.leftPanel}>

          {/* Search bar */}
          <View style={styles.searchRow}>
            <View style={styles.searchWrap}>
              <Text style={styles.searchIcon}>•</Text>
              <TextInput
                ref={searchRef}
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={handleBarcodeSubmit}
                placeholder="Scan barcode / cari nama produk / SKU..."
                placeholderTextColor={Colors.textMuted}
                returnKeyType="search"
                autoFocus
                autoCorrect={false}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={6}>
                  <Text style={styles.clearSearch}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Action shortcuts */}
            <TouchableOpacity style={styles.shortcutBtn} onPress={() => onMenuPress('member')}>
              <Text style={styles.shortcutLabel}>Member</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shortcutBtn} onPress={() => onMenuPress('recall')}>
              <Text style={styles.shortcutLabel}>Recall</Text>
            </TouchableOpacity>
          </View>

          {/* Category filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryBar}
            contentContainerStyle={styles.categoryContent}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.catChipText, activeCategory === cat && styles.catChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Product grid */}
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Produk tidak ditemukan</Text>
              <Text style={styles.emptyDesc}>
                {search ? `Tidak ada produk untuk "${search}"` : 'Tidak ada produk di kategori ini.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id}
              numColumns={4}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.gridContent}
              renderItem={({ item }) => (
                <View style={styles.gridItem}>
                  <ProductCard product={item} onPress={handleProductPress} />
                </View>
              )}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* ── RIGHT: Cart Panel ── */}
        <View style={styles.rightPanel}>
          {/* Cart header */}
          <View style={styles.cartHeader}>
            <View style={styles.cartTitleRow}>
              <Text style={styles.cartTitle}>Keranjang</Text>
              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </View>
            {items.length > 0 && (
              <TouchableOpacity onPress={handleClearCart}>
                <Text style={styles.clearCartText}>Hapus Semua</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Customer info */}
          {customer && (
            <View style={styles.customerBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.customerName}>{customer.name}</Text>
                <Text style={styles.customerLevel}>{customer.memberLevel} • {customer.point} poin</Text>
              </View>
              <TouchableOpacity onPress={() => setCustomer(null)}>
                <Text style={styles.removeCustomer}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Cart items */}
          <ScrollView style={styles.cartItems} showsVerticalScrollIndicator={false}>
            {items.length === 0 ? (
              <View style={styles.cartEmpty}>
                <Text style={styles.cartEmptyText}>Keranjang kosong</Text>
                <Text style={styles.cartEmptySubText}>Scan produk atau pilih dari daftar produk</Text>
              </View>
            ) : (
              items.map((item) => (
                <CartItemRow
                  key={item.productId}
                  item={item}
                  onIncrease={() => updateQuantity(item.productId, item.quantity + 1)}
                  onDecrease={() => updateQuantity(item.productId, item.quantity - 1)}
                  onRemove={() => removeItem(item.productId)}
                  onQtyEdit={(qty) => updateQuantity(item.productId, qty)}
                />
              ))
            )}
          </ScrollView>

          {/* Cart totals */}
          <View style={styles.totalsPanel}>
            <View style={styles.totalRow}>
              <Text style={styles.totalKey}>Subtotal</Text>
              <Text style={styles.totalVal}>{formatRp(cartSubtotal)}</Text>
            </View>

            {cartDiscount > 0 && (
              <View style={styles.totalRow}>
                <TouchableOpacity onPress={() => setShowDiscount(true)}>
                  <Text style={[styles.totalKey, { color: Colors.success }]}>
                    Diskon {discountType === 'percentage' ? `(${discount}%)` : ''} [Ubah]
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.totalVal, { color: Colors.success }]}>
                  -{formatRp(cartDiscount)}
                </Text>
              </View>
            )}

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.grandTotalKey}>TOTAL</Text>
              <Text style={styles.grandTotalVal}>{formatRp(cartTotal)}</Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionBtns}>
            <TouchableOpacity
              style={styles.actionSecBtn}
              onPress={() => setShowDiscount(true)}
              disabled={items.length === 0}
            >
              <Text style={styles.actionSecLabel}>Diskon</Text>
            </TouchableOpacity>

            {hasPermission('pos.void') && (
              <TouchableOpacity
                style={styles.actionSecBtn}
                onPress={() => onMenuPress('void')}
              >
                <Text style={styles.actionSecLabel}>Void</Text>
              </TouchableOpacity>
            )}

            {hasPermission('pos.refund') && (
              <TouchableOpacity
                style={styles.actionSecBtn}
                onPress={() => onMenuPress('return')}
              >
                <Text style={styles.actionSecLabel}>Retur</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionSecBtn}
              onPress={handleHold}
            >
              <Text style={styles.actionSecLabel}>Hold</Text>
            </TouchableOpacity>
          </View>

          {/* Pay button */}
          <TouchableOpacity
            style={[styles.payBtn, items.length === 0 && styles.payBtnDisabled]}
            onPress={onPayPress}
            disabled={items.length === 0}
            activeOpacity={0.85}
          >
            <Text style={styles.payBtnLabel}>BAYAR</Text>
            <Text style={styles.payBtnAmount}>{formatRp(cartTotal)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Bottom shortcut bar ── */}
      <View style={styles.bottomBar}>
        {[
          { key: 'payment', label: 'F1  Bayar', active: false, onPress: onPayPress },
          { key: 'discount', label: 'F2  Diskon', active: false, onPress: () => setShowDiscount(true) },
          { key: 'void', label: 'F3  Void', active: false, onPress: () => onMenuPress('void') },
          { key: 'return', label: 'F4  Retur', active: false, onPress: () => onMenuPress('return') },
          { key: 'hold', label: 'F8  Hold', active: false, onPress: handleHold },
          { key: 'history', label: 'F9  History', active: false, onPress: () => onMenuPress('history') },
          { key: 'shift', label: 'F10 Shift', active: false, onPress: () => onMenuPress('shift') },
        ].map((btn) => (
          <TouchableOpacity
            key={btn.key}
            style={styles.bottomBtn}
            onPress={btn.onPress}
          >
            <Text style={styles.bottomBtnText}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  body: {
    flex: 1,
    flexDirection: 'row',
  },

  // ── Left Panel ──
  leftPanel: {
    flex: 1.4,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    backgroundColor: Colors.background,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    backgroundColor: Colors.gray50,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    height: '100%',
  },
  clearSearch: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    padding: 4,
  },
  shortcutBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    height: 42,
    backgroundColor: Colors.sky50,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.sky200,
    gap: 2,
  },
  shortcutEmoji: { fontSize: 16 },
  shortcutLabel: { fontSize: 9, color: Colors.primary, fontWeight: FontWeight.semiBold },

  categoryBar: { maxHeight: 46 },
  categoryContent: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  catChip: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catChipText: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.medium,
    color: Colors.textSecondary,
  },
  catChipTextActive: { color: Colors.white },

  gridContent: { padding: Spacing.md, gap: Spacing.md },
  gridRow: { gap: Spacing.md },
  gridItem: { flex: 1 },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.h4, fontWeight: FontWeight.semiBold, color: Colors.textPrimary, marginBottom: 4 },
  emptyDesc: { fontSize: FontSize.body, color: Colors.textSecondary, textAlign: 'center' },

  // ── Right Panel ──
  rightPanel: {
    width: 340,
    backgroundColor: Colors.white,
    flexDirection: 'column',
  },
  cartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cartTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cartTitle: { fontSize: FontSize.h4, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  cartBadge: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  cartBadgeText: { color: Colors.white, fontSize: FontSize.caption, fontWeight: FontWeight.bold },
  clearCartText: { fontSize: FontSize.caption, color: Colors.danger, fontWeight: FontWeight.medium },

  customerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.sky50,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.sky200,
  },
  customerEmoji: { fontSize: 18 },
  customerName: { fontSize: FontSize.bodySmall, fontWeight: FontWeight.semiBold, color: Colors.sky800 },
  customerLevel: { fontSize: FontSize.caption, color: Colors.primary },
  removeCustomer: { fontSize: FontSize.caption, color: Colors.textMuted, padding: 4 },

  cartItems: { flex: 1, paddingHorizontal: Spacing.md },

  cartEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  cartEmptyEmoji: { fontSize: 40, marginBottom: Spacing.md },
  cartEmptyText: { fontSize: FontSize.body, fontWeight: FontWeight.semiBold, color: Colors.textSecondary },
  cartEmptySubText: { fontSize: FontSize.caption, color: Colors.textMuted, marginTop: 4 },

  // ── Totals ──
  totalsPanel: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 6,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalKey: { fontSize: FontSize.body, color: Colors.textSecondary },
  totalVal: { fontSize: FontSize.body, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
  grandTotalKey: { fontSize: FontSize.h4, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  grandTotalVal: { fontSize: FontSize.h3, fontWeight: FontWeight.bold, color: Colors.posTotalDark },

  // ── Action buttons row ──
  actionBtns: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionSecBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    gap: 2,
  },
  actionSecIcon: { fontSize: 16 },
  actionSecLabel: { fontSize: 9, color: Colors.textSecondary, fontWeight: FontWeight.medium },

  // ── Pay button ──
  payBtn: {
    margin: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    ...Shadow.md,
  },
  payBtnDisabled: { backgroundColor: Colors.gray300 },
  payBtnLabel: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: 2,
    opacity: 0.85,
  },
  payBtnAmount: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },

  // ── Bottom shortcut bar ──
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: Colors.gray800,
    height: 36,
  },
  bottomBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.gray700,
  },
  bottomBtnText: {
    fontSize: 11,
    color: Colors.gray300,
    fontWeight: FontWeight.medium,
    fontFamily: 'monospace',
  },
});
