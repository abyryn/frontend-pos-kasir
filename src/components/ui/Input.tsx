import React, { useState } from 'react';
import {
  View, TextInput, Text, StyleSheet,
  TextInputProps, ViewStyle,
} from 'react-native';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadow } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label, error, hint, containerStyle,
  leftIcon, rightIcon, ...props
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          focused && styles.inputFocused,
          error ? styles.inputError : undefined,
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, leftIcon ? { paddingLeft: 0 } : undefined]}
          placeholderTextColor={Colors.textMuted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.body,
    fontWeight: FontWeight.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    ...Shadow.sm,
  },
  inputFocused: {
    borderColor: Colors.primary,
    shadowColor: Colors.sky200,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  input: {
    flex: 1,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
    height: '100%',
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
  errorText: {
    fontSize: FontSize.caption,
    color: Colors.danger,
    marginTop: 4,
  },
  hintText: {
    fontSize: FontSize.caption,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
