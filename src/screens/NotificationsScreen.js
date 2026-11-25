import { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii } from '../theme';
import { useApp } from '../context/AppContext';
import { ConfirmModal } from '../components';

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
        return date.toDateString() === new Date().toDateString();
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

        return (
          date.toDateString() !== new Date().toDateString() &&
          date.toDateString() !== yesterday.toDateString()
        );
      }),
    },
  ].filter((group) => group.items.length > 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Bar with Counter and Bulk Actions */}
      <View style={styles.topBar}>
        <Text style={styles.sub}>
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        </Text>

        {notifications.length > 0 && (
          <View style={styles.actionsGroup}>
            {unreadCount > 0 && (
              <Pressable
                onPress={markAllRead}
                style={styles.actionBtn}
                accessibilityRole="button"
              >
                <Text style={styles.actionText}>Mark all as read</Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => setConfirmClear(true)}
              style={styles.actionBtn}
              accessibilityRole="button"
            >
              <Text style={[styles.actionText, { color: colors.danger }]}>
                Clear all
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {groups.map(({ g, items }) => (
        <View key={g}>
          <Text style={styles.groupHeading}>{g}</Text>

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
                        navigation.navigate('EventChats', { eventId: n.eventId });
                      } else if (n.conversationId) {
                        navigation.navigate('Chat', {
                          conversationId: n.conversationId,
                          eventId: n.eventId,
                          otherName: event?.host,
                        });
                      } else {
                        navigation.navigate('EventDetail', { id: n.eventId });
                      }
                    } else if (n.eventId && iconFor(n) === 'star-outline') {
                      navigation.navigate('Review', { id: n.eventId });
                    } else if (n.eventId) {
                      navigation.navigate('EventDetail', { id: n.eventId });
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
                  <Ionicons name={iconFor(n)} size={18} color={colors.green} />
                </View>

                <View style={styles.contentArea}>
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
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Delete notification"
                style={styles.deleteBtn}
              >
                <Ionicons name="trash-outline" size={16} color={colors.muted} />
              </Pressable>
            </View>
          ))}
        </View>
      ))}

      {notifications.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={48} color={colors.muted} />
          <Text style={styles.empty}>No notifications</Text>
        </View>
      )}

      <ConfirmModal
        visible={confirmClear}
        variant="danger"
        title="Clear all notifications?"
        message={`This will permanently delete ${notifications.length} ${
          notifications.length === 1 ? 'notification' : 'notifications'
        }.`}
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
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sub: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  actionsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.chip,
  },
  actionText: {
    fontWeight: '700',
    color: colors.text,
    fontSize: 12,
  },
  groupHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 14,
    marginBottom: 8,
    marginLeft: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
  contentArea: {
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
    marginRight: 4,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  empty: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 10,
    fontSize: 14,
  },
});