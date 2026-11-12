import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../theme';
import { useApp } from '../context/AppContext';

export default function NotificationsScreen({ navigation }) {
  const { notifications, unreadCount, markAllRead, markRead, deleteNotification, clearNotifications } = useApp();
  const groups = ['Today', 'Yesterday'].map((g) => ({ g, items: notifications.filter((n) => n.group === g) })).filter((x) => x.items.length);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Notifications</Text>
      <View style={styles.row}>
        <Text style={styles.sub}>{unreadCount} unread</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable onPress={markAllRead} style={styles.action} accessibilityRole="button"><Text style={styles.actionText}>Mark all as read</Text></Pressable>
          <Pressable onPress={clearNotifications} style={styles.action} accessibilityRole="button"><Text style={[styles.actionText, { color: colors.danger }]}>Clear all</Text></Pressable>
        </View>
      </View>

      {groups.map(({ g, items }) => (
        <View key={g}>
          <Text style={styles.group}>{g}</Text>
          {items.map((n) => (
            <Pressable
              key={n.id}
              style={styles.card}
              onPress={() => { markRead(n.id); if (n.eventId) navigation.navigate('EventDetail', { id: n.eventId }); }}
              accessibilityRole="button"
            >
              <View style={styles.icon}><Ionicons name={n.icon} size={20} color={colors.green} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{n.title}</Text>
                <Text style={styles.body}>{n.body}</Text>
                <Text style={styles.time}>{n.time}</Text>
              </View>
              {n.unread && <View style={styles.dot} />}
              <Pressable onPress={(e) => { e.stopPropagation(); deleteNotification(n.id); }} hitSlop={4} accessibilityLabel="Delete notification" style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={20} color={colors.muted} />
              </Pressable>
            </Pressable>
          ))}
        </View>
      ))}

      {notifications.length === 0 && <Text style={styles.empty}>No new notifications</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '800', color: colors.green },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  sub: { color: colors.muted },
  action: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: radii.pill, backgroundColor: colors.chip },
  actionText: { fontWeight: '700', color: colors.text, fontSize: 13 },
  deleteBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  group: { fontWeight: '700', color: colors.text, marginTop: 14, marginBottom: 8 },
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 10 },
  icon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  cardTitle: { fontWeight: '700', color: colors.text },
  body: { color: colors.text, marginTop: 2, fontSize: 13 },
  time: { color: colors.muted, fontSize: 12, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.orange, marginTop: 6, marginRight: 4 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 60 },
});
