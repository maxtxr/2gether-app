import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme';
import { useApp } from '../context/AppContext';
import { Avatar } from '../components';
import { supabase } from '../../lib/supabase';

export default function ChatsListScreen({ navigation }) {
  const { loadUserConversations, showFeedback } = useApp();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await loadUserConversations();
      setConversations(data);
    } catch (error) {
      showFeedback({
        title: 'Error loading chats',
        message: error.message,
        variant: 'danger',
      });
    } finally {
      setLoading(false);
    }
  }, [loadUserConversations, showFeedback]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      setLoading(true);

      load().finally(() => {
        if (mounted) setLoading(false);
      });

      const channel = supabase
        .channel('user-chats-inbox')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
          },
          () => {
            load();
          }
        )
        .subscribe();

      return () => {
        mounted = false;
        supabase.removeChannel(channel);
      };
    }, [load])
  );

  if (loading && conversations.length === 0) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          conversations.length > 0 ? (
            <Text style={styles.subtitle}>
              Conversations with hosts and participants
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="chatbubbles-outline"
              size={48}
              color={colors.muted}
            />
            <Text style={styles.empty}>
              No chats yet. Join an event and message the host to start one.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() =>
              navigation.navigate('Chat', {
                conversationId: item.id,
                eventId: item.event_id,
                otherName: item.otherName,
              })
            }
            accessibilityRole="button"
            accessibilityLabel={`Chat with ${item.otherName} about ${item.eventTitle}`}
          >
            <Avatar
              source={item.otherAvatarUrl}
              name={item.otherName}
              size={46}
            />

            <View style={styles.details}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.otherName}
                </Text>
                {item.isHost && (
                  <View style={styles.hostChip}>
                    <Text style={styles.hostChipText}>Hosting</Text>
                  </View>
                )}
              </View>

              <Text style={styles.eventTitle} numberOfLines={1}>
                {item.eventTitle}
              </Text>

              <Text style={styles.message} numberOfLines={1}>
                {item.lastMessage}
              </Text>

              <Text style={styles.time}>
                {new Date(item.lastMessageAt).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>

            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}

            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.muted}
            />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 12,
    marginLeft: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 24,
  },
  empty: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 12,
    lineHeight: 20,
    fontSize: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  cardPressed: {
    backgroundColor: '#F9FAFB',
  },
  details: {
    flex: 1,
    marginLeft: 12,
    marginRight: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontWeight: '700',
    fontSize: 15,
    color: colors.text,
    flexShrink: 1,
  },
  hostChip: {
    backgroundColor: '#E8F2EC',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  hostChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.green,
  },
  eventTitle: {
    color: colors.green,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  message: {
    color: colors.muted,
    marginTop: 3,
    fontSize: 13,
  },
  time: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 4,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    marginRight: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});