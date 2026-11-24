import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme';
import Button from './Button';

// Different feedback moments need different signals:
// - success  → something worked (check)
// - danger   → something failed (alert)
// - info     → neutral explanation (i)
// - question → asking for confirmation (no checkmark!)
const VARIANTS = {
  success: {
    icon: 'checkmark-circle',
    color: colors.green,
  },
  danger: {
    icon: 'alert-circle',
    color: colors.danger,
  },
  warning: {
    icon: 'alert-circle',
    color: colors.orange,
  },
  info: {
    icon: 'information-circle',
    color: colors.greenLight,
  },
  question: {
    icon: 'help-circle',
    color: colors.orange,
  },
};

export default function ConfirmModal({
  visible,
  title = 'Done',
  message,
  confirmText = 'OK',
  cancelText,
  variant = 'success', // 'success' | 'danger' | 'warning' | 'info' | 'question'
  confirmVariant,
  onConfirm,
  onCancel,
  children,
}) {
  const look = VARIANTS[variant] || VARIANTS.success;
  const actionVariant =
    confirmVariant || (variant === 'danger' ? 'danger' : 'primary');

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel || onConfirm}
    >
      <Pressable style={styles.backdrop} onPress={onCancel || onConfirm}>
        <Pressable
          style={styles.box}
          onPress={(e) => e.stopPropagation()}
          accessibilityViewIsModal
        >
          <View style={styles.iconCircle}>
            <Ionicons name={look.icon} size={44} color={look.color} />
          </View>

          {!!title && <Text style={styles.title}>{title}</Text>}
          {!!message ? <Text style={styles.message}>{message}</Text> : null}
          {children}

          <View style={styles.buttonStack}>
            <Button
              title={confirmText}
              variant={actionVariant}
              onPress={onConfirm}
              style={styles.actionBtn}
            />
            {cancelText && (
              <Button
                title={cancelText}
                variant="ghost"
                onPress={onCancel}
                style={[styles.actionBtn, { marginTop: spacing.xs }]}
              />
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  box: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  iconCircle: {
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: colors.muted,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonStack: {
    width: '100%',
    marginTop: spacing.lg,
  },
  actionBtn: {
    width: '100%',
  },
});
