import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '../../theme';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
}

const formatPrice = (val: number) =>
  `Rp ${val.toLocaleString('id-ID')}`;

export const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const isLowStock = product.stock > 0 && product.stock <= 10;
  const isOutOfStock = product.stock === 0;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isOutOfStock && styles.cardDisabled,
      ]}
      onPress={() => !isOutOfStock && onPress(product)}
      activeOpacity={0.75}
      disabled={isOutOfStock}
    >
      {/* Promo ribbon */}
      {product.hasPromotion && !isOutOfStock && (
        <View style={styles.promoRibbon}>
          <Text style={styles.promoText}>PROMO</Text>
        </View>
      )}

      {/* Product icon placeholder */}
      <View style={[styles.imgBox, isOutOfStock && { opacity: 0.4 }]}>
        <Text style={styles.imgEmoji}>
          {getCategoryEmoji(product.category)}
        </Text>
      </View>

      {/* Info */}
      <Text style={[styles.name, isOutOfStock && { color: Colors.textMuted }]} numberOfLines={2}>
        {product.name}
      </Text>

      <Text style={styles.price}>{formatPrice(product.sellingPrice)}</Text>

      {/* Stock */}
      <View style={styles.stockRow}>
        <View style={[
          styles.stockDot,
          {
            backgroundColor: isOutOfStock
              ? Colors.danger
              : isLowStock
                ? Colors.warning
                : Colors.success,
          },
        ]} />
        <Text style={[
          styles.stockText,
          isOutOfStock && { color: Colors.dangerText },
          isLowStock && { color: Colors.warningText },
        ]}>
          {isOutOfStock ? 'Habis' : `Stok: ${product.stock}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    'Mie Instan': '🍜',
    'Air Minum': '💧',
    'Roti': '🍞',
    'Minuman': '🥤',
    'Snack': '🍿',
    'Kopi': '☕',
    'Kebersihan': '🧼',
    'Daging': '🥩',
  };
  return map[category] ?? '📦';
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadow.sm,
    overflow: 'hidden',
  },
  cardDisabled: {
    backgroundColor: Colors.gray50,
    borderColor: Colors.gray200,
  },
  promoRibbon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.warning,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
  },
  promoText: {
    fontSize: 9,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  imgBox: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.sky50,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  imgEmoji: {
    fontSize: 32,
  },
  name: {
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: 4,
    lineHeight: 18,
  },
  price: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    marginBottom: 4,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockText: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
  },
});
