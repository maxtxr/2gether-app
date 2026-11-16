import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../theme';
import { useApp } from '../context/AppContext';

export default function NotificationsScreen({ navigation }) {
  const {
    notifications,
    unreadCount,
    markAllRead,
    markRead,
    deleteNotification,
    clearNotifications,
    events,
    user,
  } = useApp();

  const groups = [
    {
      g: 'Today',
      items: notifications.filter((n) => {
        const date = new Date(n.createdAt);
        const today = new Date();

        return date.toDateString() === today.toDateString();
      }),
    },
    {
      g: 'Yesterday',
      items: notifications.filter((n) => {
        const date = new Date(n.createdAt);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        return date.toDateString() === yesterday.toDateString();
      }),
    },
    {
      g: 'Earlier',
      items: notifications.filter((n) => {
        const date = new Date(n.createdAt);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        return date.toDateString() !== new Date().toDateString()
          && date.toDateString() !== yesterday.toDateString();
      }),
    },
  ].filter((group) => group.items.length > 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16 }}
    >
      <Text style={styles.title}>Notifications</Text>

      <View style={styles.row}>
        <Text style={styles.sub}>{unreadCount} unread</Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable onPress={markAllRead} style={styles.action}>
            <Text style={styles.actionText}>Mark all as read</Text>
          </Pressable>

          <Pressable onPress={clearNotifications} style={styles.action}>
            <Text style={[styles.actionText, { color: colors.danger }]}>
              Clear all
            </Text>
          </Pressable>
        </View>
      </View>

      {groups.map(({ g, items }) => (
        <View key={g}>
          <Text style={styles.group}>{g}</Text>

          {items.map((n) => (
            <Pressable
              key={n.id}
              style={styles.card}
              onPress={async () => {
                try {
                  await markRead(n.id);

                  if (n.type === 'message' && n.eventId) {
                    const event = events.find((e) => e.id === n.eventId);

                    if (event?.host_id === user?.id) {
                      // O utilizador é o organizador
                      navigation.navigate('EventChats', {
                        eventId: n.eventId,
                      });
                    } else if (n.conversationId) {
                      // O utilizador é o participante
                      navigation.navigate('Chat', {
                        conversationId: n.conversationId,
                        eventId: n.eventId,
                        otherName: event?.host,
                      });
                    } else {
                      navigation.navigate('EventDetail', {
                        id: n.eventId,
                      });
                    }
                  } else if (n.eventId) {
                    navigation.navigate('EventDetail', {
                      id: n.eventId,
                    });
                  }
                } catch (error) {
                  Alert.alert('Notification error', error.message);
                }
              }}
              accessibilityRole="button"
            >
              <View style={styles.icon}>
                <Ionicons
                  name="notifications-outline"
                  size={20}
                  color={colors.green}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{n.title}</Text>
                <Text style={styles.body}>{n.message}</Text>

                <Text style={styles.time}>
                  {new Date(n.createdAt).toLocaleString()}
                </Text>
              </View>

              {!n.read && <View style={styles.dot} />}

              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  deleteNotification(n.id);
                }}
                hitSlop={4}
                accessibilityLabel="Delete notification"
                style={styles.deleteBtn}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={colors.muted}
                />
              </Pressable>
            </Pressable>
          ))}
        </View>
      ))}

      {notifications.length === 0 && (
        <Text style={styles.empty}>No new notifications</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  title: { fontSize: 24, fontWeight: '800', color: colors.green },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  sub: { color: colors.muted },
  action: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.chip,
  },
  actionText: { fontWeight: '700', color: colors.text, fontSize: 13 },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  group: {
    fontWeight: '700',
    color: colors.text,
    marginTop: 14,
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardTitle: { fontWeight: '700', color: colors.text },
  body: { color: colors.text, marginTop: 2, fontSize: 13 },
  time: { color: colors.muted, fontSize: 12, marginTop: 4 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.orange,
    marginTop: 6,
    marginRight: 4,
  },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 60 },
});
