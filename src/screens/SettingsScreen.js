import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../theme';
import { useApp } from '../context/AppContext';

const ROWS = [
  { label: 'Language', value: 'English' },
  { label: 'Time format', value: '24 h' },
  { label: 'Accessibility', value: '' },
  { label: 'Theme', value: 'Light' },
  { label: 'Notifications', value: 'On' },
];

export default function SettingsScreen() {
  const { logout } = useApp();

  const deleteAccount = () =>
    Alert.alert('Delete account', 'This will remove your account. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: logout },
    ]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      {ROWS.map((r) => (
        <Pressable key={r.label} style={styles.row} onPress={() => Alert.alert(r.label, 'Coming soon.')} accessibilityRole="button">
          <Text style={styles.label}>{r.label}</Text>
          <Text style={styles.value}>{r.value}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>
      ))}

      <Pressable style={[styles.row, { marginTop: 24 }]} onPress={logout} accessibilityRole="button">
        <Ionicons name="log-out-outline" size={20} color={colors.text} />
        <Text style={[styles.label, { marginLeft: 10 }]}>Log out</Text>
      </Pressable>
      <Pressable style={styles.row} onPress={deleteAccount} accessibilityRole="button">
        <Ionicons name="trash-outline" size={20} color={colors.danger} />
        <Text style={[styles.label, { marginLeft: 10, color: colors.danger }]}>Delete account</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: radii.pill, padding: 16, marginBottom: 8 },
  label: { flex: 1, fontWeight: '600', color: colors.text },
  value: { color: colors.muted, marginRight: 6 },
});
