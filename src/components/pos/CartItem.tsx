import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../../theme';
import { CartItem as CartItemType } from '../../types';

interface CartItemProps {
  item: CartItemType;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
  onQtyEdit: (qty: number) => void;
  onDiscountPress?: () => void;
}

const formatPrice = (val: number) => `Rp ${val.toLocaleString('id-ID')}`;

export const CartItemRow: React.FC<CartItemProps> = ({
  item, onIncrease, onDecrease, onRemove, onQtyEdit, onDiscountPress,
}) => {
  const [editingQty, setEditingQty] = useState(false);
  const [qtyInput, setQtyInput] = useState(item.quantity.toString());

  const commitQty = () => {
    const val = parseInt(qtyInput, 10);
    if (!isNaN(val) && val > 0) onQtyEdit(val);
    else setQtyInput(item.quantity.toString());
    setEditingQty(false);
  };

  return (
    <View style={styles.row}>
      {/* Remove */}
      <TouchableOpacity style={styles.removeBtn} onPress={onRemove} hitSlop={6}>
        <Text style={styles.removeIcon}>✕</Text>
      </TouchableOpacity>

      {/* Product info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.productName}</Text>
        <Text style={styles.sku}>{item.sku}</Text>
        {item.discount > 0 && (
          <Text style={styles.discountLabel}>
            Diskon: {item.discountType === 'percentage' ? `${item.discount}%` : formatPrice(item.discount)}
            {item.promotionApplied && ` (${item.promotionApplied})`}
          </Text>
        )}
      </View>

      {/* Qty controls */}
      <View style={styles.qtyControl}>
        <TouchableOpacity style={styles.qtyBtn} onPress={onDecrease}>
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>

        {editingQty ? (
          <TextInput
            style={styles.qtyInput}
            value={qtyInput}
            onChangeText={setQtyInput}
            onBlur={commitQty}
            onSubmitEditing={commitQty}
            keyboardType="numeric"
            autoFocus
            selectTextOnFocus
          />
        ) : (
          <TouchableOpacity onPress={() => { setQtyInput(item.quantity.toString()); setEditingQty(true); }}>
            <Text style={styles.qtyText}>{item.quantity}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.qtyBtn} onPress={onIncrease}>
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Subtotal */}
      <View style={styles.subtotalWrap}>
        <Text style={styles.subtotal}>{formatPrice(item.subtotal)}</Text>
        {item.discount > 0 && (
          <Text style={styles.originalPrice}>
            {formatPrice(item.price * item.quantity)}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
    gap: Spacing.sm,
  },
  removeBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeIcon: {
    fontSize: 10,
    color: Colors.danger,
    fontWeight: FontWeight.bold,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  sku: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
  },
  discountLabel: {
    fontSize: FontSize.caption,
    color: Colors.success,
    fontWeight: FontWeight.medium,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
    backgroundColor: Colors.sky100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    lineHeight: 18,
  },
  qtyText: {
    width: 32,
    textAlign: 'center',
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  qtyInput: {
    width: 32,
    textAlign: 'center',
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary,
    padding: 0,
  },
  subtotalWrap: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  subtotal: {
    fontSize: FontSize.bodySmall,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  originalPrice: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
});
