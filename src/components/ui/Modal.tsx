import React from 'react';
import {
  Modal as RNModal, View, Text, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Shadow, Spacing } from '../../theme';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number | string;
}

export const Modal: React.FC<ModalProps> = ({
  visible, onClose, title, children, footer, width = 480,
}) => {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.container, { width: width as number }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
                <Text style={styles.closeX}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Body */}
            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>

            {/* Footer */}
            {footer && (
              <>
                <View style={styles.divider} />
                <View style={styles.footer}>{footer}</View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.40)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    maxHeight: '90%',
    ...Shadow.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.h4,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeX: {
    fontSize: 12,
    color: Colors.gray500,
    fontWeight: FontWeight.semiBold,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  body: {
    padding: Spacing.xxl,
    maxHeight: 500,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
});
