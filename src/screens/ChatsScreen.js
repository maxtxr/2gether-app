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

export default function ChatsScreen({ navigation }) {
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
      <View style={styles.heading}>
        <Text style={styles.title}>Chats</Text>
        <Text style={styles.subtitle}>
          Your conversations with hosts and participants
        </Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No chats yet. Join an event and message the host to start one.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
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
              size={44}
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
                {new Date(item.lastMessageAt).toLocaleString()}
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
              size={20}
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
  heading: {
    padding: 16,
    paddingBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    color: colors.muted,
    marginTop: 4,
  },
  empty: {
    textAlign: 'center',
    color: colors.muted,
    marginTop: 40,
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  details: {
    flex: 1,
    marginLeft: 12,
    marginRight: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontWeight: '700',
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
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginRight: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
