import React from 'react';
import {
  TouchableOpacity, Text, StyleSheet, ActivityIndicator,
  ViewStyle, TextStyle, View,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../../theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary:   { bg: Colors.primary,   text: Colors.white },
  secondary: { bg: Colors.white,     text: Colors.gray700, border: Colors.gray300 },
  danger:    { bg: Colors.danger,    text: Colors.white },
  ghost:     { bg: 'transparent',    text: Colors.primary },
  outline:   { bg: 'transparent',    text: Colors.primary, border: Colors.primary },
};

const sizeStyles: Record<Size, { height: number; paddingH: number; fontSize: number }> = {
  sm: { height: 32, paddingH: Spacing.md, fontSize: FontSize.bodySmall },
  md: { height: 40, paddingH: Spacing.lg, fontSize: FontSize.button },
  lg: { height: 48, paddingH: Spacing.xl, fontSize: FontSize.button },
  xl: { height: 56, paddingH: Spacing.xxl, fontSize: FontSize.bodyLarge },
};

export const Button: React.FC<ButtonProps> = ({
  label, onPress, variant = 'primary', size = 'md',
  disabled = false, loading = false, fullWidth = false,
  icon, style, textStyle,
}) => {
  const vs = variantStyles[variant];
  const ss = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        {
          backgroundColor: vs.bg,
          height: ss.height,
          paddingHorizontal: ss.paddingH,
          borderWidth: vs.border ? 1 : 0,
          borderColor: vs.border,
          opacity: disabled ? 0.5 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={vs.text} size="small" />
      ) : (
        <View style={styles.inner}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={[styles.label, { color: vs.text, fontSize: ss.fontSize }, textStyle]}>
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconWrap: {
    marginRight: 4,
  },
  label: {
    fontWeight: FontWeight.semiBold,
  },
});
