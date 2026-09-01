import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '../../theme';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'pending';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  dot?: boolean;
}

const variantMap: Record<BadgeVariant, { bg: string; text: string }> = {
  success: { bg: Colors.successBg,  text: Colors.successText },
  warning: { bg: Colors.warningBg,  text: Colors.warningText },
  danger:  { bg: Colors.dangerBg,   text: Colors.dangerText },
  info:    { bg: Colors.infoBg,     text: Colors.primaryDark },
  neutral: { bg: Colors.gray100,    text: Colors.gray600 },
  pending: { bg: Colors.infoBg,     text: Colors.primaryHover },
};

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral', style, dot }) => {
  const v = variantMap[variant];
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }, style]}>
      {dot && <View style={[styles.dot, { backgroundColor: v.text }]} />}
      <Text style={[styles.text, { color: v.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: FontSize.caption,
    fontWeight: FontWeight.semiBold,
  },
});
