import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme';
import Button from './Button';

export default function ConfirmModal({
  visible,
  title = 'Done',
  message,
  confirmText = 'OK',
  cancelText,
  variant = 'success', // 'success' | 'danger'
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel || onConfirm}
    >
      <Pressable style={styles.backdrop} onPress={onCancel || onConfirm}>
        <Pressable style={styles.box} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.iconCircle, variant === 'danger' && styles.iconDanger]}>
            <Ionicons
              name={variant === 'danger' ? 'alert-circle' : 'checkmark-circle'}
              size={44}
              color={variant === 'danger' ? colors.danger : colors.green}
            />
          </View>

          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          <View style={styles.buttonStack}>
            <Button
              title={confirmText}
              variant={variant === 'danger' ? 'danger' : 'primary'}
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
  iconDanger: {
    tintColor: colors.danger,
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