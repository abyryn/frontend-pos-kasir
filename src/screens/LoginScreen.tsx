import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { Button, Toast, useToast } from '../components/ui';

interface Props {
  onLoginSuccess: () => void;
}

const PIN_LENGTH = 6;

export const LoginScreen: React.FC<Props> = ({ onLoginSuccess }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const { toast, show, hide } = useToast();

  const handlePinPress = (val: string) => {
    if (pin.length < PIN_LENGTH) setPin((p) => p + val);
  };

  const handlePinDelete = () => setPin((p) => p.slice(0, -1));

  const handleLogin = async () => {
    if (!employeeId.trim()) { show('Masukkan Employee ID.', 'error'); return; }
    if (pin.length < 4) { show('PIN minimal 4 digit.', 'error'); return; }
    setLoading(true);
    const result = await login(employeeId.trim(), pin);
    setLoading(false);
    if (result.success) {
      onLoginSuccess();
    } else {
      show(result.error ?? 'Login gagal.', 'error');
      setPin('');
    }
  };

  const pinPad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', '⌫'],
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hide} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.container}>

            {/* Left — Branding */}
            <View style={styles.brandPanel}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>POS</Text>
              </View>
              <Text style={styles.brandTitle}>POS Kasir</Text>
              <Text style={styles.brandSub}>Sistem Point of Sale</Text>
              <View style={styles.brandDivider} />
              <Text style={styles.brandDesc}>
                Masuk ke sistem kasir untuk{'\n'}memulai transaksi penjualan.
              </Text>
              <View style={styles.hint}>
                <Text style={styles.hintTitle}>Demo Login</Text>
                <Text style={styles.hintRow}>Kasir  : KSR001 / PIN 1234</Text>
                <Text style={styles.hintRow}>Manager: MGR001 / PIN 0000</Text>
              </View>
            </View>

            {/* Right — Login Form */}
            <View style={styles.formPanel}>
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Login Kasir</Text>
                <Text style={styles.formSub}>Masukkan ID dan PIN Anda</Text>

                {/* Employee ID */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Employee ID</Text>
                  <TextInput
                    style={styles.textInput}
                    value={employeeId}
                    onChangeText={setEmployeeId}
                    placeholder="Contoh: KSR001"
                    placeholderTextColor={Colors.textMuted}
                    autoCapitalize="characters"
                    returnKeyType="next"
                  />
                </View>

                {/* PIN Display */}
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>PIN</Text>
                  <View style={styles.pinDisplay}>
                    {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.pinDot,
                          pin.length > i && styles.pinDotFilled,
                        ]}
                      />
                    ))}
                  </View>
                </View>

                {/* PIN Pad */}
                <View style={styles.pinPad}>
                  {pinPad.map((row, ri) => (
                    <View key={ri} style={styles.pinRow}>
                      {row.map((key, ki) => (
                        <TouchableOpacity
                          key={ki}
                          style={[
                            styles.pinKey,
                            key === '' && styles.pinKeyEmpty,
                            key === '⌫' && styles.pinKeyDelete,
                          ]}
                          onPress={() => {
                            if (key === '⌫') handlePinDelete();
                            else if (key !== '') handlePinPress(key);
                          }}
                          disabled={key === ''}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.pinKeyText,
                              key === '⌫' && { color: Colors.danger },
                            ]}
                          >
                            {key}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))}
                </View>

                {/* Login Button */}
                <Button
                  label="Masuk"
                  onPress={handleLogin}
                  loading={loading}
                  fullWidth
                  size="lg"
                  style={{ marginTop: Spacing.lg }}
                />
              </View>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flexDirection: 'row',
    minHeight: '100%',
  },

  // ── Brand Panel ──
  brandPanel: {
    flex: 1,
    backgroundColor: Colors.sky900,
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 48,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  logoText: {
    color: Colors.white,
    fontSize: FontSize.h3,
    fontWeight: FontWeight.bold,
    letterSpacing: 1,
  },
  brandTitle: {
    fontSize: FontSize.h1,
    fontWeight: FontWeight.bold,
    color: Colors.white,
    marginBottom: 4,
  },
  brandSub: {
    fontSize: FontSize.bodyLarge,
    color: Colors.sky300,
    marginBottom: Spacing.xxl,
  },
  brandDivider: {
    width: 48,
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    marginBottom: Spacing.xxl,
  },
  brandDesc: {
    fontSize: FontSize.body,
    color: Colors.sky200,
    lineHeight: 22,
    marginBottom: 40,
  },
  hint: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: Radius.sm,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  hintTitle: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semiBold,
    color: Colors.sky300,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  hintRow: {
    fontSize: FontSize.caption,
    color: Colors.sky200,
    marginBottom: 2,
    fontFamily: 'monospace',
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
    fontSize: FontSize.h2,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  formSub: {
    fontSize: FontSize.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxl,
  },
  fieldGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    color: Colors.gray700,
    marginBottom: 6,
  },
  textInput: {
    height: 44,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
  },

  // ── PIN ──
  pinDisplay: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.gray300,
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pinPad: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  pinRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  pinKey: {
    width: 72,
    height: 52,
    backgroundColor: Colors.gray50,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  pinKeyEmpty: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  pinKeyDelete: {
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.danger + '40',
  },
  pinKeyText: {
    fontSize: FontSize.h4,
    fontWeight: FontWeight.semiBold,
    color: Colors.textPrimary,
  },
});
