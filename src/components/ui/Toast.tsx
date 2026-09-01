import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '../../theme';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onHide?: () => void;
}

const typeStyles: Record<ToastType, { bg: string; text: string; icon: string }> = {
  success: { bg: Colors.success,  text: Colors.white, icon: '✓' },
  error:   { bg: Colors.danger,   text: Colors.white, icon: '✕' },
  warning: { bg: Colors.warning,  text: Colors.white, icon: '⚠' },
  info:    { bg: Colors.primary,  text: Colors.white, icon: 'ℹ' },
};

export const Toast: React.FC<ToastProps> = ({
  visible, message, type = 'success', duration = 3000, onHide,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(duration - 400),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => onHide?.());
    }
  }, [visible]);

  if (!visible) return null;

  const ts = typeStyles[type];
  return (
    <Animated.View style={[styles.toast, { backgroundColor: ts.bg, opacity }]}>
      <Text style={[styles.icon, { color: ts.text }]}>{ts.icon}</Text>
      <Text style={[styles.message, { color: ts.text }]}>{message}</Text>
    </Animated.View>
  );
};

// Toast manager hook
interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

export const useToast = () => {
  const [toast, setToast] = React.useState<ToastState>({
    visible: false, message: '', type: 'success',
  });

  const show = (message: string, type: ToastType = 'success') => {
    setToast({ visible: true, message, type });
  };
  const hide = () => setToast((prev) => ({ ...prev, visible: false }));

  return { toast, show, hide };
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: Spacing.xxl,
    right: Spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.sm,
    zIndex: 9999,
    ...Shadow.md,
  },
  icon: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.bold,
  },
  message: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    maxWidth: 300,
  },
});
