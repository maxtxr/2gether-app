import { Modal, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import Button from './Button';

export default function ConfirmModal({ visible, title = 'Your action was confirmed', message, onConfirm }) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onConfirm}>
      <View style={styles.backdrop}>
        <View style={styles.box}>
          <Ionicons name="checkmark-circle" size={48} color={colors.green} />
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <Button title="Confirm" onPress={onConfirm} style={{ alignSelf: 'stretch', marginTop: 16 }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  box: { backgroundColor: colors.card, borderRadius: 20, padding: 24, alignItems: 'center', alignSelf: 'stretch' },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 8, textAlign: 'center' },
  message: { color: colors.muted, marginTop: 6, textAlign: 'center' },
});
