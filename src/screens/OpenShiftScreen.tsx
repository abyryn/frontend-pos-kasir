import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TextInput, ScrollView,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { Button, Toast, useToast } from '../components/ui';

interface Props {
  onShiftOpened: () => void;
}

const formatRupiah = (val: number) =>
  `Rp ${val.toLocaleString('id-ID')}`;

const QUICK_AMOUNTS = [100000, 200000, 500000, 1000000];

export const OpenShiftScreen: React.FC<Props> = ({ onShiftOpened }) => {
  const [openingCash, setOpeningCash] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, openShift } = useAuthStore();
  const { toast, show, hide } = useToast();

  const numericVal = parseInt(openingCash.replace(/\D/g, ''), 10) || 0;

  const handleQuick = (amount: number) => {
    setOpeningCash(amount.toString());
  };

  const handleInput = (text: string) => {
    const clean = text.replace(/\D/g, '');
    setOpeningCash(clean);
  };

  const handleOpen = async () => {
    if (numericVal < 0) { show('Kas awal tidak boleh negatif.', 'error'); return; }
    setLoading(true);
    const result = await openShift(numericVal);
    setLoading(false);
    if (result.success) {
      onShiftOpened();
    } else {
      show(result.error ?? 'Gagal membuka shift.', 'error');
    }
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <SafeAreaView style={styles.safe}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hide} />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>

          {/* Left — Info */}
          <View style={styles.infoPanel}>
            <View style={styles.infoTop}>
              <View style={styles.shiftBadge}>
                <Text style={styles.shiftBadgeText}>BUKA SHIFT</Text>
              </View>
              <Text style={styles.infoDate}>{dateStr}</Text>
              <Text style={styles.infoTime}>{timeStr}</Text>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>Informasi Kasir</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Kasir</Text>
                <Text style={styles.infoVal}>{user?.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Employee ID</Text>
                <Text style={styles.infoVal}>{user?.employeeId}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Toko</Text>
                <Text style={styles.infoVal}>{user?.storeName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Terminal</Text>
                <Text style={styles.infoVal}>{user?.terminalId}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Role</Text>
                <Text style={[styles.infoVal, { color: Colors.primary, fontWeight: FontWeight.semiBold }]}>
                  {user?.role === 'cashier' ? 'Kasir' : 'Manager'}
                </Text>
              </View>
            </View>

            <View style={styles.infoNote}>
              <Text style={styles.infoNoteText}>
                ℹ️  Masukkan jumlah kas awal sebelum memulai shift. Kas awal akan dicatat sebagai saldo awal untuk rekonsiliasi saat closing shift.
              </Text>
            </View>
          </View>

          {/* Right — Form */}
          <View style={styles.formPanel}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Kas Awal Shift</Text>
              <Text style={styles.formSub}>Masukkan jumlah uang tunai di laci kas</Text>

              {/* Amount Display */}
              <View style={styles.amountDisplay}>
                <Text style={styles.amountLabel}>Jumlah</Text>
                <Text style={styles.amountValue}>{formatRupiah(numericVal)}</Text>
              </View>

              {/* Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nominal (Rp)</Text>
                <TextInput
                  style={styles.input}
                  value={openingCash}
                  onChangeText={handleInput}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              {/* Quick Amounts */}
              <Text style={styles.quickLabel}>Nominal Cepat</Text>
              <View style={styles.quickGrid}>
                {QUICK_AMOUNTS.map((amt) => (
                  <Button
                    key={amt}
                    label={formatRupiah(amt)}
                    onPress={() => handleQuick(amt)}
                    variant={numericVal === amt ? 'primary' : 'secondary'}
                    size="sm"
                    style={styles.quickBtn}
                  />
                ))}
              </View>

              {/* Summary */}
              <View style={styles.summary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryKey}>Kas Awal</Text>
                  <Text style={styles.summaryVal}>{formatRupiah(numericVal)}</Text>
                </View>
              </View>

              {/* Action */}
              <Button
                label="Mulai Shift"
                onPress={handleOpen}
                loading={loading}
                fullWidth
                size="lg"
                style={{ marginTop: Spacing.lg }}
              />
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1 },
  container: {
    flex: 1,
    flexDirection: 'row',
    minHeight: '100%',
  },

  // ── Info Panel ──
  infoPanel: {
    flex: 1,
    backgroundColor: Colors.sky900,
    padding: 40,
    justifyContent: 'space-between',
  },
  infoTop: {
    marginBottom: Spacing.xxl,
  },
  shiftBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingVertical: 4,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    marginBottom: Spacing.lg,
  },
  shiftBadgeText: {
    color: Colors.white,
    fontSize: FontSize.caption,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  infoDate: {
    fontSize: FontSize.bodyLarge,
    color: Colors.sky200,
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  infoTime: {
    fontSize: 48,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    marginBottom: Spacing.xl,
  },
  infoCardTitle: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.semiBold,
    color: Colors.sky300,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  infoKey: { fontSize: FontSize.body, color: Colors.sky300 },
  infoVal: { fontSize: FontSize.body, color: Colors.white, fontWeight: FontWeight.medium },
  infoNote: {
    backgroundColor: 'rgba(14,165,233,0.15)',
    borderRadius: Radius.sm,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  infoNoteText: {
    fontSize: FontSize.caption,
    color: Colors.sky200,
    lineHeight: 18,
  },

  // ── Form Panel ──
  formPanel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  formCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xxxl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.lg,
  },
  formTitle: {
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  formSub: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  amountDisplay: {
    backgroundColor: Colors.sky900,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  amountLabel: {
    fontSize: FontSize.caption,
    color: Colors.sky300,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: FontSize.h1,
    fontWeight: FontWeight.bold,
    color: Colors.white,
  },
  inputGroup: { marginBottom: Spacing.lg },
  inputLabel: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    color: Colors.gray700,
    marginBottom: 6,
  },
  input: {
    height: 44,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.h4,
    color: Colors.textPrimary,
    fontWeight: FontWeight.semiBold,
  },
  quickLabel: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semiBold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  quickBtn: { flex: 1, minWidth: '45%' },
  summary: {
    backgroundColor: Colors.gray50,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryKey: { fontSize: FontSize.body, color: Colors.textSecondary },
  summaryVal: { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.textPrimary },
});
