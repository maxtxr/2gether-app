import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../theme';
import { useApp } from '../context/AppContext';

const PREFERENCES = [
  { icon: 'globe-outline', label: 'Language', value: 'English' },
  { icon: 'time-outline', label: 'Time format', value: '24 h' },
  { icon: 'color-palette-outline', label: 'Theme', value: 'Light' },
  { icon: 'notifications-outline', label: 'Notifications', isToggle: true },
];

export default function SettingsScreen({ navigation }) {
  const { logout, deleteAccount, showFeedback } = useApp();
  const [deleting, setDeleting] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const confirmDeleteAccount = () =>
    showFeedback({
      title: 'Delete account?',
      message:
        'This will permanently delete your account and profile data. This cannot be undone.',
      variant: 'danger',
      confirmText: 'Delete account',
      confirmVariant: 'danger',
      cancelText: 'Keep my account',
      onConfirm: async () => {
        if (deleting) return;
        setDeleting(true);
        try {
          await deleteAccount();
        } catch (error) {
          showFeedback({
            title: 'Could not delete account',
            message: error?.message || 'Something went wrong.',
            variant: 'danger',
          });
          setDeleting(false);
        }
      },
    });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.sectionTitle}>PREFERENCES</Text>
      <View style={styles.card}>
        {PREFERENCES.map((item, index) => {
          const isLast = index === PREFERENCES.length - 1;

          if (item.isToggle) {
            return (
              <View
                key={item.label}
                style={[styles.row, !isLast && styles.rowDivider]}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={colors.muted}
                  style={styles.rowIcon}
                />
                <Text style={styles.label}>{item.label}</Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#D1D5DB', true: colors.green }}
                  thumbColor="#FFFFFF"
                  style={styles.switch}
                />
              </View>
            );
          }

          return (
            <Pressable
              key={item.label}
              style={({ pressed }) => [
                styles.row,
                !isLast && styles.rowDivider,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
            >
              <Ionicons
                name={item.icon}
                size={18}
                color={colors.muted}
                style={styles.rowIcon}
              />
              <Text style={styles.label}>{item.label}</Text>
              {!!item.value && <Text style={styles.value}>{item.value}</Text>}
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>LEGAL & PRIVACY</Text>
      <View style={styles.card}>
        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          onPress={() => navigation.navigate('Legal')}
          accessibilityRole="button"
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={18}
            color={colors.muted}
            style={styles.rowIcon}
          />
          <Text style={styles.label}>Terms & Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.muted} />
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>ACCOUNT</Text>
      <View style={styles.card}>
        <Pressable
          style={({ pressed }) => [
            styles.row,
            styles.rowDivider,
            pressed && styles.pressed,
          ]}
          onPress={logout}
          disabled={deleting}
          accessibilityRole="button"
        >
          <Ionicons
            name="log-out-outline"
            size={18}
            color={colors.text}
            style={styles.rowIcon}
          />
          <Text style={styles.label}>Log out</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          onPress={confirmDeleteAccount}
          disabled={deleting}
          accessibilityRole="button"
        >
          {deleting ? (
            <ActivityIndicator
              size="small"
              color={colors.danger}
              style={styles.rowIcon}
            />
          ) : (
            <Ionicons
              name="trash-outline"
              size={18}
              color={colors.danger}
              style={styles.rowIcon}
            />
          )}
          <Text style={[styles.label, { color: colors.danger }]}>
            {deleting ? 'Deleting…' : 'Delete account'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg || '#F8FAF9',
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: radii.md || 16,
    borderWidth: 1,
    borderColor: colors.border || '#E5E7EB',
    marginBottom: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border || '#E5E7EB',
  },
  rowIcon: {
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontWeight: '600',
    fontSize: 14,
    color: colors.text,
  },
  value: {
    color: colors.muted,
    fontSize: 13,
    marginRight: 8,
  },
  switch: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
    marginRight: -4,
  },
  pressed: {
    backgroundColor: '#F9FAFB',
  },
});