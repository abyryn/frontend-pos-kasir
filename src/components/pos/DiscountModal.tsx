import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Modal, Button } from '../ui';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../../theme';

interface DiscountModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (discount: number, type: 'percentage' | 'nominal') => void;
  currentDiscount?: number;
  currentType?: 'percentage' | 'nominal';
  maxPercentage?: number; // kasir limit
}

export const DiscountModal: React.FC<DiscountModalProps> = ({
  visible, onClose, onApply,
  currentDiscount = 0, currentType = 'percentage',
  maxPercentage = 5,
}) => {
  const [type, setType] = useState<'percentage' | 'nominal'>(currentType);
  const [value, setValue] = useState(currentDiscount.toString());
  const [error, setError] = useState('');

  const handleApply = () => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) { setError('Masukkan nilai yang valid.'); return; }
    if (type === 'percentage' && num > maxPercentage) {
      setError(`Diskon kasir maksimal ${maxPercentage}%. Butuh approval manager.`);
      return;
    }
    setError('');
    onApply(num, type);
    onClose();
  };

  const QUICK_PCTS = [5, 10, 15, 20];
  const QUICK_NOMINALS = [5000, 10000, 20000, 50000];

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Tambah Diskon"
      footer={
        <>
          <Button label="Batal" variant="secondary" size="md" onPress={onClose} />
          <Button label="Terapkan" variant="primary" size="md" onPress={handleApply} />
        </>
      }
    >
      {/* Type toggle */}
      <View style={styles.typeToggle}>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'percentage' && styles.typeBtnActive]}
          onPress={() => setType('percentage')}
        >
          <Text style={[styles.typeBtnText, type === 'percentage' && styles.typeBtnTextActive]}>
            Persen (%)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === 'nominal' && styles.typeBtnActive]}
          onPress={() => setType('nominal')}
        >
          <Text style={[styles.typeBtnText, type === 'nominal' && styles.typeBtnTextActive]}>
            Nominal (Rp)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          {type === 'percentage' ? 'Persentase Diskon' : 'Nominal Diskon'}
        </Text>
        <View style={styles.inputRow}>
          <Text style={styles.prefix}>{type === 'percentage' ? '%' : 'Rp'}</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={(t) => { setValue(t); setError(''); }}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={Colors.textMuted}
          />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      {/* Quick pick */}
      <Text style={styles.quickLabel}>Cepat</Text>
      <View style={styles.quickGrid}>
        {(type === 'percentage' ? QUICK_PCTS : QUICK_NOMINALS).map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.quickChip, parseFloat(value) === v && styles.quickChipActive]}
            onPress={() => setValue(v.toString())}
          >
            <Text style={[styles.quickChipText, parseFloat(value) === v && { color: Colors.white }]}>
              {type === 'percentage' ? `${v}%` : `Rp${(v / 1000).toFixed(0)}K`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {type === 'percentage' && (
        <View style={styles.limitNote}>
          <Text style={styles.limitText}>
            Kasir dapat memberikan diskon hingga {maxPercentage}%. Diskon lebih besar membutuhkan approval manager.
          </Text>
        </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  typeToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    backgroundColor: Colors.gray50,
  },
  typeBtnActive: { backgroundColor: Colors.primary },
  typeBtnText: { fontSize: FontSize.body, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  typeBtnTextActive: { color: Colors.white },
  inputGroup: { marginBottom: Spacing.lg },
  label: { fontSize: FontSize.body, fontWeight: FontWeight.medium, color: Colors.gray700, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    height: 44,
  },
  prefix: {
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
    color: Colors.textSecondary,
    backgroundColor: Colors.gray50,
    height: '100%',
    lineHeight: 44,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.h4,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
  error: { fontSize: FontSize.caption, color: Colors.danger, marginTop: 4 },
  quickLabel: { fontSize: FontSize.caption, fontWeight: FontWeight.semiBold, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: Spacing.sm },
  quickGrid: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginBottom: Spacing.lg },
  quickChip: {
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.gray50,
  },
  quickChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  quickChipText: { fontSize: FontSize.caption, fontWeight: FontWeight.semiBold, color: Colors.textSecondary },
  limitNote: {
    backgroundColor: Colors.warningBg,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  limitText: { fontSize: FontSize.caption, color: Colors.warningText, lineHeight: 18 },
});
