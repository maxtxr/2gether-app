import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../theme';
import { useApp } from '../context/AppContext';
import { ConfirmModal } from '../components';

// Ícone de cada notificação conforme o que aconteceu
function iconFor(n) {
  const title = (n.title || '').toLowerCase();

  if (n.type === 'message') return 'chatbubble-ellipses-outline';
  if (title.includes('joined')) return 'person-add-outline';
  if (title.includes('spot')) return 'ticket-outline';
  if (title.includes('created')) return 'add-circle-outline';
  if (title.includes('reminder') || title.includes('coming up')) return 'calendar-outline';
  if (title.includes('review') || title.includes('how was it')) return 'star-outline';
  return 'notifications-outline';
}

// "14:05" para hoje/ontem; "19 Nov, 14:05" para datas mais antigas
function timeLabel(createdAt, showDate) {
  const date = new Date(createdAt);
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  if (!showDate) return time;

  const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${day}, ${time}`;
}

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
    showFeedback,
  } = useApp();

  const [confirmClear, setConfirmClear] = useState(false);

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

        {notifications.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {unreadCount > 0 && (
              <Pressable onPress={markAllRead} style={styles.action} accessibilityRole="button">
                <Text style={styles.actionText}>Mark all as read</Text>
              </Pressable>
            )}

            <Pressable onPress={() => setConfirmClear(true)} style={styles.action} accessibilityRole="button">
              <Text style={[styles.actionText, { color: colors.danger }]}>
                Clear all
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {groups.map(({ g, items }) => (
        <View key={g}>
          <Text style={styles.group}>{g}</Text>

          {items.map((n) => (
            <View key={n.id} style={styles.card}>
              <Pressable
                style={styles.cardMain}
                onPress={async () => {
                  try {
                    await markRead(n.id);

                    if (n.type === 'message' && n.eventId) {
                      const event = events.find((e) => e.id === n.eventId);

                      if (event?.host_id === user?.id) {
                        navigation.navigate('EventChats', {
                          eventId: n.eventId,
                        });
                      } else if (n.conversationId) {
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
                    } else if (n.eventId && iconFor(n) === 'star-outline') {
                      navigation.navigate('Review', { id: n.eventId });
                    } else if (n.eventId) {
                      navigation.navigate('EventDetail', {
                        id: n.eventId,
                      });
                    }
                  } catch (error) {
                    showFeedback({
                      title: 'Notification error',
                      message: error.message,
                      variant: 'danger',
                    });
                  }
                }}
                accessibilityRole="button"
              >
                <View style={styles.icon}>
                  <Ionicons
                    name={iconFor(n)}
                    size={18}
                    color={colors.green}
                  />
                </View>

                <View style={styles.content}>
                  <Text style={styles.cardTitle}>{n.title}</Text>
                  <Text style={styles.body}>{n.message}</Text>

                  <Text style={styles.time}>
                    {timeLabel(n.createdAt, g === 'Earlier')}
                  </Text>
                </View>

                {!n.read && <View style={styles.dot} />}
              </Pressable>

              <Pressable
                onPress={() => deleteNotification(n.id)}
                hitSlop={4}
                accessibilityRole="button"
                accessibilityLabel="Delete notification"
                style={styles.deleteBtn}
              >
                <Ionicons
                  name="trash-outline"
                  size={17}
                  color={colors.muted}
                />
              </Pressable>
            </View>
          ))}
        </View>
      ))}

      {notifications.length === 0 && (
        <Text style={styles.empty}>No new notifications</Text>
      )}

      <ConfirmModal
        visible={confirmClear}
        variant="danger"
        title="Clear all notifications?"
        message={`This will permanently delete ${notifications.length} ${notifications.length === 1 ? 'notification' : 'notifications'}.`}
        confirmText="Clear all"
        cancelText="Cancel"
        onConfirm={async () => {
          setConfirmClear(false);
          try {
            await clearNotifications();
          } catch (error) {
            showFeedback({
              title: 'Could not clear notifications',
              message: error.message,
              variant: 'danger',
            });
          }
        }}
        onCancel={() => setConfirmClear(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  sub: {
    color: colors.muted,
  },
  action: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
    backgroundColor: colors.chip,
  },
  actionText: {
    fontWeight: '700',
    color: colors.text,
    fontSize: 12,
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    alignSelf: 'center',
  },
  group: {
    fontWeight: '700',
    color: colors.text,
    marginTop: 14,
    marginBottom: 7,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    minHeight: 70,
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  icon: {
    width: 36,
    height: 36,
    flexShrink: 0,
    borderRadius: 18,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
    paddingVertical: 2,
  },
  cardTitle: {
    fontWeight: '700',
    color: colors.text,
    fontSize: 13,
  },
  body: {
    color: colors.text,
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
  },
  time: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    flexShrink: 0,
    borderRadius: 4,
    backgroundColor: colors.orange,
    marginLeft: 8,
  },
  empty: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 60,
  },
});